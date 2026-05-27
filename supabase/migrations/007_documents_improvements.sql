-- ============================================================
-- 007: Mejoras al módulo de Documentos
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Nombre original del archivo para display y detección de tipo
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name text;

-- Slug para vinculación dinámica desde el front-end
-- Ej: 'alta-propiedades', 'solicitud-informes'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS location_slug text;

-- Índice para búsquedas por slug (sección front-end)
CREATE INDEX IF NOT EXISTS idx_documents_slug ON documents (location_slug) WHERE location_slug IS NOT NULL;

-- Índice de texto para búsqueda por título en admin
CREATE INDEX IF NOT EXISTS idx_documents_title_lower ON documents (lower(title));

-- Trigger para auto-actualizar updated_at en cada cambio
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_set_updated_at ON documents;
CREATE TRIGGER documents_set_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Asegurar bucket público 'documents' (idempotente)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('documents', 'documents', true)
  ON CONFLICT (id) DO NOTHING;
