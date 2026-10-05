import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAdminRequest } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase';
import { fetchCommonsKits } from '@/lib/sources/commons';
import { fetchFootballKitArchive } from '@/lib/sources/football-kits';
import { fetchCamisasDoGremio } from '@/lib/sources/camisas';
import { fetchSuppliers } from '@/lib/sources/suppliers';
import { fetchGremio1903 } from '@/lib/sources/gremio1903';
import { fetchCommonsSymbols } from '@/lib/sources/symbols';
import type { ArchiveItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function row(i: ArchiveItem) {
  return {
    id:i.id,
    kind:i.kind,
    year_start:i.yearStart,
    year_end:i.yearEnd ?? i.yearStart,
    title:i.title,
    subtitle:i.subtitle ?? null,
    description:i.description ?? null,
    variant:i.variant ?? null,
    manufacturer:i.manufacturer ?? null,
    sponsor:i.sponsor ?? null,
    colors:i.colors ?? [],
    source_url:i.sourceUrl ?? null,
    published:!!i.published,
    metadata:i.metadata ?? {}
  };
}

function chunk<T>(items:T[], size=200):T[][] {
  const out:T[][] = [];
  for (let i=0; i<items.length; i+=size) out.push(items.slice(i, i+size));
  return out;
}

function hasText(value:unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Uma nova sincronização NÃO deve apagar o trabalho de curadoria do admin.
 * Se o banco já tem um valor preenchido manualmente, ele é preservado.
 * Valores novos da fonte entram apenas onde o registro ainda estava vazio.
 */
function mergeWithExisting(incoming:ReturnType<typeof row>, existing:any) {
  if (!existing) return incoming;

  const existingMetadata = existing.metadata || {};
  const incomingMetadata = incoming.metadata || {};

  return {
    id:incoming.id,
    kind:existing.kind || incoming.kind,
    year_start:existing.year_start ?? incoming.year_start,
    year_end:existing.year_end ?? incoming.year_end,
    title:hasText(existing.title) ? existing.title : incoming.title,
    subtitle:hasText(existing.subtitle) ? existing.subtitle : incoming.subtitle,
    description:hasText(existing.description) ? existing.description : incoming.description,
    variant:hasText(existing.variant) ? existing.variant : incoming.variant,
    manufacturer:hasText(existing.manufacturer) ? existing.manufacturer : incoming.manufacturer,
    sponsor:hasText(existing.sponsor) ? existing.sponsor : incoming.sponsor,
    colors:Array.isArray(existing.colors) && existing.colors.length ? existing.colors : incoming.colors,
    source_url:hasText(existing.source_url) ? existing.source_url : incoming.source_url,
    // Se alguém publicou manualmente, uma nova sincronização nunca volta o item para rascunho.
    published:!!existing.published || !!incoming.published,
    metadata:{
      ...incomingMetadata,
      ...existingMetadata,
      sourceLastSyncAt:new Date().toISOString()
    }
  };
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error:'Sessão administrativa inválida ou expirada.' }, { status:401 });
  }

  const sb = getServerSupabase();
  if (!sb) {
    return NextResponse.json(
      { error:'Configure SUPABASE_URL e SUPABASE_SECRET_KEY na Vercel.' },
      { status:503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const source = body.source || 'commons';
  let items: ArchiveItem[] = [];

  try {
    if (source === 'commons') {
      const requestedLimit = typeof body.limit === 'number' && body.limit > 0 ? body.limit : undefined;
      items = await fetchCommonsKits(requestedLimit);
    }
    else if (source === 'football-kits') items = await fetchFootballKitArchive();
    else if (source === 'camisas') items = await fetchCamisasDoGremio(body.page || 1);
    else if (source === 'suppliers') items = await fetchSuppliers();
    else if (source === 'gremio1903') items = await fetchGremio1903();
    else if (source === 'symbols') items = await fetchCommonsSymbols();
    else return NextResponse.json({ error:'Fonte inválida' }, { status:400 });

    if (items.length) {
      const ids = items.map(i => i.id);
      const existingById = new Map<string, any>();

      // Carrega o que já existe para não sobrescrever curadoria/manual com null.
      for (const idBatch of chunk(ids, 200)) {
        const { data, error } = await sb.from('archive_items').select('*').in('id', idBatch);
        if (error) return NextResponse.json({ error:error.message }, { status:500 });
        for (const existing of data || []) existingById.set(existing.id, existing);
      }

      const mergedRows = items.map(item => {
        const incoming = row(item);
        return mergeWithExisting(incoming, existingById.get(item.id));
      });

      for (const rows of chunk(mergedRows, 200)) {
        const { error } = await sb.from('archive_items').upsert(rows);
        if (error) return NextResponse.json({ error:error.message }, { status:500 });
      }

      const mediaRows = items.flatMap(i => (i.media || []).map((m, idx) => ({
        archive_item_id:i.id,
        url:m.url,
        thumb_url:m.thumbUrl ?? null,
        alt:m.alt ?? null,
        author:m.author ?? null,
        license:m.license ?? null,
        source_url:m.sourceUrl ?? i.sourceUrl ?? null,
        rights_status:m.rightsStatus ?? 'unknown',
        position:idx
      })));

      // Mídias novas são adicionadas/atualizadas; não apagamos uploads feitos manualmente.
      for (const rows of chunk(mediaRows, 200)) {
        const { error } = await sb.from('media_assets').upsert(rows, { onConflict:'archive_item_id,url' });
        if (error) return NextResponse.json({ error:error.message }, { status:500 });
      }
    }

    const { error: sourceError } = await sb.from('sources').upsert({
      key:source,
      label:source,
      last_sync_at:new Date().toISOString(),
      enabled:true
    });
    if (sourceError) return NextResponse.json({ error:sourceError.message }, { status:500 });

    revalidatePath('/');
    revalidatePath('/admin');

    return NextResponse.json({
      ok:true,
      source,
      imported:items.length,
      autoPublished:items.filter(i => i.published).length,
      reviewRequired:items.filter(i => !i.published).length
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro inesperado durante a sincronização.' },
      { status: 502 }
    );
  }
}
