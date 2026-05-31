import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const userId = form.get('userId') as string | null;

  if (!file || !userId) return NextResponse.json({ error: 'Archivo y userId requeridos.' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Solo JPG, PNG o WebP.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Máximo 3 MB.' }, { status: 400 });

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `staff/${userId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
