import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { fetchGremio1903 } from '@/lib/sources/gremio1903';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error:'Não autorizado' }, { status:401 });
  try {
    return NextResponse.json({ source: 'gremio1903', items: await fetchGremio1903() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 502 });
  }
}
