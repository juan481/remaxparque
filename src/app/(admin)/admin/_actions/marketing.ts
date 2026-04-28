'use server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function admin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function createTemplate(formData: FormData) {
  const pv = formData.getAll('parque_visibility') as string[];
  const active = formData.get('is_active');
  const { error } = await admin().from('marketing_templates').insert({
    title: formData.get('title') as string,
    category: formData.get('category') as string,
    description: (formData.get('description') as string) || null,
    canva_link: (formData.get('canva_link') as string) || null,
    thumbnail_url: (formData.get('thumbnail_url') as string) || null,
    parque_visibility: pv.length ? pv : ['parque1', 'parque3'],
    is_active: active !== 'false',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/marketing');
  revalidatePath('/marketing');
}

export async function updateTemplate(id: string, formData: FormData) {
  const pv = formData.getAll('parque_visibility') as string[];
  const active = formData.get('is_active');
  const { error } = await admin().from('marketing_templates').update({
    title: formData.get('title') as string,
    category: formData.get('category') as string,
    description: (formData.get('description') as string) || null,
    canva_link: (formData.get('canva_link') as string) || null,
    thumbnail_url: (formData.get('thumbnail_url') as string) || null,
    parque_visibility: pv.length ? pv : ['parque1', 'parque3'],
    is_active: active === 'true' || active === 'on',
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/marketing');
  revalidatePath('/marketing');
}

export async function deleteTemplate(id: string) {
  const { error } = await admin().from('marketing_templates').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/marketing');
  revalidatePath('/marketing');
}
