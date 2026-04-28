'use server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function admin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function uploadFile(file: File): Promise<{ url: string; sizeKb: number }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const name = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { data, error } = await admin().storage.from('documents').upload(name, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error('Error al subir archivo: ' + error.message);
  const { data: { publicUrl } } = admin().storage.from('documents').getPublicUrl(data.path);
  return { url: publicUrl, sizeKb: Math.round(buffer.length / 1024) };
}

export async function createDocument(formData: FormData) {
  const file = formData.get('file') as File | null;
  let file_url: string | null = null;
  let file_size_kb: number | null = null;
  if (file && file.size > 0) {
    const up = await uploadFile(file);
    file_url = up.url;
    file_size_kb = up.sizeKb;
  }
  const pv = formData.getAll('parque_visibility') as string[];
  const { error } = await admin().from('documents').insert({
    title: formData.get('title') as string,
    type: (formData.get('type') as string) || null,
    category: (formData.get('category') as string) || null,
    parque_visibility: pv.length ? pv : ['parque1', 'parque3'],
    status: (formData.get('status') as string) || 'borrador',
    version: (formData.get('version') as string) || null,
    changelog_summary: (formData.get('changelog_summary') as string) || null,
    effective_date: (formData.get('effective_date') as string) || null,
    legal_excerpt: (formData.get('legal_excerpt') as string) || null,
    file_url,
    file_size_kb,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/documentos');
  revalidatePath('/legales');
}

export async function updateDocument(id: string, formData: FormData) {
  const file = formData.get('file') as File | null;
  const pv = formData.getAll('parque_visibility') as string[];
  const update: Record<string, unknown> = {
    title: formData.get('title') as string,
    type: (formData.get('type') as string) || null,
    category: (formData.get('category') as string) || null,
    parque_visibility: pv.length ? pv : [],
    status: (formData.get('status') as string) || 'borrador',
    version: (formData.get('version') as string) || null,
    changelog_summary: (formData.get('changelog_summary') as string) || null,
    effective_date: (formData.get('effective_date') as string) || null,
    legal_excerpt: (formData.get('legal_excerpt') as string) || null,
  };
  if (file && file.size > 0) {
    const up = await uploadFile(file);
    update.file_url = up.url;
    update.file_size_kb = up.sizeKb;
  }
  const { error } = await admin().from('documents').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/documentos');
  revalidatePath('/legales');
}

export async function deleteDocument(id: string) {
  const { error } = await admin().from('documents').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/documentos');
  revalidatePath('/legales');
}
