# Plan: Hub Digital Academia RE/MAX Parque

## Contexto

El cliente tiene una intranet corporativa diseñada para 150 agentes + 15 staff de dos oficinas (Parque 1 y Parque 3). El problema central es el caos de información dispersa en WhatsApp y Google Drive (112 horas productivas perdidas por día). La plataforma centraliza documentos legales, cursos, marketing, novedades y un chatbot IA. Ya existe un diseño de referencia (dashboard, academia, eventos) que se va a elevar visualmente. No se quiere WordPress (no es escalable). La prioridad del MVP es **Legales & Documentos**.

---

## Stack Tecnológico

| Capa | Tecnología | Razón |
|------|-----------|-------|
| Frontend | Next.js 15 (App Router) + TypeScript | PWA, SSR, excelente DX |
| Estilos | Tailwind CSS + shadcn/ui | Velocidad + componentes accesibles |
| Backend/DB | Supabase (PostgreSQL + RLS) | Auth nativa con Google SSO, Row Level Security para el filtrado por parque, Storage para PDFs |
| Embeddings IA | pgvector (extensión en Supabase) | RAG sin infra extra, integrado en la misma DB |
| IA Chatbot | OpenAI API (GPT-4o-mini + text-embedding-3-small) | Costo bajo (~$25/mes para 150 usuarios) |
| Búsqueda | PostgreSQL FTS + pg_trgm | Full-text search con tolerancia a typos, sin costo extra |
| Email | Resend | Notificaciones de aprobación, recordatorios de eventos |
| Hosting | Vercel (Next.js) + Supabase Cloud | ~$45-75/mes total, dentro del presupuesto |

**Costo operativo estimado:** $75-115 USD/mes (vs $130 estimado por el cliente → margen)

---

## Arquitectura de la Aplicación

```
academia.remaxparque.com  (Vercel)
│
├── /                    → Landing / Login (Google SSO)
├── /onboarding          → Wizard de rol post-registro (pendiente de aprobación)
├── /pending             → Pantalla "cuenta en revisión"
│
├── (autenticado - middleware verifica sesión + rol + parque)
│   ├── /dashboard       → Home personalizado por rol (agente / staff / admin)
│   ├── /academia        → Cursos + E-learning
│   ├── /marketing       → Plantillas Canva + logos + fotos
│   ├── /eventos         → Capacitaciones presenciales + inscripción
│   ├── /legales         → Documentos filtrados por parque ← PRIORIDAD MVP
│   ├── /novedades       → Blog interno
│   ├── /directorio      → Staff directory
│   └── /perfil          → Progreso + favoritos + chatbot IA tab
│
├── (solo admin/staff)
│   └── /admin
│       ├── /usuarios    → Aprobar cuentas, asignar rol/parque
│       ├── /documentos  → CRUD documentos legales + control de versiones
│       ├── /cursos      → CRUD cursos y eventos
│       ├── /novedades   → CRUD noticias
│       ├── /marketing   → CRUD plantillas
│       └── /analytics   → Usuarios activos, descargas, preguntas IA ← ADELANTADO A FASE 1
│
└── /api
    ├── /chat            → RAG chatbot (streaming)
    ├── /search          → Búsqueda global
    ├── /embed           → Trigger indexación de documentos
    └── /webhooks/email  → Notificaciones por email
```

---

## Base de Datos (Supabase PostgreSQL)

### Tablas clave

