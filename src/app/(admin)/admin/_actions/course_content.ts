'use server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

function admin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Modules ──────────────────────────────────────────────────────────────────

export async function createModule(courseId: string, formData: FormData) {
  const { data: existing } = await admin()
    .from('course_modules')
    .select('sort_order')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { error } = await admin().from('course_modules').insert({
    course_id: courseId,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    is_published: formData.get('is_published') === 'on',
    sort_order: nextOrder,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/cursos/${courseId}`);
}

export async function updateModule(id: string, courseId: string, formData: FormData) {
  const { error } = await admin().from('course_modules').update({
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    is_published: formData.get('is_published') === 'on',
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/cursos/${courseId}`);
}

export async function deleteModule(id: string, courseId: string) {
  const { error } = await admin().from('course_modules').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/cursos/${courseId}`);
}

export async function reorderModules(courseId: string, items: { id: string; sort_order: number }[]) {
  await Promise.all(
    items.map(item =>
      admin().from('course_modules').update({ sort_order: item.sort_order }).eq('id', item.id)
    )
  );
  revalidatePath(`/admin/cursos/${courseId}`);
}

// ─── Lessons ──────────────────────────────────────────────────────────────────

export async function getSignedUploadUrl(filename: string): Promise<{ signedUrl: string; path: string }> {
  const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const path = `courses/${safeName}`;
  const { data, error } = await admin().storage.from('documents').createSignedUploadUrl(path);
  if (error) throw new Error(error.message);
  return { signedUrl: data.signedUrl, path: data.path };
}

async function uploadLessonFile(file: File): Promise<{ url: string; sizeKb: number; name: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { data, error } = await admin().storage.from('documents').upload(`courses/${safeName}`, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error('Error al subir archivo: ' + error.message);
  const { data: { publicUrl } } = admin().storage.from('documents').getPublicUrl(data.path);
  return { url: publicUrl, sizeKb: Math.round(buffer.length / 1024), name: file.name };
}

export async function createLesson(moduleId: string, courseId: string, formData: FormData) {
  const { data: existing } = await admin()
    .from('course_lessons')
    .select('sort_order')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const type = formData.get('type') as string;
  let file_url: string | null = null;
  let file_name: string | null = null;
  let file_size_kb: number | null = null;

  if (type === 'pdf') {
    const directUrl = formData.get('file_url_direct') as string | null;
    if (directUrl) {
      file_url = directUrl;
      file_name = (formData.get('file_name_direct') as string) || null;
      file_size_kb = formData.get('file_size_kb_direct') ? parseInt(formData.get('file_size_kb_direct') as string) : null;
    } else {
      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        const up = await uploadLessonFile(file);
        file_url = up.url;
        file_name = up.name;
        file_size_kb = up.sizeKb;
      }
    }
  }

  const dur = formData.get('duration_minutes') as string;
  const { error } = await admin().from('course_lessons').insert({
    module_id: moduleId,
    course_id: courseId,
    title: formData.get('title') as string,
    type,
    content: (formData.get('content') as string) || null,
    video_url: type === 'video' ? ((formData.get('video_url') as string) || null) : null,
    file_url,
    file_name,
    file_size_kb,
    duration_minutes: dur ? parseInt(dur) : null,
    is_published: formData.get('is_published') === 'on',
    is_free_preview: formData.get('is_free_preview') === 'on',
    sort_order: nextOrder,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/cursos/${courseId}`);
}

export async function updateLesson(id: string, courseId: string, formData: FormData) {
  const type = formData.get('type') as string;
  const update: Record<string, unknown> = {
    title: formData.get('title') as string,
    type,
    content: (formData.get('content') as string) || null,
    video_url: type === 'video' ? ((formData.get('video_url') as string) || null) : null,
    duration_minutes: formData.get('duration_minutes') ? parseInt(formData.get('duration_minutes') as string) : null,
    is_published: formData.get('is_published') === 'on',
    is_free_preview: formData.get('is_free_preview') === 'on',
  };

  if (type === 'pdf') {
    const directUrl = formData.get('file_url_direct') as string | null;
    if (directUrl) {
      update.file_url = directUrl;
      update.file_name = (formData.get('file_name_direct') as string) || null;
      update.file_size_kb = formData.get('file_size_kb_direct') ? parseInt(formData.get('file_size_kb_direct') as string) : null;
    } else {
      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        const up = await uploadLessonFile(file);
        update.file_url = up.url;
        update.file_name = up.name;
        update.file_size_kb = up.sizeKb;
      }
    }
  }

  const { error } = await admin().from('course_lessons').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/cursos/${courseId}`);
  revalidatePath(`/academia/cursos/${courseId}`);
}

export async function deleteLesson(id: string, courseId: string) {
  const { error } = await admin().from('course_lessons').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/cursos/${courseId}`);
  revalidatePath(`/academia/cursos/${courseId}`);
}

export async function reorderLessons(moduleId: string, courseId: string, items: { id: string; sort_order: number }[]) {
  await Promise.all(
    items.map(item =>
      admin().from('course_lessons').update({ sort_order: item.sort_order }).eq('id', item.id)
    )
  );
  revalidatePath(`/admin/cursos/${courseId}`);
}

// ─── User: Complete Lesson ────────────────────────────────────────────────────

export async function completeLesson(lessonId: string, courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  await admin().from('lesson_progress').upsert(
    { user_id: user.id, lesson_id: lessonId, course_id: courseId, completed_at: new Date().toISOString() },
    { onConflict: 'user_id,lesson_id' }
  );

  // Recalculate course progress
  const { count: total } = await admin()
    .from('course_lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('is_published', true);

  const { count: done } = await admin()
    .from('lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .not('completed_at', 'is', null);

  const pct = total ? Math.round(((done ?? 0) / total) * 100) : 0;
  const allDone = pct === 100;

  const { data: existing } = await admin()
    .from('course_progress')
    .select('id, completed_at')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single();

  if (existing) {
    await admin().from('course_progress').update({
      progress_percent: pct,
      completed_at: allDone && !existing.completed_at ? new Date().toISOString() : existing.completed_at,
    }).eq('id', existing.id);
  } else {
    await admin().from('course_progress').insert({
      user_id: user.id,
      course_id: courseId,
      progress_percent: pct,
      completed_at: allDone ? new Date().toISOString() : null,
    });
  }

  revalidatePath(`/academia/cursos/${courseId}`);
  revalidatePath(`/academia/cursos/${courseId}/leccion/${lessonId}`);
  revalidatePath('/academia');
}
