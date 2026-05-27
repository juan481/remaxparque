import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/app/api/admin/_lib/auth';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const MAX_SIZE = 1 * 1024 * 1024; // 1 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg'];

export async function POST(req: NextRequest) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No se proporcionó archivo.' }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Solo se permiten archivos .jpg.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'El archivo supera el máximo de 1 MB.' }, { status: 400 });
  }

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const path = `evento-${Date.now()}.jpg`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage
    .from('eventos')
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from('eventos').getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