```sql
-- Usuarios (extiende auth.users de Supabase)
profiles (
  id uuid PRIMARY KEY references auth.users,
  full_name text,
  avatar_url text,
  role text CHECK (role IN ('pending','agent','staff','admin')),
  parque text CHECK (parque IN ('parque1','parque3','both')),
  department text,  -- solo staff
  created_at timestamp
)

-- Cach� de sesi�n para optimizar RLS (UNLOGGED = solo memoria, no se replica)
user_session_cache (
  user_id uuid PRIMARY KEY,
  user_role text NOT NULL,
  user_parque text NOT NULL,
  cached_at timestamp DEFAULT now()
)

-- Documentos legales
documents (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  type text,          -- contrato, formulario, proceso
  category text,      -- ventas, alquileres, uif, admin
  parque_visibility text[],  -- ['parque1'], ['parque3'], ['parque1','parque3']
  status text CHECK (status IN ('vigente','obsoleto','borrador')),
  version text,
  changelog_summary text,    -- resumen en texto simple de qu� cambi� (para DocumentCard)
  applicable_roles text[],   -- ['agent','staff'] para el Applicability Tag en la card
  file_url text,             -- Supabase Storage
  file_size_kb int,
  legal_excerpt text, -- para RAG
  keywords text[],
  replaces_document_id uuid REFERENCES documents(id),
  effective_date date,
  rls_updated_at timestamp DEFAULT now(),  -- se actualiza al cambiar parque_visibility
  created_by uuid REFERENCES profiles(id),
  created_at timestamp
)

-- Auditor�a de versiones reemplazadas
document_versions_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_document_id uuid NOT NULL REFERENCES documents(id),
  version_replaced_by_id uuid REFERENCES documents(id),
  archived_embeddings_count int,
  archived_at timestamp DEFAULT now(),
  archived_reason text CHECK (archived_reason IN ('new_version','status_change','purge'))
)

-- Embeddings para RAG (pgvector)
document_embeddings (
  id uuid PRIMARY KEY,
  document_id uuid REFERENCES documents(id),
  content text,       -- chunk de texto
  embedding vector(1536),
  chunk_index int,
  is_active boolean DEFAULT true,  -- false cuando el doc es reemplazado u obsoleto
  doc_metadata jsonb        -- {title, category, created_by, effective_date} desnormalizado
)

-- Cursos
courses (
  id uuid PRIMARY KEY,
  title text,
  description text,
  category text,      -- induccion, captacion, derecho, crm, ventas, acm
  video_url text,
  duration_minutes int,
  pdf_url text,
  difficulty text,
  instructor text,
  is_published boolean,
  created_at timestamp
)

-- Progreso de cursos
course_progress (
  user_id uuid REFERENCES profiles(id),
  course_id uuid REFERENCES courses(id),
  progress_percent int DEFAULT 0,
  completed_at timestamp,
  PRIMARY KEY (user_id, course_id)
)

-- Eventos presenciales
events (
  id uuid PRIMARY KEY,
  title text,
  description text,
  event_date timestamp,
  parque text,
  location_address text,
  capacity int,
  instructor text,
  is_published boolean
)

-- Inscripciones a eventos
event_enrollments (
  user_id uuid REFERENCES profiles(id),
  event_id uuid REFERENCES events(id),
  enrolled_at timestamp,
  PRIMARY KEY (user_id, event_id)
)

-- Novedades / blog interno
news (
  id uuid PRIMARY KEY,
  title text,
  content text,
  urgency text CHECK (urgency IN ('normal','importante','urgente')),
  category text,
  author_id uuid REFERENCES profiles(id),
  attachments jsonb,  -- [{name, url, size}]
  is_published boolean,
  published_at timestamp
)

-- Recursos de marketing
marketing_resources (
  id uuid PRIMARY KEY,
  title text,
  type text,  -- plantilla_canva, logo, foto_evento, tipografia
  platform text,  -- instagram, facebook, reels
  canva_url text,
  file_url text,
  thumbnail_url text,
  use_count int DEFAULT 0
)

-- Directorio staff
staff_directory (
  id uuid PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id),
  cargo text,
  area text,
  whatsapp text,
  schedule text,
  bio text,
  display_order int
)

-- Favoritos personales
favorites (
  user_id uuid REFERENCES profiles(id),
  resource_type text,  -- document, course, marketing
  resource_id uuid,
  created_at timestamp,
  PRIMARY KEY (user_id, resource_type, resource_id)
)

-- Telemetr�a de adopci�n (KPIs b�sicos desde Fase 1)
analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  event_type text CHECK (event_type IN ('user_signup','doc_download','session_start','course_start','course_complete')),
  resource_id uuid,    -- id del documento/curso referenciado (nullable)
  parque text,
  created_at timestamp DEFAULT now()
)

-- Historial descargas (para analytics detallado)
download_logs (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  document_id uuid REFERENCES documents(id),
  downloaded_at timestamp
)

-- Historial chatbot (para analytics)
chat_logs (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  question text,
  answer text,
  sources jsonb,  -- documentos citados
  created_at timestamp
)
```

