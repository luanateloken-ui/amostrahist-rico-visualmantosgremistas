import { NextRequest, NextResponse } from 'next/server';
import { defaultDesign } from '@/lib/demo';
import { isAdminRequest } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase';

export async function GET() {
  const sb = getServerSupabase();
  if (!sb) return NextResponse.json({ mode: 'demo', design: defaultDesign });

  const { data, error } = await sb.from('design_settings').select('settings').eq('id','global').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mode: 'supabase', design: data?.settings || defaultDesign });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Sessão administrativa inválida ou expirada.' }, { status: 401 });
  }

  const sb = getServerSupabase();
  if (!sb) {
    return NextResponse.json(
      { error: 'Configure SUPABASE_URL e SUPABASE_SECRET_KEY na Vercel.' },
      { status: 503 }
    );
  }

  const design = await req.json();
  const { error } = await sb.from('design_settings').upsert({ id:'global', settings: design });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, design });
}
