import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { fetchSuppliers } from '@/lib/sources/suppliers';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error:'Não autorizado' }, { status:401 });
  try {
    return NextResponse.json({ source: 'gremistas-suppliers', items: await fetchSuppliers() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 502 });
  }
}