### Índices de rendimiento

```sql
-- GIN para búsqueda de array parque_visibility (crítico para RLS + filtros)
CREATE INDEX idx_documents_parque_visibility ON documents
  USING GIN (parque_visibility);

-- Partial index solo en documentos vigentes (reduce tamaño del índice ~60%)
CREATE INDEX idx_documents_status_vigente ON documents (status)
  WHERE status = 'vigente';

-- IVFFLAT para búsquedas vectoriales del chatbot RAG (10x más rápido que escaneo O(n))
CREATE INDEX idx_document_embeddings_vector
  ON document_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Partial index para embeddings activos
CREATE INDEX idx_embeddings_active ON document_embeddings (document_id)
  WHERE is_active = true;

-- Índice para analytics_events por tipo y fecha
CREATE INDEX idx_analytics_events_type_date ON analytics_events (event_type, created_at DESC);
```

### Row Level Security (el núcleo del filtrado por parque)

```sql
-- Función RPC: poblar caché de sesión al hacer login (llamar desde middleware.ts)
CREATE OR REPLACE FUNCTION cache_user_session(
  p_user_id uuid, p_role text, p_parque text
) RETURNS void AS $$
BEGIN
  INSERT INTO user_session_cache (user_id, user_role, user_parque)
  VALUES (p_user_id, p_role, p_parque)
  ON CONFLICT (user_id) DO UPDATE SET cached_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy optimizada: lee de caché en lugar de subconsulta por cada fila (elimina N+1)
CREATE POLICY "agents_see_own_parque_docs" ON documents
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
```

### Triggers para integridad de embeddings

```sql
-- Sincroniza is_active y doc_metadata cuando cambia estado o título del documento
CREATE OR REPLACE FUNCTION sync_document_embeddings()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE document_embeddings
  SET
    doc_metadata = jsonb_build_object(
      'title', NEW.title,
      'category', NEW.category,
      'created_by', NEW.created_by,
      'effective_date', NEW.effective_date
    ),
    is_active = (NEW.status = 'vigente')
  WHERE document_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_sync_embeddings
AFTER UPDATE ON documents
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.title IS DISTINCT FROM NEW.title)
EXECUTE FUNCTION sync_document_embeddings();

-- Archiva embeddings del documento reemplazado al publicar nueva versión
CREATE OR REPLACE FUNCTION archive_replaced_document_embeddings()
RETURNS TRIGGER AS $$
DECLARE v_count int;
BEGIN
  IF NEW.replaces_document_id IS NOT NULL
     AND NEW.replaces_document_id IS DISTINCT FROM OLD.replaces_document_id THEN
    SELECT COUNT(*) INTO v_count
    FROM document_embeddings WHERE document_id = NEW.replaces_document_id;

    UPDATE document_embeddings SET is_active = false
    WHERE document_id = NEW.replaces_document_id;

    INSERT INTO document_versions_archive
      (original_document_id, version_replaced_by_id, archived_embeddings_count, archived_reason)
    VALUES (NEW.replaces_document_id, NEW.id, v_count, 'new_version');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_archive_replaced
AFTER INSERT OR UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION archive_replaced_document_embeddings();

-- Invalida embeddings al cambiar parque_visibility (evita fugas de visibilidad entre parques)
CREATE OR REPLACE FUNCTION update_rls_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parque_visibility IS DISTINCT FROM OLD.parque_visibility THEN
    NEW.rls_updated_at = now();
    UPDATE document_embeddings SET is_active = false WHERE document_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_rls_change
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_rls_timestamp();
```

