-- ============================================================
-- RE/MAX Academia Parque � Schema inicial
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- TABLAS
-- ============================================================

-- Perfiles de usuario (extiende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'pending' CHECK (role IN ('pending','agent','staff','admin')),
  parque text CHECK (parque IN ('parque1','parque3','both')),
  department text,
  created_at timestamptz DEFAULT now()
);

-- Cach� de sesi�n para optimizar RLS
CREATE UNLOGGED TABLE IF NOT EXISTS user_session_cache (
  user_id uuid PRIMARY KEY,
  user_role text NOT NULL,
  user_parque text,
  cached_at timestamptz DEFAULT now()
);

-- Documentos legales
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text CHECK (type IN ('contrato','formulario','proceso','otro')),
  category text CHECK (category IN ('ventas','alquileres','uif','admin','otro')),
  parque_visibility text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'borrador' CHECK (status IN ('vigente','obsoleto','borrador')),
  version text,
  changelog_summary text,
  applicable_roles text[],
  file_url text,
  file_size_kb int,
  legal_excerpt text,
  keywords text[],
  replaces_document_id uuid REFERENCES documents(id),
  effective_date date,
  rls_updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auditor�a de versiones
CREATE TABLE IF NOT EXISTS document_versions_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_document_id uuid NOT NULL REFERENCES documents(id),
  version_replaced_by_id uuid REFERENCES documents(id),
  archived_embeddings_count int DEFAULT 0,
  archived_at timestamptz DEFAULT now(),
  archived_reason text CHECK (archived_reason IN ('new_version','status_change','purge'))
);

-- Embeddings para RAG (pgvector)
CREATE TABLE IF NOT EXISTS document_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  content text,
  embedding vector(1536),
  chunk_index int DEFAULT 0,
  is_active boolean DEFAULT true,
  doc_metadata jsonb
);

-- Telemetr�a de adopci�n
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('user_signup','doc_download','session_start','course_start','course_complete')),
  resource_id uuid,
  parque text,
  created_at timestamptz DEFAULT now()
);

-- Historial de descargas
CREATE TABLE IF NOT EXISTS download_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  downloaded_at timestamptz DEFAULT now()
);

-- Cursos
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  video_url text,
  duration_minutes int,
  pdf_url text,
  difficulty text CHECK (difficulty IN ('basico','intermedio','avanzado')),
  instructor text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Progreso de cursos
CREATE TABLE IF NOT EXISTS course_progress (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  progress_percent int DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  completed_at timestamptz,
  PRIMARY KEY (user_id, course_id)
);

-- Novedades
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  urgency text DEFAULT 'normal' CHECK (urgency IN ('normal','importante','urgente')),
  category text,
  author_id uuid REFERENCES profiles(id),
  attachments jsonb DEFAULT '[]',
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Favoritos
CREATE TABLE IF NOT EXISTS favorites (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('document','course','marketing')),
  resource_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, resource_type, resource_id)
);

-- ============================================================
-- �NDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_documents_parque ON documents USING GIN (parque_visibility);
CREATE INDEX IF NOT EXISTS idx_documents_vigente ON documents (status) WHERE status = 'vigente';
CREATE INDEX IF NOT EXISTS idx_embeddings_active ON document_embeddings (document_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_analytics_type_date ON analytics_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON documents USING GIN (title gin_trgm_ops);

-- IVFFLAT para b�squeda vectorial (crear despu�s de tener datos)
-- CREATE INDEX idx_embeddings_vector ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- FUNCI�N RPC: cach� de sesi�n
-- ============================================================

CREATE OR REPLACE FUNCTION cache_user_session(
  p_user_id uuid,
  p_role text,
  p_parque text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO user_session_cache (user_id, user_role, user_parque)
  VALUES (p_user_id, p_role, p_parque)
  ON CONFLICT (user_id) DO UPDATE
  SET user_role = EXCLUDED.user_role,
      user_parque = EXCLUDED.user_parque,
      cached_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions_archive ENABLE ROW LEVEL SECURITY;

-- Profiles: cada usuario ve y edita su propio perfil; admins ven todos
CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "profiles_admin_read" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff','admin'))
  );

-- Documents: agentes ven solo docs de su parque; staff/admin ven todos
CREATE POLICY "documents_select" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_session_cache usc
      WHERE usc.user_id = auth.uid()
      AND (
        usc.user_role IN ('staff','admin')
        OR (
          parque_visibility @> ARRAY[usc.user_parque]
          AND status = 'vigente'
        )
      )
    )
  );

CREATE POLICY "documents_write" ON documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff','admin'))
  );

-- Analytics: usuarios insertan sus propios eventos; admins leen todos
CREATE POLICY "analytics_insert" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analytics_admin_read" ON analytics_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff','admin'))
  );

-- Download logs
CREATE POLICY "download_logs_insert" ON download_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "download_logs_admin_read" ON download_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff','admin'))
  );

-- Courses: todos los autenticados leen los publicados
CREATE POLICY "courses_read" ON courses
  FOR SELECT USING (is_published = true OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff','admin')
  ));

CREATE POLICY "courses_write" ON courses
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff','admin')));

-- Course progress: propio usuario
CREATE POLICY "course_progress_own" ON course_progress
  FOR ALL USING (auth.uid() = user_id);

-- News: publicadas visibles para todos; write para staff/admin
CREATE POLICY "news_read" ON news
  FOR SELECT USING (is_published = true OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff','admin')
  ));

CREATE POLICY "news_write" ON news
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff','admin')));

-- Favorites: propio usuario
CREATE POLICY "favorites_own" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- Versions archive: solo admins
CREATE POLICY "versions_archive_admin" ON document_versions_archive
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff','admin')));

-- ============================================================
-- TRIGGER: crear perfil autom�ticamente al registrarse
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
