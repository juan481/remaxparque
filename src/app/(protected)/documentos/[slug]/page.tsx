import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Download, FileText, AlertCircle, Clock, Tag,
} from 'lucide-react';
import DocViewer from './DocViewer';

// ── Slug → page title map ─────────────────────────────────────
const SLUG_META: Record<string, { label: string; back: string; backHref: string }> = {
  'alta-propiedades':  { label: 'Alta de propiedades',  back: 'Legales', backHref: '/legales' },
  'solicitud-informes': { label: 'Solicitud de informes', back: 'Legales', backHref: '/legales' },
  'operatoria-diaria': { label: 'Operatoria diaria',    back: 'Mi Oficina', backHref: '/directorio' },
  'checklist-cierre':  { label: 'Checklist de cierre',  back: 'Mi Oficina', backHref: '/directorio' },
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
}

type Doc = {
  id: string; title: string; type: string | null; category: string | null;
  status: string; version: string | null; file_url: string | null;
  file_name: string | null; file_size_kb: number | null;
  parque_visibility: string[]; changelog_summary: string | null;
  updated_at: string | null; created_at: string;
};

export default async function DocumentViewerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = SLUG_META[slug];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from('profiles')
    .select('parque, role')
    .eq('id', user.id)
    .single();

  const isAdmin = ['staff', 'admin'].includes(profile?.role ?? '');
  const parque = profile?.parque ?? null;

  // Fetch documents for this slug
  let query = admin
    .from('documents')
    .select('id, title, type, category, status, version, file_url, file_name, file_size_kb, parque_visibility, changelog_summary, updated_at, created_at')
    .eq('location_slug', slug)
    .neq('status', 'obsoleto')
    .order('updated_at', { ascending: false });

  // Regular users: filter to their parque
  if (!isAdmin && parque && parque !== 'both') {
    query = query.contains('parque_visibility', [parque]);
  }

  const { data: docs } = await query;
  const list: Doc[] = docs ?? [];

  const backHref = meta?.backHref ?? '/legales';
  const backLabel = meta?.back ?? 'Legales';

  // ── No documents found ────────────────────────────────────
  if (list.length === 0) {
    return (
      <div>
        <Link href={backHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </Link>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <AlertCircle className="w-14 h-14 mx-auto mb-4" style={{ color: '#D97706' }} />
          <h2 className="text-xl font-black mb-2" style={{ color: '#0C2749' }}>
            Documento no disponible
          </h2>
          <p className="text-gray-400 max-w-sm mx-auto">
            Este recurso todavía no está cargado o no es accesible para tu parque.
            Consultá con tu administrador.
          </p>
        </div>
      </div>
    );
  }

  // ── Admin with multiple parques: show selector ────────────
  if (isAdmin && list.length > 1) {
    return (
      <div>
        <Link href={backHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </Link>
        <div className="mb-6">
          <h1 className="text-2xl font-black" style={{ color: '#0C2749' }}>{meta?.label ?? slug}</h1>
          <p className="text-sm text-gray-400 mt-1">Hay versiones para distintos parques. Seleccioná la que querés ver.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {list.map(doc => (
            <AdminDocCard key={doc.id} doc={doc} />
          ))}
        </div>
      </div>
    );
  }

  // ── Single document view ──────────────────────────────────
  const doc = list[0]!;

  return (
    <div>
      {/* Back nav */}
      <Link href={backHref}
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#EFF6FF' }}>
            <FileText className="w-6 h-6" style={{ color: '#0043ff' }} />
          </div>
          <div>
            <h1 className="text-2xl font-black leading-tight" style={{ color: '#0C2749' }}>{doc.title}</h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {doc.version && (
                <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  <Tag className="w-3 h-3" /> v{doc.version}
                </span>
              )}
              {doc.parque_visibility.map(p => (
                <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                  {p === 'parque1' ? 'RE/MAX Parque 1' : 'RE/MAX Parque 3'}
                </span>
              ))}
              {(doc.updated_at ?? doc.created_at) && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  Actualizado: {formatDate(doc.updated_at ?? doc.created_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        {doc.file_url && (
          <a href={doc.file_url} download target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 font-bold text-sm text-white rounded-2xl shadow transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
            <Download className="w-4 h-4" /> Descargar
          </a>
        )}
      </div>

      {/* Notes */}
      {doc.changelog_summary && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
          <span className="font-bold">Notas: </span>{doc.changelog_summary}
        </div>
      )}

      {/* Viewer */}
      {doc.file_url ? (
        <DocViewer fileUrl={doc.file_url} fileName={doc.file_name} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-semibold">Archivo no disponible</p>
          <p className="text-sm text-gray-400 mt-1">El administrador todavía no subió el archivo.</p>
        </div>
      )}
    </div>
  );
}

// ── Card for admin multi-parque selector ──────────────────────
function AdminDocCard({ doc }: { doc: Doc }) {
  const parqueNames = doc.parque_visibility.map(p =>
    p === 'parque1' ? 'Parque 1' : p === 'parque3' ? 'Parque 3' : p
  ).join(' · ');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#EFF6FF' }}>
          <FileText className="w-5 h-5" style={{ color: '#0043ff' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-sm leading-tight" style={{ color: '#0C2749' }}>{doc.title}</p>
          <p className="text-xs text-gray-400 mt-1">{parqueNames}</p>
          {doc.version && <p className="text-xs text-gray-400">v{doc.version}</p>}
        </div>
      </div>
      {doc.file_url && (
        <div className="flex gap-2 mt-4">
          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl text-white"
            style={{ background: '#0043ff' }}>
            <Download className="w-4 h-4" /> Ver / Descargar
          </a>
        </div>
      )}
    </div>
  );
}
