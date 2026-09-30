import { NextResponse } from 'next/server';
import { fetchSuppliers } from '@/lib/sources/suppliers';
export async function GET() {
  try { return NextResponse.json({ source: 'gremistas-suppliers', items: await fetchSuppliers() }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 502 }); }
}
