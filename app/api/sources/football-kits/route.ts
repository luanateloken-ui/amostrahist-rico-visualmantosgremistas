import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { fetchFootballKitArchive } from '@/lib/sources/football-kits';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error:'Não autorizado' }, { status:401 });
  try {
    return NextResponse.json({ source: 'football-kit-archive', items: await fetchFootballKitArchive() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 502 });
  }
}
