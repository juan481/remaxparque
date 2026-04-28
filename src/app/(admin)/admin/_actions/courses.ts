'use server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function admin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function createCourse(formData: FormData) {
  const dur = formData.get('duration_minutes') as string;
  const pub = formData.get('is_published');
  const { error } = await admin().from('courses').insert({
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    difficulty: (formData.get('difficulty') as string) || 'basico',
    duration_minutes: dur ? parseInt(dur) : null,
    instructor: (formData.get('instructor') as string) || null,
    category: (formData.get('category') as string) || null,
    is_published: pub === 'true' || pub === 'on',
    thumbnail_url: (formData.get('thumbnail_url') as string) || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/cursos');
  revalidatePath('/academia');
}

export async function updateCourse(id: string, formData: FormData) {
  const dur = formData.get('duration_minutes') as string;
  const pub = formData.get('is_published');
  const { error } = await admin().from('courses').update({
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    difficulty: (formData.get('difficulty') as string) || 'basico',
    duration_minutes: dur ? parseInt(dur) : null,
    instructor: (formData.get('instructor') as string) || null,
    category: (formData.get('category') as string) || null,
    is_published: pub === 'true' || pub === 'on',
    thumbnail_url: (formData.get('thumbnail_url') as string) || null,
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/cursos');
  revalidatePath('/academia');
}

export async function deleteCourse(id: string) {
  const { error } = await admin().from('courses').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/cursos');
  revalidatePath('/academia');
}
