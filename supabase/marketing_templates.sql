-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)

CREATE TABLE IF NOT EXISTS public.marketing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  canva_link TEXT,
  thumbnail_url TEXT,
  parque_visibility TEXT[] NOT NULL DEFAULT ARRAY['parque1','parque3'],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.marketing_templates ENABLE ROW LEVEL SECURITY;

-- Staff and admin can do everything
CREATE POLICY "staff_admin_all" ON public.marketing_templates
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

-- Agents can read active templates for their parque
CREATE POLICY "agents_read_active" ON public.marketing_templates
  FOR SELECT TO authenticated
  USING (
    is_active = TRUE AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.parque = ANY(parque_visibility) OR p.parque = 'both')
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER marketing_templates_updated_at
  BEFORE UPDATE ON public.marketing_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS marketing_templates_category_idx ON public.marketing_templates(category);
CREATE INDEX IF NOT EXISTS marketing_templates_active_idx ON public.marketing_templates(is_active);

-- Also create the documents storage bucket (run separately in Storage settings or via this)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true)
-- ON CONFLICT (id) DO NOTHING;
