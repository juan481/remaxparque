'use client';
import { useState, useRef, useCallback } from 'react';
import {
  Plus, FileText, Upload, Search, X, Eye, Clock, Loader2,
  AlertTriangle, RotateCcw, Download, RefreshCw, Pencil, Filter,
} from 'lucide-react';
import {
  createDocument, updateDocument, deleteDocument,
  uploadDocumentVersion, updateDocumentStatus,
} from '@/app/(admin)/admin/_actions/documents';
import AdminModal from './AdminModal';

// ── Types ─────────────────────────────────────────────────────
type Doc = {
  id: string; title: string; type: string | null; category: string | null;
  status: string; version: string | null; effective_date: string | null;
  parque_visibility: string[]; file_url: string | null; file_size_kb: number | null;
  file_name: string | null; changelog_summary: string | null; legal_excerpt: string | null;
  location_slug: string | null; updated_at: string | null; created_at: string;
};

// ── Constants ─────────────────────────────────────────────────
const statusColor: Record<string, string> = { vigente: '#059669', borrador: '#D97706', obsoleto: '#9CA3AF' };
const statusBg: Record<string, string>    = { vigente: '#ECFDF5', borrador: '#FFFBEB', obsoleto: '#F9FAFB' };
const statusLabel: Record<string, string> = { vigente: 'Vigente', borrador: 'Borrador', obsoleto: 'Obsoleto' };
const typeOpts    = ['contrato','formulario','proceso','otro'];
const catOpts     = ['ventas','alquileres','uif','admin','otro'];
const typeLabel: Record<string, string>   = { contrato:'Contrato', formulario:'Formulario', proceso:'Proceso', otro:'Otro' };
const catLabel: Record<string, string>    = { ventas:'Ventas', alquileres:'Alquileres', uif:'UIF', admin:'Admin', otro:'Otro' };
const LOCATION_SLUGS = [
  { value: 'alta-propiedades',  label: 'Alta de propiedades' },
  { value: 'solicitud-informes', label: 'Solicitud de informes' },
  { value: 'operatoria-diaria', label: 'Operatoria diaria' },
  { value: 'checklist-cierre',  label: 'Checklist de cierre' },
];
const ALLOWED_FORMATS = 'PDF, DOC, DOCX, PPT, JPG, PNG · Máx 30 MB';

const inp = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const lbl = 'block text-sm font-bold text-gray-700 mb-1.5';

// ── Helpers ───────────────────────────────────────────────────
function formatSize(kb: number | null) {
  if (!kb) return '';
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}
function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' });
}
function getExt(name: string | null, url: string | null): string {
  const s = (name ?? url ?? '').split('?')[0];
  return (s.split('.').pop() ?? '').toLowerCase();
}
function fileNameFromInput(f: File): string {
  return f.name.replace(/\.[^.]+$/, '').replace(/[_\-]/g, ' ').trim();
}
function nextVersion(v: string | null): string {
  if (!v) return '1.0';
  const m = v.match(/^(\d+)\.(\d+)$/);
  if (m) return `${m[1]}.${parseInt(m[2]!) + 1}`;
  return v;
}
function findSimilar(title: string, allDocs: Doc[], excludeId?: string): Doc[] {
  if (title.length < 4) return [];
  const words = title.toLowerCase().split(/[\s_\-,.()]+/).filter(w => w.length > 3);
  if (!words.length) return [];
  return allDocs.filter(d => {
    if (d.id === excludeId) return false;
    if (d.title.toLowerCase() === title.toLowerCase()) return true;
    const dWords = d.title.toLowerCase().split(/[\s_\-,.()]+/).filter(w => w.length > 3);
    const overlap = words.filter(w => dWords.includes(w)).length;
    return overlap / Math.max(words.length, dWords.length) >= 0.45;
  }).slice(0, 3);
}

