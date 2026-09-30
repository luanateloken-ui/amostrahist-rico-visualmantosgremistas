import { NextResponse } from 'next/server';
import { fetchFootballKitArchive } from '@/lib/sources/football-kits';
export async function GET() {
  try { return NextResponse.json({ source: 'football-kit-archive', items: await fetchFootballKitArchive() }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 502 }); }
}
