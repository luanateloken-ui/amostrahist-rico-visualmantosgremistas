import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { fetchCommonsKits } from '@/lib/sources/commons';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error:'Não autorizado' }, { status:401 });
  try {
    const limit = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get('limit') || 80)));
    return NextResponse.json({ source: 'wikimedia-commons', items: await fetchCommonsKits(limit) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 502 });
  }
}
