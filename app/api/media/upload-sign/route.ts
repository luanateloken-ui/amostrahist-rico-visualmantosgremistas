import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const DEFAULT_BUCKET = 'archive-media';

function safePart(value: string, fallback: string) {
  const cleaned = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
  return cleaned || fallback;
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error:'Sessão administrativa inválida ou expirada.' }, { status:401 });
  }

  const sb = getServerSupabase();
  if (!sb) {
    return NextResponse.json({ error:'Configure SUPABASE_URL e SUPABASE_SECRET_KEY na Vercel.' }, { status:503 });
  }

  const body = await req.json().catch(() => ({}));
  const filename = String(body.filename || 'imagem.jpg');
  const contentType = String(body.contentType || 'image/jpeg');
  const itemId = safePart(String(body.itemId || 'registro'), 'registro');

  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ error:'Este upload aceita somente imagens.' }, { status:400 });
  }

  const bucket = process.env.SUPABASE_MEDIA_BUCKET || DEFAULT_BUCKET;

  // Cria o bucket automaticamente na primeira utilização. Ele precisa ser
  // público porque as imagens fazem parte do arquivo visual exibido no frontend.
  const { data: existingBucket } = await sb.storage.getBucket(bucket);
  if (!existingBucket) {
    const { error:createError } = await sb.storage.createBucket(bucket, { public:true });
    if (createError && !/already exists/i.test(createError.message)) {
      return NextResponse.json({ error:`Não foi possível criar o bucket de imagens: ${createError.message}` }, { status:500 });
    }
  } else if (!existingBucket.public) {
    const { error:updateError } = await sb.storage.updateBucket(bucket, { public:true });
    if (updateError) {
      return NextResponse.json({ error:`Não foi possível tornar o bucket público: ${updateError.message}` }, { status:500 });
    }
  }

  const original = safePart(filename, 'imagem.jpg');
  const dot = original.lastIndexOf('.');
  const extension = dot >= 0 ? original.slice(dot) : '';
  const stem = dot >= 0 ? original.slice(0, dot) : original;
  const path = `${itemId}/${Date.now()}-${crypto.randomUUID()}-${stem}${extension}`;

  const { data, error } = await sb.storage.from(bucket).createSignedUploadUrl(path, { upsert:false });
  if (error || !data) {
    return NextResponse.json({ error:error?.message || 'Não foi possível preparar o upload.' }, { status:500 });
  }

  const publicUrl = sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;

  return NextResponse.json({
    signedUrl:data.signedUrl,
    token:data.token,
    path:data.path,
    publicUrl,
    bucket
  });
}