### Limpieza automática de embeddings obsoletos (pgcron — Fase 3)

```sql
-- Ejecutar cada domingo a las 2 AM; elimina embeddings de docs obsoletos > 90 días y re-indexa
SELECT cron.schedule(
  'cleanup_embeddings_weekly',
  '0 2 * * 0',
  $$
    UPDATE document_embeddings SET is_active = false
    WHERE document_id IN (
      SELECT id FROM documents
      WHERE status = 'obsoleto' AND updated_at < now() - interval '90 days'
    );
    REINDEX INDEX idx_document_embeddings_vector;
  $$
);
```

### Query RAG optimizada (single query con JOIN)

```sql
-- Búsqueda semántica: O(log n) con IVFFLAT, sin N+1 queries, respeta RLS por parque
SELECT
  de.content,
  de.doc_metadata->>'title' AS title,
  d.file_url,
  d.id AS document_id,
  de.embedding <-> $1::vector AS distance
FROM document_embeddings de
JOIN documents d ON de.document_id = d.id
WHERE
  de.is_active = true
  AND d.status = 'vigente'
  AND d.parque_visibility @> ARRAY[(
    SELECT user_parque FROM user_session_cache WHERE user_id = auth.uid()
  )]
  AND de.embedding <-> $1::vector < 0.3
ORDER BY distance
LIMIT 5;
```


---

## Diseño Visual (mejora sobre el reference)

El diseño de referencia es funcional. Lo elevamos con:

