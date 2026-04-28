'use client';
import { useState } from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { completeLesson } from '@/app/(admin)/admin/_actions/course_content';
import { useRouter } from 'next/navigation';

export default function MarkCompleteButton({
  lessonId, courseId, isCompleted, nextLessonId,
}: {
  lessonId: string;
  courseId: string;
  isCompleted: boolean;
  nextLessonId: string | null;
}) {
  const [done, setDone] = useState(isCompleted);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handle() {
    if (done || busy) return;
    setBusy(true);
    try {
      await completeLesson(lessonId, courseId);
      setDone(true);
      if (nextLessonId) {
        setTimeout(() => router.push(`/academia/cursos/${courseId}/leccion/${nextLessonId}`), 600);
      } else {
        router.refresh();
      }
    } catch {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-50 text-green-700 font-bold text-sm">
        <CheckCircle className="w-4 h-4" /> Lecci&#243;n completada
      </div>
    );
  }

  return (
    <button onClick={handle} disabled={busy}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 text-white"
      style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
      {busy ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Guardando...
        </span>
      ) : (
        <><Circle className="w-4 h-4" /> Marcar como completada</>
      )}
    </button>
  );
}
