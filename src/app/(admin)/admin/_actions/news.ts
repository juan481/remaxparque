'use server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function admin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type ActionResult = { error: string } | void;

export async function createNews(formData: FormData): Promise<ActionResult> {
  const pub = formData.get('is_published');
  const online = formData.get('event_online');
  const { error } = await admin().from('news').insert({
    title: formData.get('title') as string,
    content: (formData.get('content') as string) || null,
    urgency: (formData.get('urgency') as string) || 'normal',
    category: (formData.get('category') as string) || null,
    is_published: pub === 'true' || pub === 'on',
    published_at: (formData.get('published_at') as string) || null,
    drive_url: (formData.get('drive_url') as string) || null,
    image_url: (formData.get('image_url') as string) || null,
    location: (formData.get('location') as string) || null,
    event_online: online === 'true' || online === 'on',
    parque_visibility: (formData.get('parque_visibility') as string) || 'both',
  });
  if (error) return { error: error.message };
  revalidatePath('/admin/novedades');
  revalidatePath('/admin/eventos');
  revalidatePath('/novedades');
  revalidatePath('/eventos');
}

export async function updateNews(id: string, formData: FormData): Promise<ActionResult> {
  const pub = formData.get('is_published');
  const online = formData.get('event_online');
  const { error } = await admin().from('news').update({
    title: formData.get('title') as string,
    content: (formData.get('content') as string) || null,
    urgency: (formData.get('urgency') as string) || 'normal',
    category: (formData.get('category') as string) || null,
    is_published: pub === 'true' || pub === 'on',
    published_at: (formData.get('published_at') as string) || null,
    drive_url: (formData.get('drive_url') as string) || null,
    image_url: (formData.get('image_url') as string) || null,
    location: (formData.get('location') as string) || null,
    event_online: online === 'true' || online === 'on',
    parque_visibility: (formData.get('parque_visibility') as string) || 'both',
  }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/novedades');
  revalidatePath('/admin/eventos');
  revalidatePath('/novedades');
  revalidatePath('/eventos');
}

export async function deleteNews(id: string): Promise<ActionResult> {
  const { error } = await admin().from('news').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/novedades');
  revalidatePath('/admin/eventos');
  revalidatePath('/novedades');
  revalidatePath('/eventos');
}