// ── Component ─────────────────────────────────────────────────
export default function DocumentosClient({ docs }: { docs: Doc[] }) {
  // Modal state
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Doc | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeF, setTypeF] = useState('');
  const [catF, setCatF] = useState('');
  const [parqueF, setParqueF] = useState('');
  const [statusF, setStatusF] = useState('');

  // New doc upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [dupWarning, setDupWarning] = useState<Doc[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Version upload (inside edit modal)
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionDisplayName, setVersionDisplayName] = useState('');
  const [versionNum, setVersionNum] = useState('');
  const [versionLog, setVersionLog] = useState('');
  const [versionBusy, setVersionBusy] = useState(false);
  const [versionErr, setVersionErr] = useState<string | null>(null);
  const [versionOk, setVersionOk] = useState(false);
  const versionFileRef = useRef<HTMLInputElement>(null);

  // Preview
  const [preview, setPreview] = useState<{ url: string; name: string | null } | null>(null);

  // Inline status toggle
  const [statusBusy, setStatusBusy] = useState<string | null>(null);

  // ── Computed ─────────────────────────────────────────────────
  const filtered = docs.filter(d => {
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeF && d.type !== typeF) return false;
    if (catF && d.category !== catF) return false;
    if (parqueF && !d.parque_visibility.includes(parqueF)) return false;
    if (statusF && d.status !== statusF) return false;
    return true;
  });

  const stats = {
    total:   docs.length,
    vigente: docs.filter(d => d.status === 'vigente').length,
    obsoleto:docs.filter(d => d.status === 'obsoleto').length,
    p1:      docs.filter(d => d.parque_visibility.includes('parque1')).length,
    p3:      docs.filter(d => d.parque_visibility.includes('parque3')).length,
  };
  const hasFilters = !!(search || typeF || catF || parqueF || statusF);

  // ── Handlers ──────────────────────────────────────────────────
  const checkDuplicates = useCallback((title: string, excludeId?: string) => {
    setDupWarning(findSimilar(title, docs, excludeId));
  }, [docs]);

  function handleFileSelect(f: File) {
    setSelectedFile(f);
    const guessed = fileNameFromInput(f);
    setCustomTitle(guessed);
    checkDuplicates(guessed, edit?.id);
  }

  function openNew() {
    setEdit(null); setErr(null);
    setSelectedFile(null); setCustomTitle(''); setDupWarning([]);
    if (fileRef.current) fileRef.current.value = '';
    setOpen(true);
  }
  function openEdit(item: Doc) {
    setEdit(item); setErr(null); setDupWarning([]);
    setVersionFile(null); setVersionDisplayName(''); setVersionNum(nextVersion(item.version));
    setVersionLog(''); setVersionErr(null); setVersionOk(false);
    if (versionFileRef.current) versionFileRef.current.value = '';
    setOpen(true);
  }
  function close() {
    setOpen(false); setEdit(null); setErr(null);
    setSelectedFile(null); setCustomTitle(''); setDupWarning([]);
    setVersionFile(null); setVersionErr(null); setVersionOk(false);
  }
  function clearFilters() { setSearch(''); setTypeF(''); setCatF(''); setParqueF(''); setStatusF(''); }

  // Submit create/update metadata
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const fd = new FormData(e.currentTarget);
      if (!edit && selectedFile) fd.set('file', selectedFile);
      edit ? await updateDocument(edit.id, fd) : await createDocument(fd);
      close();
    } catch (ex) { setErr(ex instanceof Error ? ex.message : 'Error inesperado'); }
    finally { setBusy(false); }
  }

  // Submit version upload
  async function submitVersion() {
    if (!edit || !versionFile) return;
    setVersionBusy(true); setVersionErr(null); setVersionOk(false);
    try {
      const fd = new FormData();
      fd.set('file', versionFile);
      if (versionDisplayName.trim()) fd.set('display_name', versionDisplayName.trim());
      if (versionNum.trim()) fd.set('version', versionNum.trim());
      if (versionLog.trim()) fd.set('changelog_summary', versionLog.trim());
      await uploadDocumentVersion(edit.id, fd);
      setVersionOk(true);
      setVersionFile(null);
      if (versionFileRef.current) versionFileRef.current.value = '';
    } catch (ex) {
      setVersionErr(ex instanceof Error ? ex.message : 'Error al subir versión');
    }
    finally { setVersionBusy(false); }
  }

  // Quick status toggle
  async function quickStatus(id: string, current: string) {
    const next = current === 'obsoleto' ? 'vigente' : 'obsoleto';
    setStatusBusy(id);
    try { await updateDocumentStatus(id, next); }
    catch { /* silent */ }
    finally { setStatusBusy(null); }
  }

  async function remove() {
    if (!edit || !confirm('¿Eliminar este documento? Esta acción no se puede deshacer.')) return;
    setBusy(true);
    try { await deleteDocument(edit.id); close(); }
    catch (ex) { setErr(ex instanceof Error ? ex.message : 'Error al eliminar'); }
    finally { setBusy(false); }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black" style={{ color: '#0C2749' }}>Documentos</h1>
          <p className="text-gray-500 mt-1">Repositorio centralizado · Legal, operativo y administrativo</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg,#0043ff,#0C2749)' }}>
          <Upload className="w-5 h-5" /> Subir documento
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: '#0C2749', bg: '#EFF6FF' },
          { label: 'Vigentes', value: stats.vigente, color: '#059669', bg: '#ECFDF5' },
          { label: 'Obsoletos', value: stats.obsoleto, color: '#9CA3AF', bg: '#F9FAFB' },
          { label: 'Parque 1', value: stats.p1, color: '#0043ff', bg: '#EFF6FF' },
          { label: 'Parque 3', value: stats.p3, color: '#7C3AED', bg: '#F5F3FF' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-3xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar en documentos..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-300 hidden sm:block" />
          {[
            { value: typeF, setter: setTypeF, label: 'Tipo', opts: typeOpts, labelFn: (v: string) => typeLabel[v] ?? v },
            { value: catF, setter: setCatF, label: 'Categoría', opts: catOpts, labelFn: (v: string) => catLabel[v] ?? v },
          ].map(({ value, setter, label, opts, labelFn }) => (
            <select key={label} value={value} onChange={e => setter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">{label}</option>
              {opts.map(o => <option key={o} value={o}>{labelFn(o)}</option>)}
            </select>
          ))}
          <select value={parqueF} onChange={e => setParqueF(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Parque</option>
            <option value="parque1">Parque 1</option>
            <option value="parque3">Parque 3</option>
          </select>
          <select value={statusF} onChange={e => setStatusF(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Estado</option>
            <option value="vigente">Vigente</option>
            <option value="borrador">Borrador</option>
            <option value="obsoleto">Obsoleto</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" /> Limpiar
            </button>
          )}
        </div>

        {hasFilters && (
          <p className="w-full text-xs text-gray-400 mt-1">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} de {docs.length} documentos
          </p>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-black mb-2" style={{ color: '#0C2749' }}>
            {docs.length === 0 ? 'Sin documentos todavía' : 'Sin resultados'}
          </h2>
          <p className="text-gray-400 max-w-sm mx-auto mb-6">
            {docs.length === 0 ? 'Subí el primer documento al repositorio.' : 'Probá con otros filtros.'}
          </p>
          {docs.length === 0 && (
            <button onClick={openNew} className="px-6 py-3 text-white font-bold rounded-2xl"
              style={{ background: 'linear-gradient(135deg,#0043ff,#0C2749)' }}>
              Subir primer documento
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header row — desktop only */}
          <div className="hidden lg:grid grid-cols-12 gap-2 px-5 py-3 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
            <div className="col-span-4">Documento</div>
            <div className="col-span-2">Tipo · Cat.</div>
            <div className="col-span-2">Parque</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Mod.</div>
            <div className="col-span-1"></div>
          </div>

          {filtered.map((doc, i) => {
            const ext = getExt(doc.file_name, doc.file_url);
            return (
              <div key={doc.id}
                className={`grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-blue-50/20 transition-colors ${i !== 0 ? 'border-t border-gray-50' : ''}`}>

                {/* Nombre — mobile full width, desktop 4 cols */}
                <div className="col-span-10 lg:col-span-4 flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: doc.status === 'obsoleto' ? '#F9FAFB' : '#EFF6FF' }}>
                    <FileText className="w-4 h-4" style={{ color: doc.status === 'obsoleto' ? '#9CA3AF' : '#0043ff' }} />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold text-sm truncate ${doc.status === 'obsoleto' ? 'line-through text-gray-400' : ''}`}
                      style={{ color: doc.status === 'obsoleto' ? '#9CA3AF' : '#0C2749' }}>
                      {doc.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {ext && <span className="text-xs font-black text-gray-400 uppercase">{ext}</span>}
                      {doc.file_size_kb ? <span className="text-xs text-gray-400">{formatSize(doc.file_size_kb)}</span> : null}
                      {doc.version ? <span className="text-xs font-medium text-gray-400">v{doc.version}</span> : null}
                      {doc.location_slug && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-600">
                          📍 {LOCATION_SLUGS.find(s => s.value === doc.location_slug)?.label ?? doc.location_slug}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile actions */}
                <div className="col-span-2 lg:hidden flex justify-end gap-1">
                  {doc.file_url && (
                    <button onClick={() => setPreview({ url: doc.file_url!, name: doc.file_name })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                      style={{ background: '#EFF6FF', color: '#0043ff' }}>
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => openEdit(doc)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                    style={{ background: '#EFF6FF', color: '#0043ff' }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Desktop: Tipo · Cat */}
                <div className="hidden lg:block col-span-2">
                  <p className="text-xs font-medium text-gray-600">{typeLabel[doc.type ?? ''] ?? '—'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{catLabel[doc.category ?? ''] ?? '—'}</p>
                </div>

                {/* Desktop: Parque */}
                <div className="hidden lg:flex col-span-2 gap-1 flex-wrap">
                  {doc.parque_visibility.map(p => (
                    <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                      {p === 'parque1' ? 'P1' : p === 'parque3' ? 'P3' : p}
                    </span>
                  ))}
                </div>

                {/* Desktop: Estado + toggle */}
                <div className="hidden lg:flex col-span-2 items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ color: statusColor[doc.status] ?? '#9CA3AF', background: statusBg[doc.status] ?? '#F9FAFB' }}>
                    {statusLabel[doc.status] ?? doc.status}
                  </span>
                  {doc.status !== 'borrador' && (
                    <button
                      onClick={() => quickStatus(doc.id, doc.status)}
                      disabled={statusBusy === doc.id}
                      className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                      title={doc.status === 'obsoleto' ? 'Restaurar a vigente' : 'Marcar obsoleto'}>
                      {statusBusy === doc.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : doc.status === 'obsoleto'
                          ? <RotateCcw className="w-3.5 h-3.5 text-green-500" />
                          : <X className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Desktop: Última mod */}
                <div className="hidden lg:block col-span-1">
                  <span className="text-xs text-gray-400">{formatDate(doc.updated_at ?? doc.created_at)}</span>
                </div>

                {/* Desktop: Actions */}
                <div className="hidden lg:flex col-span-1 justify-end gap-1">
                  {doc.file_url && (
                    <button onClick={() => setPreview({ url: doc.file_url!, name: doc.file_name })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                      style={{ background: '#EFF6FF', color: '#0043ff' }} title="Vista previa">
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => openEdit(doc)}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ background: '#EFF6FF', color: '#0043ff' }}>
                    Editar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────── */}
      <AdminModal
        title={edit ? 'Editar documento' : 'Subir documento'}
        open={open} onClose={close} size="lg">

        {/* ── VERSION UPLOAD SECTION (edit mode only) ──────── */}
        {edit && (
          <div className="mb-6 rounded-2xl border-2 p-5 space-y-3" style={{ borderColor: '#0043ff22', background: '#EFF6FF50' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black" style={{ color: '#0C2749' }}>Subir nueva versión</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {edit.version ? `Versión actual: v${edit.version}` : 'Sin versión registrada'}
                  {edit.updated_at ? ` · Última actualización: ${formatDate(edit.updated_at)}` : ''}
                </p>
              </div>
              {versionOk && (
                <span className="text-xs font-bold px-3 py-1 rounded-full text-green-700 bg-green-100">
                  ✓ Versión actualizada
                </span>
              )}
            </div>

            {/* File picker for version */}
            <div>
              <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                style={{ borderColor: versionFile ? '#0043ff' : '#E5E7EB' }}>
                {versionFile ? (
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" style={{ color: '#0043ff' }} />
                    <span className="text-sm font-semibold" style={{ color: '#0043ff' }}>{versionFile.name}</span>
                    <span className="text-xs text-gray-400">{formatSize(Math.round(versionFile.size / 1024))}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Upload className="w-5 h-5" />
                    <span className="text-sm font-semibold">Elegir archivo nuevo</span>
                  </div>
                )}
                <input ref={versionFileRef} type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0] ?? null;
                    setVersionFile(f);
                    if (f) setVersionDisplayName(fileNameFromInput(f));
                  }} />
              </label>
              <p className="text-xs text-gray-400 mt-1">{ALLOWED_FORMATS}</p>
            </div>

            {versionFile && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Nombre de archivo</label>
                  <input value={versionDisplayName} onChange={e => setVersionDisplayName(e.target.value)}
                    className={inp} placeholder={versionFile.name} />
                </div>
                <div>
                  <label className={lbl}>Versión</label>
                  <input value={versionNum} onChange={e => setVersionNum(e.target.value)}
                    className={inp} placeholder={nextVersion(edit.version)} />
                </div>
              </div>
            )}
            {versionFile && (
              <div>
                <label className={lbl}>Resumen de cambios</label>
                <textarea value={versionLog} onChange={e => setVersionLog(e.target.value)}
                  rows={2} className={inp + ' resize-none'}
                  placeholder="Ej: Se actualizó la cláusula 4.2..." />
              </div>
            )}
            {versionErr && <p className="text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-xl">{versionErr}</p>}

            <button type="button"
              onClick={submitVersion}
              disabled={!versionFile || versionBusy}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg,#0043ff,#0C2749)' }}>
              {versionBusy
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</>
                : <><RefreshCw className="w-4 h-4" /> Actualizar versión</>}
            </button>
          </div>
        )}

        {/* ── METADATA FORM ────────────────────────────────── */}
        <form key={edit?.id ?? 'new'} onSubmit={submit} className="space-y-4">

          {/* File picker (create mode only) */}
          {!edit && (
            <div>
              <label className={lbl}>Archivo {<span className="text-red-500">*</span>}</label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                style={{ borderColor: selectedFile ? '#0043ff' : '#E5E7EB' }}>
                {selectedFile ? (
                  <div className="text-center">
                    <FileText className="w-7 h-7 mx-auto mb-1" style={{ color: '#0043ff' }} />
                    <p className="text-sm font-semibold" style={{ color: '#0043ff' }}>{selectedFile.name}</p>
                    <p className="text-xs text-gray-400">{formatSize(Math.round(selectedFile.size / 1024))}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-gray-300 mb-1.5" />
                    <span className="text-sm font-semibold text-gray-400">Seleccionar archivo</span>
                  </>
                )}
                <input ref={fileRef} type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
              </label>
              <p className="text-xs text-gray-400 mt-1">{ALLOWED_FORMATS}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className={lbl}>Nombre del documento <span className="text-red-500">*</span></label>
            <input name="title" required
              value={edit ? undefined : customTitle}
              defaultValue={edit?.title ?? ''}
              onChange={edit ? undefined : e => { setCustomTitle(e.target.value); checkDuplicates(e.target.value); }}
              className={inp}
              placeholder="Ej: Contrato de Compraventa PBA" />
          </div>

          {/* Duplicate warning */}
          {dupWarning.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: '#FFFBEB', borderColor: '#F59E0B50' }}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
              <div className="min-w-0">
                <p className="text-sm font-bold" style={{ color: '#92400E' }}>Documentos similares encontrados</p>
                <div className="mt-1.5 space-y-1">
                  {dupWarning.map(d => (
                    <div key={d.id} className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-700 font-medium">{d.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                        style={{ color: statusColor[d.status], background: statusBg[d.status] }}>
                        {statusLabel[d.status]}
                      </span>
                      <button type="button" onClick={() => { close(); openEdit(d); }}
                        className="text-xs font-bold underline" style={{ color: '#0043ff' }}>
                        Editar / subir nueva versión
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Type + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Tipo</label>
              <select name="type" defaultValue={edit?.type ?? ''} className={inp}>
                <option value="">— Seleccionar —</option>
                {typeOpts.map(o => <option key={o} value={o}>{typeLabel[o]}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Categoría</label>
              <select name="category" defaultValue={edit?.category ?? ''} className={inp}>
                <option value="">— Seleccionar —</option>
                {catOpts.map(o => <option key={o} value={o}>{catLabel[o]}</option>)}
              </select>
            </div>
          </div>

          {/* Status + Version */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Estado</label>
              <select name="status" defaultValue={edit?.status ?? 'borrador'} className={inp}>
                <option value="borrador">Borrador</option>
                <option value="vigente">Vigente</option>
                <option value="obsoleto">Obsoleto</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Versión</label>
              <input name="version" defaultValue={edit?.version ?? ''} className={inp} placeholder="Ej: 2.0" />
            </div>
          </div>

          {/* Parque visibility */}
          <div>
            <label className={lbl}>Visibilidad por parque</label>
            <div className="flex gap-6 mt-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input name="parque_visibility" type="checkbox" value="parque1"
                  defaultChecked={edit?.parque_visibility?.includes('parque1') ?? true}
                  className="w-4 h-4 rounded accent-blue-600" />
                RE/MAX Parque 1
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input name="parque_visibility" type="checkbox" value="parque3"
                  defaultChecked={edit?.parque_visibility?.includes('parque3') ?? true}
                  className="w-4 h-4 rounded accent-blue-600" />
                RE/MAX Parque 3
              </label>
            </div>
          </div>

          {/* Effective date */}
          <div>
            <label className={lbl}>Fecha efectiva</label>
            <input name="effective_date" type="date"
              defaultValue={edit?.effective_date?.slice(0, 10) ?? ''}
              className={inp} />
          </div>

          {/* Location slug */}
          <div>
            <label className={lbl}>
              Sección del front-end
              <span className="ml-2 text-xs font-normal text-gray-400">(opcional · para acceso dinámico desde la plataforma)</span>
            </label>
            <select name="location_slug" defaultValue={edit?.location_slug ?? ''} className={inp}>
              <option value="">— Sin vinculación —</option>
              {LOCATION_SLUGS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Changelog */}
          <div>
            <label className={lbl}>Resumen de cambios</label>
            <textarea name="changelog_summary" rows={2}
              defaultValue={edit?.changelog_summary ?? ''}
              className={inp + ' resize-none'}
              placeholder="Ej: Se actualizó la cláusula de arbitraje..." />
          </div>

          {/* Current file info (edit mode) */}
          {edit?.file_url && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-600 truncate">
                  {edit.file_name ?? 'Archivo actual'}
                </p>
                {edit.file_size_kb && <p className="text-xs text-gray-400">{formatSize(edit.file_size_kb)}</p>}
              </div>
              <a href={edit.file_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0"
                style={{ background: '#EFF6FF', color: '#0043ff' }}>
                <Download className="w-3.5 h-3.5" /> Ver
              </a>
            </div>
          )}

          {err && <p className="text-sm text-red-600 font-medium bg-red-50 px-4 py-2.5 rounded-xl">{err}</p>}

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            {edit && (
              <button type="button" onClick={remove} disabled={busy}
                className="px-4 py-2.5 text-sm font-bold rounded-xl text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                Eliminar
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={close}
                className="px-5 py-2.5 text-sm font-bold rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={busy}
                className="px-6 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-60 transition-all"
                style={{ background: 'linear-gradient(135deg,#0043ff,#0C2749)' }}>
                {busy ? 'Guardando...' : edit ? 'Guardar cambios' : 'Subir documento'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* ── Native Preview Modal ───────────────────────────── */}
      {preview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col"
            style={{ width: '90vw', maxWidth: '960px', height: '88vh' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <p className="font-bold text-sm truncate mr-4" style={{ color: '#0C2749' }}>
                {preview.name ?? 'Vista previa'}
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={preview.url} download target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-xl text-white"
                  style={{ background: '#059669' }}>
                  <Download className="w-4 h-4" /> Descargar
                </a>
                <button onClick={() => setPreview(null)}
                  className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 rounded-b-2xl overflow-hidden">
              <DocViewerFrame url={preview.url} name={preview.name} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline viewer (PDF = iframe, Office = Google Viewer) ──────
function DocViewerFrame({ url, name }: { url: string; name: string | null }) {
  const ext = getExt(name, url);
  const isImg = ['jpg', 'jpeg', 'png'].includes(ext);
  const isPdf = ext === 'pdf';
  const src = isPdf || isImg ? url
    : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  if (isImg) {
    return (
      <div className="w-full h-full flex items-center justify-center overflow-auto bg-gray-50 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="preview" className="max-w-full max-h-full object-contain rounded-xl" />
      </div>
    );
  }
  return (
    <iframe src={src} className="w-full h-full border-0" title="Vista previa del documento"
      sandbox="allow-scripts allow-same-origin allow-popups" />
  );
}
