-- Run this in Supabase SQL Editor

-- ─── Modules ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modules_staff_admin_all" ON public.course_modules
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','admin')));

CREATE POLICY "modules_agents_read" ON public.course_modules
  FOR SELECT TO authenticated
  USING (
    is_published = TRUE AND
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_published = TRUE)
  );

CREATE INDEX IF NOT EXISTS course_modules_course_idx ON public.course_modules(course_id, sort_order);

-- ─── Lessons ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text', -- 'video' | 'pdf' | 'text'
  content TEXT,
  video_url TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size_kb INTEGER,
  duration_minutes INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  is_free_preview BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lessons_staff_admin_all" ON public.course_lessons
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','admin')));

CREATE POLICY "lessons_agents_read" ON public.course_lessons
  FOR SELECT TO authenticated
  USING (
    is_published = TRUE AND
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_published = TRUE)
  );

CREATE INDEX IF NOT EXISTS course_lessons_module_idx ON public.course_lessons(module_id, sort_order);
CREATE INDEX IF NOT EXISTS course_lessons_course_idx ON public.course_lessons(course_id);

-- ─── Lesson Progress ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see and write their own progress
CREATE POLICY "lesson_progress_own" ON public.lesson_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Staff/admin can read all progress
CREATE POLICY "lesson_progress_staff_read" ON public.lesson_progress
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','admin')));

CREATE INDEX IF NOT EXISTS lesson_progress_user_course_idx ON public.lesson_progress(user_id, course_id);

-- ─── Triggers ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER course_modules_updated_at
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER course_lessons_updated_at
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Ensure course_progress unique constraint ─────────────────────────────────
DO $$ BEGIN
  ALTER TABLE public.course_progress
    ADD CONSTRAINT course_progress_user_course_unique UNIQUE (user_id, course_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
