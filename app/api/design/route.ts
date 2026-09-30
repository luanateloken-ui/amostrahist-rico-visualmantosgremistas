import { NextRequest, NextResponse } from 'next/server';
import { defaultDesign } from '@/lib/demo';
import { getAdminSupabase, getPublicSupabase } from '@/lib/supabase';

export async function GET() {
  const sb = getPublicSupabase();
  if (!sb) return NextResponse.json({ mode: 'demo', design: defaultDesign });
  const { data } = await sb.from('design_settings').select('settings').eq('id','global').maybeSingle();
  return NextResponse.json({ mode: 'supabase', design: data?.settings || defaultDesign });
}

export async function POST(req: NextRequest) {
  const sb = getAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 });
  if (req.headers.get('x-admin-secret') !== process.env.SYNC_SECRET) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const design = await req.json();
  const { error } = await sb.from('design_settings').upsert({ id:'global', settings: design });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, design });
}
