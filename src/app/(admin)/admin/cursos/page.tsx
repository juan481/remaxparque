import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import CursosClient from '@/components/admin/CursosClient';

export default async function AdminCursosPage() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const [coursesRes, progressRes] = await Promise.all([
    admin.from('courses').select('*').order('created_at', { ascending: false }),
    admin.from('course_progress').select('course_id, completed_at'),
  ]);
  const courses = coursesRes.data ?? [];
  const progress = progressRes.data ?? [];
  const completionsByCourse = progress.reduce((acc: Record<string,number>, p: {course_id:string; completed_at:string|null}) => {
    if (p.completed_at) acc[p.course_id] = (acc[p.course_id] ?? 0) + 1;
    return acc;
  }, {});
  return <CursosClient courses={courses} completionsByCourse={completionsByCourse} />;
}
