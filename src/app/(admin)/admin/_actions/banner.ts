'use server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function admin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function createBanner(formData: FormData) {
  const { error } = await admin().from('banners').insert({
    image_url: formData.get('image_url') as string,
    link_url: (formData.get('link_url') as string) || null,
    title: (formData.get('title') as string) || null,
    is_active: formData.get('is_active') === 'on',
    parque_visibility: (formData.get('parque_visibility') as string) || 'both',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/banner');
  revalidatePath('/dashboard');
}

export async function updateBanner(id: string, formData: FormData) {
  const { error } = await admin().from('banners').update({
    image_url: formData.get('image_url') as string,
    link_url: (formData.get('link_url') as string) || null,
    title: (formData.get('title') as string) || null,
    is_active: formData.get('is_active') === 'on',
    parque_visibility: (formData.get('parque_visibility') as string) || 'both',
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/banner');
  revalidatePath('/dashboard');
}

export async function deleteBanner(id: string) {
  const { error } = await admin().from('banners').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/banner');
  revalidatePath('/dashboard');
}