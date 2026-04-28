-- ============================================================
-- 002: Tablas de contenido gestionable desde el admin
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Recursos de marketing (plantillas Canva + fotos de eventos)
CREATE TABLE IF NOT EXISTS marketing_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  resource_type text NOT NULL DEFAULT 'otro'
    CHECK (resource_type IN ('historias','posts','reels','nueva_imagen','fuentes','whatsapp','evento_foto','otro')),
  canva_url text,
  thumbnail_url text,
  parque_visibility text[] NOT NULL DEFAULT '{parque1,parque3}',
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Eventos propios (agenda del equipo)
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  event_end_date timestamptz,
  location text,
  category text,
  parque_visibility text[] NOT NULL DEFAULT '{parque1,parque3}',
  is_published boolean DEFAULT false,
  author_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agregar columna parque a cursos si no existe
ALTER TABLE courses ADD COLUMN IF NOT EXISTS parque_visibility text[] DEFAULT '{parque1,parque3}';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Indice para busqueda de eventos por fecha
CREATE INDEX IF NOT EXISTS idx_events_date ON events (event_date DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_type ON marketing_resources (resource_type, is_active);

-- RLS
ALTER TABLE marketing_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_read" ON marketing_resources;
DROP POLICY IF EXISTS "marketing_write" ON marketing_resources;
DROP POLICY IF EXISTS "events_read" ON events;
DROP POLICY IF EXISTS "events_write" ON events;

CREATE POLICY "marketing_read" ON marketing_resources
  FOR SELECT USING (
    is_active = true
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff','admin'))
  );

CREATE POLICY "marketing_write" ON marketing_resources
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff','admin'))
  );

CREATE POLICY "events_read" ON events
  FOR SELECT USING (
    is_published = true
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff','admin'))
  );

CREATE POLICY "events_write" ON events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff','admin'))
  );

-- Agregar event_type faltante a analytics
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;
ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_event_type_check
  CHECK (event_type IN ('user_signup','doc_download','session_start','course_start','course_complete','event_register','news_view'));
