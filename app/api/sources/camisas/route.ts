import { NextRequest, NextResponse } from 'next/server';
import { fetchCamisasDoGremio } from '@/lib/sources/camisas';
export async function GET(req: NextRequest) {
  try {
    const page = Math.min(185, Math.max(1, Number(req.nextUrl.searchParams.get('page') || 1)));
    return NextResponse.json({ source: 'camisas-do-gremio', page, items: await fetchCamisasDoGremio(page) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 502 }); }
}