- **Color system:** Mantener el azul RE/MAX (#003DA5) + rojo (#DA291C) como brand colors. Añadir un dark navy (#0A1628) para headers y fondos de cards premium.
- **Tipografía:** Inter (body) + Clash Display o Sora (headings) → más premium que el diseño actual.
- **Cards con glassmorphism sutil:** Las cards de "Para vos" del dashboard con blur + gradient en lugar de colores planos.
- **Sidebar contextual:** Reemplazar el widget lateral estático de "Lo más buscado" con datos reales en tiempo real. Incluir badges num�ricos ("3 nuevos") en `/academia` y `/novedades`.
- **Status badges prominentes:** Para documentos, un badge verde "VIGENTE" / gris "OBSOLETO" bien visible.
- **Floating AI widget:** Chatbot como burbuja flotante con animación de pulso suave, siempre accesible.
- **Skeleton loaders:** En vez de spinners, usar skeletons para UX fluida.
- **Mobile-first gestures:** En mobile, swipe entre tabs en "Mi Perfil".
- **Empty states ilustrados:** SVGs personalizados cuando no hay resultados de búsqueda.
- **Micro-animaciones:** hover en cards (translateY -2px + shadow), transiciones de página con Framer Motion.

### DocumentCard con contexto integrado (módulo Legales)

Cada `DocumentCard` muestra más que un título y botón de descarga — los agentes necesitan saber de un vistazo si el documento aplica a su situación y qué cambió:

```
┌─────────────────────────────────────────────┐
│ Contrato Estándar 2024              VIGENTE  │
│ Aplica a: Agentes + Staff  •  Parque 1 + P3 │
│ "Se agregó cláusula de arbitraje"            │
│ [Últimos cambios ▼]  [Ver diferencias]       │
│                                   [PDF ⬇]   │
└─────────────────────────────────────────────┘
```

- `ChangelogExpander`: toggle que despliega `changelog_summary` del documento
- `ApplicabilityTag`: píldoras con `parque_visibility` y `applicable_roles`
- `DiffModal`: modal comparando versión actual vs anterior via `replaces_document_id`

### Onboarding wizard por rol (reemplaza formulario genérico)

**Paso 1 — Selección de rol visual (`RoleSelectionCard`):**
Cards con icono y descripción breve: Agente Inmobiliario / Staff Administrativo / Gestor-Admin

**Paso 2 — Configuración de preferencias (`DashboardPersonalization`):**
- ¿En qué parque trabajás? (filtra contenido automáticamente)
- ¿Qué temas te interesan? (checkboxes: ventas, legales, marketing, capacitaciones)

**Paso 3 — Dashboard diferenciado por rol (`RoleBasedDashboardTemplate`):**
- **Agente:** documentos de su parque + próximas capacitaciones + cursos en progreso
- **Staff:** agentes pendientes de aprobación + documentos para revisar + reportes
- **Admin:** dashboard analítico completo

### Content Feed + Engagement en el dashboard

Feed "Lo nuevo en RE/MAX" visible sobre el fold, para que Academia y Novedades tengan descubrimiento activo:

```
┌─────────────────────────────────────────────┐
│ Lo nuevo en RE/MAX                          │
├─────────────────────────────────────────────┤
│ "Cómo vender en Q2" (Curso)                 │
│   12 colegas ya lo completaron              │
│   45 min | Principiante        [Ver]        │
├─────────────────────────────────────────────┤
│ "Cambios en comisiones" (Novedad urgente)   │
│   Publicado hoy                [Leer]       │
└─────────────────────────────────────────────┘
```

- Social proof en `CourseCard`: "N agentes completaron esto"
- Progress bars en cursos iniciados para incentivar terminar
- `AchievementBadge` en `/perfil` ("Completaste 5 cursos")
- Notificación semanal (martes 9am) solo si hay contenido nuevo — evita notification fatigue
---

## Estructura de Carpetas (Next.js)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── onboarding/page.tsx
│   │   └── pending/page.tsx
│   ├── (protected)/
│   │   ├── dashboard/page.tsx
│   │   ├── academia/
│   │   │   ├── page.tsx
│   │   │   └── [cursoId]/page.tsx
│   │   ├── legales/
│   │   │   ├── page.tsx            ← PRIORIDAD MVP
│   │   │   └── [documentId]/page.tsx
│   │   ├── marketing/page.tsx
│   │   ├── eventos/page.tsx
│   │   ├── novedades/page.tsx
│   │   ├── directorio/page.tsx
│   │   └── perfil/page.tsx
│   └── (admin)/
│       └── admin/
│           ├── usuarios/page.tsx
│           ├── documentos/page.tsx
│           └── analytics/page.tsx
├── components/
│   ├── ui/          → shadcn/ui base
│   ├── layout/      → Navbar, Sidebar, Footer, ChatWidget
│   ├── documents/   → DocumentCard, DocumentList, VersionBadge, UploadForm
�   +-- courses/
�   �   +-- CourseCard.tsx            ? con social proof + progress bar
�   �   +-- ProgressBar.tsx
�   �   +-- VideoPlayer.tsx
�   �   +-- AchievementBadge.tsx      ? logros del usuario en perfil
│   ├── chat/        → ChatWidget, ChatMessage, SourceCitation
│   ├── admin/       → UserTable, ApprovalCard, DocumentEditor
│   └── shared/      → SearchBar, FilterDropdown, EmptyState, SkeletonCard
├── lib/
│   ├── supabase/    → client.ts, server.ts, middleware.ts
│   ├── openai/      → embeddings.ts, chat.ts
│   ├── search/      → full-text-search.ts
│   └── utils/       → parque-filter.ts, format-date.ts
├── hooks/
│   ├── useUser.ts
│   ├── useDocuments.ts
│   └── useChat.ts
└── types/
    └── database.ts  → tipos generados por Supabase CLI
```

---

## Fases de Implementación

### PRE-FASE 1 — Alineación (antes de escribir código)

**Objetivo: Eliminar ambigüedades que causan rework en Fases 2 y 3**

1. **Sesión RACI (90 min):** Gina Perdomo + Just Create validan y firman la Matriz de Permisos. Cambios post-sesión = costo adicional.
2. **Asignación de contenido legado:** Gina designa 1 persona para auditar Google Drive e identificar documentos activos (descartar duplicados/archivados). Esta tarea corre en paralelo al desarrollo.
3. **Definición de `changelog_summary`:** acordar con Gina qué información incluirá este campo (texto libre o estructura fija).

---

### FASE 1 — MVP: Auth + Legales + Analytics básico (3-4 semanas)
**Objetivo: Funcionalidad crítica funcionando end-to-end, con datos de adopción desde el día de lanzamiento**

1. Setup del proyecto (Next.js 15 + Supabase + Tailwind + shadcn)
2. Google SSO con Supabase Auth
3. Cache de sesión: al autenticar, llamar `cache_user_session()` RPC desde `middleware.ts`
4. **Onboarding wizard por rol** (3 pasos con `RoleSelectionCard` + `DashboardPersonalization`)
5. Flujo de aprobación de cuentas (email con Resend)
6. Tablas `profiles` + `analytics_events` + `user_session_cache`
7. Migrations SQL: schema + índices + RLS optimizada + triggers de embeddings
8. Middleware de protección de rutas usando tipos de `roles.ts`
9. **Módulo Legales completo:**
   - Upload de PDFs a Supabase Storage
   - CRUD documentos con metadata (incluyendo `changelog_summary` y `applicable_roles`)
   - Control de versiones con trigger `archive_replaced_document_embeddings`
   - Filtrado automático por parque via RLS + `user_session_cache`
   - **DocumentCard con contexto:** `ChangelogExpander` + `ApplicabilityTag` + `DiffModal`
   - Listado por acordeones con filtros (tipo, año)
   - Búsqueda por nombre + palabras clave
   - Descarga protegida (signed URLs) + evento registrado en `analytics_events`
10. Panel admin básico: gestión de usuarios + documentos
11. **Dashboard `/admin/analytics` con KPIs mínimos:**
    - Usuarios activos últimos 7 días
    - Top 5 documentos descargados
    - Sesiones por parque
12. Dashboard home con `RoleBasedDashboardTemplate` (layout diferenciado por rol)

**Sprint final Fase 1 — Migración & Validación (3-4 días antes del go-live):**
- Ejecutar `scripts/migrate-from-gdrive.ts`: importación batch desde CSV/Excel con validación de metadata
- Criterio de aceptación: 100% de documentos legales activos migrados y validados
- Smoke test de RLS: verificar que documentos de Parque 3 son invisibles para usuarios de Parque 1

---

### FASE 2 — Chatbot IA + Academia (3-4 semanas)
1. RAG pipeline: al subir PDF → generar embeddings → guardar en pgvector con `is_active = true` y `doc_metadata`
2. API route `/api/chat` con streaming usando query RAG optimizada (IVFFLAT + single JOIN)
3. ChatWidget flotante + tab full-screen en perfil
4. Filtrado de embeddings por parque del usuario (via `user_session_cache` en la query)
5. **Módulo Academia:**
   - `CourseCard` con social proof ("N colegas completaron esto") y progress bar
   - Página de curso con video + tracking de progreso en `course_progress`
   - `AchievementBadge` en `/perfil`
6. **Content Feed en dashboard:** `ContentFeedCard` + `RecommendationBanner`
7. Badges numéricos en sidebar para `/academia` y `/novedades`
8. Módulo Novedades (blog interno con editor rich text)
9. Registrar eventos `course_start` y `course_complete` en `analytics_events`

---

### FASE 3 — Marketing + Eventos + Analytics avanzado (3-4 semanas)
1. Módulo Marketing: galería de plantillas con thumbnails, links a Canva, descarga de logos
2. Módulo Eventos: calendario, inscripción con cupo, recordatorios por email
3. Directorio de Staff con links a WhatsApp
4. Dashboard Analytics avanzado: documentos más descargados, preguntas frecuentes al chatbot, tasa de completación de cursos
5. Configurar pgcron `cleanup_embeddings_weekly` para limpieza automática de embeddings obsoletos
6. Notificación semanal de novedades/cursos (martes 9am, solo si hay contenido nuevo)
7. PWA: manifest.json + service worker (next-pwa)
8. Búsqueda global cross-module

---

## Archivos Críticos a Crear

| Archivo | Propósito |
|---------|-----------|
| `src/middleware.ts` | Protección de rutas + llamada a `cache_user_session()` al autenticar |
| `src/types/roles.ts` | Enums tipados de roles y parques |
| `src/lib/supabase/server.ts` | Cliente Supabase para Server Components |
| `supabase/migrations/001_schema.sql` | Tablas + `user_session_cache` + `analytics_events` |
| `supabase/migrations/002_indexes.sql` | Índices GIN, partial, IVFFLAT |
| `supabase/migrations/003_rls.sql` | RLS policies optimizadas + función `cache_user_session` |
| `supabase/migrations/004_triggers.sql` | Triggers sync embeddings + archive + rls_change |
| `supabase/migrations/005_cron.sql` | pgcron cleanup semanal (aplicar en Fase 3) |
| `src/app/api/chat/route.ts` | RAG chatbot con streaming + query optimizada |
| `src/app/(admin)/admin/documentos/page.tsx` | CRUD documentos con control de versiones |
| `src/app/(protected)/legales/page.tsx` | Vista principal del módulo Legales |
| `src/app/(admin)/admin/analytics/page.tsx` | KPIs básicos desde Fase 1 |
| `src/components/chat/ChatWidget.tsx` | Burbuja flotante siempre visible |
| `src/components/documents/DocumentCard.tsx` | Card con contexto integrado |
| `src/components/documents/DiffModal.tsx` | Comparación de versiones |
| `src/components/documents/ChangelogExpander.tsx` | Toggle changelog en card |
| `src/components/onboarding/RoleSelectionCard.tsx` | Wizard paso 1 |
| `src/components/dashboard/ContentFeedCard.tsx` | Feed de novedades en dashboard |
| `src/lib/openai/embeddings.ts` | Indexación de PDFs al subirlos |
| `scripts/migrate-from-gdrive.ts` | Importación batch desde Google Drive (CSV → Supabase) |

---

## Verificación (cómo testear end-to-end)

1. **Auth flow:** Registrar con Google → wizard de rol (3 pasos) → email a admin → aprobar con Parque 1 → login → ver dashboard personalizado para agente
2. **Filtrado por parque:** Subir documento solo para Parque 3 → verificar que usuario Parque 1 NO lo ve, ni por URL directa
3. **DocumentCard con contexto:** Subir v2 con `changelog_summary` que reemplaza v1 → verificar badge "VIGENTE", `ChangelogExpander` muestra el resumen, `DiffModal` compara versiones
4. **Control de versiones + embeddings:** v1 desaparece del listado → trigger archiva embeddings de v1 → chatbot responde con info de v2
5. **Descarga protegida:** URL expira después de 60 segundos + evento `doc_download` registrado en `analytics_events`
6. **Analytics Fase 1:** Realizar 5 descargas → ver contador actualizado en `/admin/analytics` antes de 1 minuto
7. **Chatbot RAG:** Preguntar algo cuya respuesta está en un PDF subido → cita la fuente correcta + no devuelve contenido de parque ajeno
8. **Mobile/PWA:** Abrir en Chrome Android → banner de instalación → instalar → se abre sin barra de URL
9. **Content Feed:** Publicar curso nuevo → aparece en feed del dashboard de agentes
10. **Migración:** Importar CSV de prueba con 10 documentos → metadata correcta + visibilidad por parque respetada