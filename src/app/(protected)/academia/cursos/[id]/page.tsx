import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Clock, ChevronDown, Play, FileText, AlignLeft, CheckCircle, Lock, ArrowLeft, BarChart2 } from 'lucide-react';

type LessonRow = { id: string; title: string; type: string; module_id: string; sort_order: number; duration_minutes: number | null; };
type ModuleRow = { id: string; title: string; description: string | null; sort_order: number; lessons: LessonRow[]; };

const DIFF_COLOR: Record<string, string> = { basico: '#059669', intermedio: '#0043ff', avanzado: '#ff1200' };
const TYPE_META = {
  video: { icon: Play, color: '#7C3AED', label: 'Video' },
  pdf: { icon: FileText, color: '#ff1200', label: 'PDF' },
  text: { icon: AlignLeft, color: '#0043ff', label: 'Lectura' },
};

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [courseRes, modulesRes, lessonsRes, progressRes, lessonProgressRes] = await Promise.all([
    admin.from('courses').select('*').eq('id', id).eq('is_published', true).single(),
    admin.from('course_modules').select('*').eq('course_id', id).eq('is_published', true).order('sort_order'),
    admin.from('course_lessons').select('*').eq('course_id', id).eq('is_published', true).order('sort_order'),
    admin.from('course_progress').select('progress_percent,completed_at').eq('user_id', user!.id).eq('course_id', id).single(),
    admin.from('lesson_progress').select('lesson_id,completed_at').eq('user_id', user!.id).eq('course_id', id),
  ]);

  if (!courseRes.data) notFound();

  const course = courseRes.data;
  const lessons = lessonsRes.data ?? [];
  const completedLessonIds = new Set(
    (lessonProgressRes.data ?? []).filter((p: { completed_at: string | null }) => p.completed_at).map((p: { lesson_id: string }) => p.lesson_id)
  );

  const modules: ModuleRow[] = (modulesRes.data ?? []).map((m: LessonRow & { description: string | null }) => ({
    id: m.id,
    title: m.title,
    description: m.description ?? null,
    sort_order: m.sort_order,
    lessons: (lessons as LessonRow[]).filter(l => l.module_id === m.id),
  }));

  const progress = progressRes.data;
  const pct = progress?.progress_percent ?? 0;
  const isCompleted = !!progress?.completed_at;

  const firstLesson = (lessons as LessonRow[])[0];
  const nextLesson = (lessons as LessonRow[]).find(l => !completedLessonIds.has(l.id));

  return (
    <div className="max-w-4xl">
      {/* Back */}
      <Link href="/academia"
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 mb-6 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Academia
      </Link>

      {/* Hero */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="h-36 flex items-center justify-center relative"
          style={{ background: 'linear-gradient(135deg, #0C2749, #0043ff)' }}>
          <BookOpen className="w-14 h-14 text-white/20" />
          {course.difficulty && (
            <span className="absolute bottom-4 left-5 text-xs font-bold px-3 py-1 rounded-full text-white"
              style={{ background: DIFF_COLOR[course.difficulty] ?? '#0043ff' }}>
              {course.difficulty}
            </span>
          )}
          {isCompleted && (
            <span className="absolute top-4 right-5 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-green-500 text-white">
              <CheckCircle className="w-3.5 h-3.5" /> Completado
            </span>
          )}
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-black mb-2" style={{ color: '#0C2749' }}>{course.title}</h1>
          {course.description && <p className="text-gray-500 mb-4">{course.description}</p>}

          <div className="flex items-center gap-5 text-sm text-gray-400 mb-5 flex-wrap">
            {course.instructor && <span className="font-medium">{course.instructor}</span>}
            {course.duration_minutes && (
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{course.duration_minutes} min</span>
            )}
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />{lessons.length} lecci{lessons.length !== 1 ? 'ones' : 'on'}
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4" />{modules.length} m&#243;dulo{modules.length !== 1 ? 's' : ''}
            </span>
          </div>

          {pct > 0 && (
            <div className="mb-5">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Progreso</span><span className="font-bold">{pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: isCompleted ? '#059669' : '#0043ff' }} />
              </div>
            </div>
          )}

          {(firstLesson || nextLesson) && (
            <Link
              href={`/academia/cursos/${id}/leccion/${nextLesson?.id ?? firstLesson?.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-2xl shadow-md hover:opacity-90 active:scale-95 transition-all"
              style={{ background: isCompleted ? '#059669' : 'linear-gradient(135deg,#0043ff,#0C2749)' }}>
              <Play className="w-4 h-4" />
              {isCompleted ? 'Ver de nuevo' : pct > 0 ? 'Continuar' : 'Comenzar curso'}
            </Link>
          )}
        </div>
      </div>

      {/* Modules accordion */}
      <div className="space-y-3">
        <h2 className="text-lg font-black mb-4" style={{ color: '#0C2749' }}>Contenido del curso</h2>
        {modules.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-gray-400">Este curso no tiene lecciones cargadas todav&#237;a.</p>
          </div>
        ) : (
          modules.map((mod: ModuleRow, idx: number) => {
            const modCompleted = mod.lessons.filter(l => completedLessonIds.has(l.id)).length;
            return (
              <details key={mod.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group" open>
                <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50/50 list-none">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{ background: '#0C2749' }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm" style={{ color: '#0C2749' }}>{mod.title}</p>
                    {mod.description && <p className="text-xs text-gray-400 truncate">{mod.description}</p>}
                  </div>
                  <span className="text-xs text-gray-400 font-bold flex-shrink-0 mr-2">
                    {modCompleted}/{mod.lessons.length}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180 flex-shrink-0" />
                </summary>

                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {mod.lessons.map((les: LessonRow) => {
                    const type = les.type in TYPE_META ? les.type as keyof typeof TYPE_META : 'text';
                    const meta = TYPE_META[type];
                    const Icon = meta.icon;
                    const done = completedLessonIds.has(les.id);
                    return (
                      <Link key={les.id}
                        href={`/academia/cursos/${id}/leccion/${les.id}`}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-blue-50/30 transition-colors">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: done ? '#ECFDF5' : meta.color + '15' }}>
                          {done
                            ? <CheckCircle className="w-4 h-4 text-green-500" />
                            : <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${done ? 'text-gray-400 line-through' : ''}`}
                            style={done ? {} : { color: '#0C2749' }}>
                            {les.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span style={{ color: meta.color }} className="font-bold">{meta.label}</span>
                            {les.duration_minutes && <span>{les.duration_minutes} min</span>}
                          </div>
                        </div>
                        {done && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              </details>
            );
          })
        )}
      </div>
    </div>
  );
}
