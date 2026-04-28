import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle, Play, FileText, AlignLeft, BookOpen, Download } from 'lucide-react';
import MarkCompleteButton from './MarkCompleteButton';

function getEmbedUrl(url: string): { embedUrl: string; isIframe: boolean } {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (yt) return { embedUrl: `https://www.youtube.com/embed/${yt[1]}?rel=0`, isIframe: true };

  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { embedUrl: `https://player.vimeo.com/video/${vimeo[1]}`, isIframe: true };

  return { embedUrl: url, isIframe: false };
}

const TYPE_META = {
  video: { icon: Play,      color: '#7C3AED', label: 'Video' },
  pdf:   { icon: FileText,  color: '#ff1200', label: 'PDF' },
  text:  { icon: AlignLeft, color: '#0043ff', label: 'Lectura' },
};
const TYPE_BG: Record<string, string> = {
  video: 'bg-purple-100', pdf: 'bg-red-100', text: 'bg-blue-100',
};

export default async function LessonPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id: courseId, lessonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [courseRes, lessonRes, modulesRes, lessonsRes, progressRes] = await Promise.all([
    admin.from('courses').select('id, title').eq('id', courseId).single(),
    admin.from('course_lessons').select('*').eq('id', lessonId).single(),
    admin.from('course_modules').select('id, title, sort_order').eq('course_id', courseId).eq('is_published', true).order('sort_order'),
    admin.from('course_lessons').select('id, title, type, module_id, sort_order, duration_minutes').eq('course_id', courseId).eq('is_published', true).order('sort_order'),
    admin.from('lesson_progress').select('lesson_id,completed_at').eq('user_id', user!.id).eq('course_id', courseId),
  ]);

  if (!courseRes.data || !lessonRes.data) notFound();

  const lesson = lessonRes.data;
  const allLessons = lessonsRes.data ?? [];
  const completedIds = new Set(
    (progressRes.data ?? []).filter((p: { completed_at: string | null }) => p.completed_at).map((p: { lesson_id: string }) => p.lesson_id)
  );
  const isCompleted = completedIds.has(lessonId);

  const lessonIdx = allLessons.findIndex((l: { id: string }) => l.id === lessonId);
  const prevLesson = lessonIdx > 0 ? allLessons[lessonIdx - 1] : null;
  const nextLesson = lessonIdx < allLessons.length - 1 ? allLessons[lessonIdx + 1] : null;

  const type = lesson.type as keyof typeof TYPE_META;
  const meta = TYPE_META[type] ?? TYPE_META.text;

  return (
    <div className="flex gap-0 -mx-4 sm:-mx-6 min-h-[calc(100vh-80px)]">

      {/* Sidebar — course outline */}
      <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 border-r border-gray-100 bg-white">
        <div className="px-4 py-4 border-b border-gray-100">
          <Link href={`/academia/cursos/${courseId}`}
            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al curso
          </Link>
          <h2 className="font-black text-sm leading-tight" style={{ color: '#0C2749' }}>{courseRes.data.title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {(modulesRes.data ?? []).map((mod: Record<string, unknown>) => {
            const modLessons = allLessons.filter((l: { module_id: string }) => l.module_id === mod.id);
            return (
              <div key={mod.id as string}>
                <p className="px-4 pt-3 pb-1 text-xs font-black uppercase tracking-wider text-gray-400">{mod.title as string}</p>
                {modLessons.map((l: Record<string, unknown>) => {
                  const done = completedIds.has(l.id as string);
                  const active = l.id === lessonId;
                  const lType = (l.type as string) in TYPE_META ? (l.type as keyof typeof TYPE_META) : 'text';
                  const lMeta = TYPE_META[lType];
                  const LIcon = lMeta.icon;
                  return (
                    <Link key={l.id as string}
                      href={`/academia/cursos/${courseId}/leccion/${l.id}`}
                      className={`flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors ${active ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-100' : active ? (TYPE_BG[lType] ?? 'bg-gray-100') : 'bg-gray-100'}`}
                        style={!done && !active ? {} : {}}>
                        {done
                          ? <CheckCircle className="w-3 h-3 text-green-500" />
                          : <LIcon className="w-3 h-3" style={{ color: active ? lMeta.color : '#9CA3AF' }} />}
                      </div>
                      <span className={`leading-tight ${active ? 'font-bold' : ''} ${done ? 'text-gray-400' : ''}`}
                        style={active ? { color: '#0C2749' } : {}}>
                        {l.title as string}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

          {/* Mobile back link */}
          <Link href={`/academia/cursos/${courseId}`}
            className="lg:hidden inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 mb-4 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {courseRes.data.title}
          </Link>

          {/* Lesson header */}
          <div className="mb-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: meta.color + '15' }}>
              <meta.icon className="w-5 h-5" style={{ color: meta.color }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</p>
              <h1 className="text-xl font-black leading-tight" style={{ color: '#0C2749' }}>{lesson.title}</h1>
              {lesson.duration_minutes && (
                <p className="text-xs text-gray-400 mt-0.5">{lesson.duration_minutes} minutos</p>
              )}
            </div>
          </div>

          {/* ── VIDEO ── */}
          {type === 'video' && lesson.video_url && (() => {
            const { embedUrl, isIframe } = getEmbedUrl(lesson.video_url);
            return (
              <div className="mb-6 rounded-2xl overflow-hidden shadow-lg bg-black">
                {isIframe ? (
                  <div className="aspect-video">
                    <iframe src={embedUrl} className="w-full h-full" allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                  </div>
                ) : (
                  <video src={embedUrl} controls className="w-full rounded-2xl" />
                )}
              </div>
            );
          })()}

          {/* ── PDF ── */}
          {type === 'pdf' && lesson.file_url && (
            <div className="mb-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <iframe src={lesson.file_url} className="w-full h-[600px]" title={lesson.title} />
              </div>
              <a href={lesson.file_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-sm font-bold px-4 py-2 rounded-xl hover:opacity-80 transition-opacity text-white"
                style={{ background: '#ff1200' }}>
                <Download className="w-4 h-4" /> Descargar PDF
              </a>
            </div>
          )}

          {/* ── TEXT ── */}
          {type === 'text' && lesson.content && (
            <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">{lesson.content}</div>
            </div>
          )}

          {/* Description / notes */}
          {lesson.content && type !== 'text' && (
            <div className="mb-6 bg-gray-50 rounded-2xl p-5">
              <h3 className="text-sm font-black mb-2" style={{ color: '#0C2749' }}>Descripci&#243;n</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{lesson.content}</p>
            </div>
          )}

          {/* Mark complete + navigation */}
          <div className="flex items-center justify-between gap-4 py-5 border-t border-gray-100 flex-wrap">
            <div>
              {prevLesson ? (
                <Link href={`/academia/cursos/${courseId}/leccion/${(prevLesson as { id: string }).id}`}
                  className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Anterior
                </Link>
              ) : (
                <Link href={`/academia/cursos/${courseId}`}
                  className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                  <BookOpen className="w-4 h-4" /> Ver curso
                </Link>
              )}
            </div>

            <MarkCompleteButton
              lessonId={lessonId}
              courseId={courseId}
              isCompleted={isCompleted}
              nextLessonId={(nextLesson as { id: string } | null)?.id ?? null}
            />

            <div>
              {nextLesson ? (
                <Link href={`/academia/cursos/${courseId}/leccion/${(nextLesson as { id: string }).id}`}
                  className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors hover:opacity-80 text-white"
                  style={{ background: '#0043ff' }}>
                  Siguiente <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link href={`/academia/cursos/${courseId}`}
                  className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors hover:opacity-80 text-white"
                  style={{ background: '#059669' }}>
                  Ver curso <CheckCircle className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
