'use server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function admin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function uploadFile(file: File): Promise<{ url: string; sizeKb: number; name: string; type: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { data, error } = await admin().storage.from('documents').upload(`library/${safeName}`, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error('Error al subir archivo: ' + error.message);
  const { data: { publicUrl } } = admin().storage.from('documents').getPublicUrl(data.path);
  return { url: publicUrl, sizeKb: Math.round(buffer.length / 1024), name: file.name, type: ext };
}

export async function createLibraryResource(formData: FormData) {
  const file = formData.get('file') as File | null;
  let file_url: string | null = null;
  let file_size_kb: number | null = null;
  let file_name: string | null = null;
  let file_type: string | null = null;

  if (file && file.size > 0) {
    const up = await uploadFile(file);
    file_url = up.url;
    file_size_kb = up.sizeKb;
    file_name = up.name;
    file_type = up.type;
  }

  const pv = formData.getAll('parque_visibility') as string[];
  const active = formData.get('is_active');

  const { error } = await admin().from('library_resources').insert({
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    category: (formData.get('category') as string) || 'otro',
    parque_visibility: pv.length ? pv : ['parque1', 'parque3'],
    is_active: active === 'on' || active === 'true',
    file_url,
    file_size_kb,
    file_name,
    file_type,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/admin/biblioteca');
  revalidatePath('/academia/biblioteca');
}

export async function updateLibraryResource(id: string, formData: FormData) {
  const file = formData.get('file') as File | null;
  const pv = formData.getAll('parque_visibility') as string[];
  const active = formData.get('is_active');

  const update: Record<string, unknown> = {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    category: (formData.get('category') as string) || 'otro',
    parque_visibility: pv.length ? pv : [],
    is_active: active === 'on' || active === 'true',
  };

  if (file && file.size > 0) {
    const up = await uploadFile(file);
    update.file_url = up.url;
    update.file_size_kb = up.sizeKb;
    update.file_name = up.name;
    update.file_type = up.type;
  }

  const { error } = await admin().from('library_resources').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/biblioteca');
  revalidatePath('/academia/biblioteca');
}

export async function deleteLibraryResource(id: string) {
  const { error } = await admin().from('library_resources').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/biblioteca');
  revalidatePath('/academia/biblioteca');
}
