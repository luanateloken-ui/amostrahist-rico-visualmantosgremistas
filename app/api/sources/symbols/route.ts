import { NextResponse } from 'next/server';
import { fetchCommonsSymbols } from '@/lib/sources/symbols';
export async function GET(){try{return NextResponse.json({source:'wikimedia-commons-symbols',items:await fetchCommonsSymbols()})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Erro desconhecido'},{status:502})}}
