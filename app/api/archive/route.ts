import { NextRequest, NextResponse } from 'next/server';
import { demoItems } from '@/lib/demo';
import { isAdminRequest } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase';
import type { ArchiveItem } from '@/lib/types';

function fromRow(row: any): ArchiveItem {
  return {
    id: row.id,
    kind: row.kind,
    yearStart: row.year_start,
    yearEnd: row.year_end,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    variant: row.variant,
    manufacturer: row.manufacturer,
    sponsor: row.sponsor,
    colors: row.colors || [],
    sourceUrl: row.source_url,
    published: row.published,
    metadata: row.metadata || {},
    media: (row.media_assets || []).map((m:any) => ({
      id:m.id,
      url:m.url,
      thumbUrl:m.thumb_url,
      alt:m.alt,
      author:m.author,
      license:m.license,
      sourceUrl:m.source_url,
      rightsStatus:m.rights_status
    }))
  };
}

export async function GET(req: NextRequest) {
  const supabase = getServerSupabase();
  const kind = req.nextUrl.searchParams.get('kind');
  const year = Number(req.nextUrl.searchParams.get('year') || 0);

  if (!supabase) {
    let items = demoItems;
    if (kind) items = items.filter(i => i.kind === kind);
    if (year) items = items.filter(i => i.yearStart <= year && (i.yearEnd ?? i.yearStart) >= year);
    return NextResponse.json({ mode: 'demo', items });
  }

  let q = supabase.from('archive_items').select('*,media_assets(*)').eq('published', true).order('year_start');
  if (kind) q = q.eq('kind', kind);
  if (year) q = q.lte('year_start', year).gte('year_end', year);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mode: 'supabase', items: (data || []).map(fromRow) });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Sessão administrativa inválida ou expirada.' }, { status: 401 });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Configure SUPABASE_URL e SUPABASE_SECRET_KEY na Vercel.' },
      { status: 503 }
    );
  }

  const body = await req.json();
  const row = {
    id: body.id,
    kind: body.kind,
    year_start: body.yearStart,
    year_end: body.yearEnd ?? body.yearStart,
    title: body.title,
    subtitle: body.subtitle ?? null,
    description: body.description ?? null,
    variant: body.variant ?? null,
    manufacturer: body.manufacturer ?? null,
    sponsor: body.sponsor ?? null,
    colors: body.colors ?? [],
    source_url: body.sourceUrl ?? null,
    published: !!body.published,
    metadata: body.metadata ?? {}
  };

  const { data, error } = await supabase.from('archive_items').upsert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
