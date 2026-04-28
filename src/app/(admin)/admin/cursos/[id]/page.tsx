import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import CourseContentClient from '@/components/admin/CourseContentClient';

export default async function AdminCourseContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [courseRes, modulesRes, lessonsRes] = await Promise.all([
    admin.from('courses').select('id, title').eq('id', id).single(),
    admin.from('course_modules').select('*').eq('course_id', id).order('sort_order'),
    admin.from('course_lessons').select('*').eq('course_id', id).order('sort_order'),
  ]);

  if (!courseRes.data) notFound();

  const modules = (modulesRes.data ?? []).map((m: Record<string, unknown>) => ({
    ...m,
    lessons: (lessonsRes.data ?? [])
      .filter((l: Record<string, unknown>) => l.module_id === m.id)
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.sort_order as number) - (b.sort_order as number)),
  }));

  return <CourseContentClient course={courseRes.data} initialModules={modules as Parameters<typeof CourseContentClient>[0]['initialModules']} />;
}
