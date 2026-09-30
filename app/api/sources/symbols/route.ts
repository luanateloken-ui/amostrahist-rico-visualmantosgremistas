import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { fetchCommonsSymbols } from '@/lib/sources/symbols';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error:'Não autorizado' }, { status:401 });
  try {
    return NextResponse.json({ source:'wikimedia-commons-symbols', items:await fetchCommonsSymbols() });
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : 'Erro desconhecido' }, { status:502 });
  }
}
