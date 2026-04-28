-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)

CREATE TABLE IF NOT EXISTS public.library_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'otro',
  tags TEXT[] NOT NULL DEFAULT '{}',
  parque_visibility TEXT[] NOT NULL DEFAULT ARRAY['parque1','parque3'],
  file_url TEXT,
  file_name TEXT,
  file_size_kb INTEGER,
  file_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.library_resources ENABLE ROW LEVEL SECURITY;

-- Staff and admin can do everything
CREATE POLICY "lib_staff_admin_all" ON public.library_resources
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- Agents can read active resources for their parque
CREATE POLICY "lib_agents_read" ON public.library_resources
  FOR SELECT TO authenticated
  USING (
    is_active = TRUE AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.parque = ANY(parque_visibility) OR p.parque = 'both')
    )
  );

-- Reuse or create the set_updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER library_resources_updated_at
  BEFORE UPDATE ON public.library_resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS library_resources_category_idx ON public.library_resources(category);
CREATE INDEX IF NOT EXISTS library_resources_active_idx ON public.library_resources(is_active);
CREATE INDEX IF NOT EXISTS library_resources_parque_idx ON public.library_resources USING GIN(parque_visibility);
CREATE INDEX IF NOT EXISTS library_resources_sort_idx ON public.library_resources(sort_order, created_at DESC);
