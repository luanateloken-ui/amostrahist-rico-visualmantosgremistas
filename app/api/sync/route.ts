import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase';
import { fetchCommonsKits } from '@/lib/sources/commons';
import { fetchFootballKitArchive } from '@/lib/sources/football-kits';
import { fetchCamisasDoGremio } from '@/lib/sources/camisas';
import { fetchSuppliers } from '@/lib/sources/suppliers';
import { fetchGremio1903 } from '@/lib/sources/gremio1903';
import { fetchCommonsSymbols } from '@/lib/sources/symbols';
import type { ArchiveItem } from '@/lib/types';

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
    if (source === 'commons') items = await fetchCommonsKits(body.limit || 100);
    else if (source === 'football-kits') items = await fetchFootballKitArchive();
    else if (source === 'camisas') items = await fetchCamisasDoGremio(body.page || 1);
    else if (source === 'suppliers') items = await fetchSuppliers();
    else if (source === 'gremio1903') items = await fetchGremio1903();
    else if (source === 'symbols') items = await fetchCommonsSymbols();
    else return NextResponse.json({ error:'Fonte inválida' }, { status:400 });

    if (items.length) {
      const { error } = await sb.from('archive_items').upsert(items.map(row));
      if (error) return NextResponse.json({ error:error.message }, { status:500 });

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

      for (const media of mediaRows) {
        const { error } = await sb.from('media_assets').upsert(media, { onConflict:'archive_item_id,url' });
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
