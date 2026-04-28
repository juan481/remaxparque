'use client';
import { useState, useRef } from 'react';
import { Plus, Library, Upload, FileText, RefreshCw, X } from 'lucide-react';
import { createLibraryResource, updateLibraryResource, deleteLibraryResource } from '@/app/(admin)/admin/_actions/library';
import AdminModal from './AdminModal';

type Resource = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  parque_visibility: string[];
  file_url: string | null;
  file_name: string | null;
  file_size_kb: number | null;
  file_type: string | null;
  is_active: boolean;
  created_at: string;
};

const CATEGORIES = [
  { value: 'capacitacion', label: 'Material de Capacitacion' },
  { value: 'presentaciones', label: 'Presentaciones' },
  { value: 'plantillas', label: 'Plantillas editables' },
  { value: 'guias', label: 'Guias y Manuales' },
  { value: 'formularios', label: 'Formularios' },
  { value: 'normativa', label: 'Normativa' },
  { value: 'videos', label: 'Videos' },
  { value: 'otro', label: 'Otro' },
];

const CAT_COLOR: Record<string, string> = {
  capacitacion: '#0043ff', presentaciones: '#7C3AED',
  plantillas: '#D97706', guias: '#0D9488', formularios: '#059669',
  normativa: '#ff1200', videos: '#EC4899', otro: '#9CA3AF',
};

const inp = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const lbl = 'block text-sm font-bold text-gray-700 mb-1.5';

function catColor(cat: string) { return CAT_COLOR[cat] ?? '#9CA3AF'; }
function catLabel(cat: string) { return CATEGORIES.find(c => c.value === cat)?.label ?? cat; }
function formatSize(kb: number | null) {
  if (!kb) return '';
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export default function BibliotecaAdminClient({ resources }: { resources: Resource[] }) {
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [edit, setEdit] = useState<Resource | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [parqueFilter, setParqueFilter] = useState('');

  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; errors: string[] } | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const bulkFormRef = useRef<HTMLFormElement>(null);

  const filtered = resources.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || r.category === catFilter;
    const matchParque = !parqueFilter || r.parque_visibility.includes(parqueFilter);
    return matchSearch && matchCat && matchParque;
  });

  function openNew() { setEdit(null); setErr(null); setOpen(true); }
  function openEdit(r: Resource) { setEdit(r); setErr(null); setOpen(true); }
  function close() { setOpen(false); setEdit(null); setErr(null); }
  function closeBulk() {
    setBulkOpen(false);
    setBulkFiles([]);
    setBulkProgress(null);
    setBulkBusy(false);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const fd = new FormData(e.currentTarget);
      edit ? await updateLibraryResource(edit.id, fd) : await createLibraryResource(fd);
      close();
    } catch (ex) { setErr(ex instanceof Error ? ex.message : 'Error inesperado'); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!edit || !confirm('Eliminar este recurso?')) return;
    setBusy(true);
    try { await deleteLibraryResource(edit.id); close(); }
    catch (ex) { setErr(ex instanceof Error ? ex.message : 'Error al eliminar'); }
    finally { setBusy(false); }
  }

  async function submitBulk(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!bulkFiles.length) return;
    setBulkBusy(true);
    const fd = new FormData(e.currentTarget);
    const category = (fd.get('category') as string) || 'otro';
    const pv = fd.getAll('parque_visibility') as string[];
    const errors: string[] = [];
    setBulkProgress({ done: 0, total: bulkFiles.length, errors: [] });

    for (const file of bulkFiles) {
      const fileFd = new FormData();
      fileFd.set('file', file);
      fileFd.set('title', file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').trim());
      fileFd.set('category', category);
      fileFd.set('is_active', 'on');
      if (pv.length) {
        pv.forEach(p => fileFd.append('parque_visibility', p));
      } else {
        fileFd.append('parque_visibility', 'parque1');
        fileFd.append('parque_visibility', 'parque3');
      }
      try { await createLibraryResource(fileFd); }
      catch (ex) { errors.push(`${file.name}: ${ex instanceof Error ? ex.message : 'Error'}`); }
      setBulkProgress(prev => prev ? { ...prev, done: prev.done + 1, errors } : { done: 1, total: bulkFiles.length, errors });
    }

    setBulkBusy(false);
    if (errors.length === 0) closeBulk();
  }

  const active = resources.filter(r => r.is_active).length;
  const p1 = resources.filter(r => r.parque_visibility.includes('parque1')).length;
  const p3 = resources.filter(r => r.parque_visibility.includes('parque3')).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black" style={{ color: '#0C2749' }}>Biblioteca Digital</h1>
          <p className="text-gray-500 mt-1">Repositorio centralizado de recursos para agentes</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setBulkFiles([]); setBulkProgress(null); setBulkBusy(false); setBulkOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-2xl border-2 transition-all hover:bg-blue-50"
            style={{ borderColor: '#0043ff', color: '#0043ff' }}>
            <Upload className="w-4 h-4" /> Carga masiva
          </button>
          <button onClick={openNew}
            className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg,#0043ff,#0C2749)' }}>
            <Plus className="w-5 h-5" /> Subir recurso
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total recursos', value: resources.length, color: '#0C2749', bg: '#EFF6FF' },
          { label: 'Activos', value: active, color: '#059669', bg: '#ECFDF5' },
          { label: 'Parque 1', value: p1, color: '#0043ff', bg: '#EFF6FF' },
          { label: 'Parque 3', value: p3, color: '#7C3AED', bg: '#F5F3FF' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md transition-all">
            <p className="text-4xl font-black" style={{ color }}>{value}</p>
            <p className="text-sm font-bold text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar recursos..."
          className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">Todas las categorias</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={parqueFilter} onChange={e => setParqueFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">Todos los parques</option>
          <option value="parque1">Parque 1</option>
          <option value="parque3">Parque 3</option>
        </select>
        {(search || catFilter || parqueFilter) && (
          <button onClick={() => { setSearch(''); setCatFilter(''); setParqueFilter(''); }}
            className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" /> Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <Library className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-black mb-2" style={{ color: '#0C2749' }}>
            {resources.length === 0 ? 'Sin recursos todavia' : 'Sin resultados'}
          </h2>
          <p className="text-gray-400 max-w-sm mx-auto mb-6">
            {resources.length === 0 ? 'Subi el primer archivo a la biblioteca.' : 'Proba con otros filtros.'}
          </p>
          {resources.length === 0 && (
            <button onClick={openNew} className="px-6 py-3 text-white font-bold rounded-2xl"
              style={{ background: 'linear-gradient(135deg,#0043ff,#0C2749)' }}>
              Subir primer recurso
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
            <div className="col-span-5">Recurso</div>
            <div className="col-span-2">Categoria</div>
            <div className="col-span-2">Parque</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-1"></div>
          </div>
          {filtered.map((r, i) => (
            <div key={r.id} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-blue-50/30 transition-colors ${i !== 0 ? 'border-t border-gray-50' : ''}`}>
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: catColor(r.category) + '15' }}>
                  <FileText className="w-5 h-5" style={{ color: catColor(r.category) }} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: '#0C2749' }}>{r.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {r.file_type && <span className="text-xs font-bold text-gray-400 uppercase">{r.file_type}</span>}
                    {r.file_size_kb && <span className="text-xs text-gray-400">{formatSize(r.file_size_kb)}</span>}
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ color: catColor(r.category), background: catColor(r.category) + '15' }}>
                  {catLabel(r.category)}
                </span>
              </div>
              <div className="col-span-2 flex gap-1 flex-wrap">
                {r.parque_visibility.map(p => (
                  <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                    {p === 'parque1' ? 'P1' : p === 'parque3' ? 'P3' : p}
                  </span>
                ))}
              </div>
              <div className="col-span-2">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${r.is_active ? 'text-green-700 bg-green-50' : 'text-gray-500 bg-gray-100'}`}>
                  {r.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="col-span-1 flex justify-end">
                <button onClick={() => openEdit(r)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                  style={{ background: '#EFF6FF', color: '#0043ff' }}>
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single resource modal */}
      <AdminModal title={edit ? 'Editar recurso' : 'Subir recurso'} open={open} onClose={close} size="lg">
        <form key={edit?.id ?? 'new'} onSubmit={submit} className="space-y-4">
          <div>
            <label className={lbl}>T&#237;tulo <span className="text-red-500">*</span></label>
            <input name="title" required defaultValue={edit?.title ?? ''} className={inp}
              placeholder="Ej: Manual de Ventas 2024" />
          </div>

          <div>
            <label className={lbl}>Archivo {!edit && <span className="text-red-500">*</span>}</label>
            <input name="file" type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp4,.mov,.zip,.rar"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
            {edit?.file_url && (
              <p className="text-xs text-gray-400 mt-1">
                Archivo actual: <a href={edit.file_url} target="_blank" className="text-blue-600 underline">
                  {edit.file_name ?? 'ver archivo'}
                </a>
                {edit.file_size_kb && ` (${formatSize(edit.file_size_kb)})`}
              </p>
            )}
          </div>

          <div>
            <label className={lbl}>Descripci&#243;n</label>
            <textarea name="description" rows={2} defaultValue={edit?.description ?? ''} className={inp + ' resize-none'}
              placeholder="Descripcion breve del recurso..." />
          </div>

          <div>
            <label className={lbl}>Categor&#237;a</label>
            <select name="category" defaultValue={edit?.category ?? 'otro'} className={inp}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className={lbl}>Visibilidad por parque</label>
            <div className="flex gap-6 mt-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input name="parque_visibility" type="checkbox" value="parque1"
                  defaultChecked={edit?.parque_visibility?.includes('parque1') ?? true}
                  className="w-4 h-4 rounded accent-blue-600" />
                Parque 1
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input name="parque_visibility" type="checkbox" value="parque3"
                  defaultChecked={edit?.parque_visibility?.includes('parque3') ?? true}
                  className="w-4 h-4 rounded accent-blue-600" />
                Parque 3
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input name="is_active" type="checkbox" value="on"
                defaultChecked={edit?.is_active ?? true}
                className="w-4 h-4 rounded accent-blue-600" />
              Recurso activo (visible para agentes)
            </label>
          </div>

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
                {busy ? 'Guardando...' : edit ? 'Guardar cambios' : 'Subir recurso'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* Bulk upload modal */}
      <AdminModal title="Carga masiva de archivos" open={bulkOpen} onClose={closeBulk} size="lg">
        <form ref={bulkFormRef} onSubmit={submitBulk} className="space-y-5">
          <div>
            <label className={lbl}>Archivos <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors">
              <Upload className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-bold text-gray-500 mb-1">Selecciona m&#250;ltiples archivos</p>
              <p className="text-xs text-gray-400 mb-4">PDF, DOC, PPT, XLS, MP4, ZIP (hasta 50 MB por archivo)</p>
              <input type="file" multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp4,.mov,.zip,.rar"
                onChange={e => setBulkFiles(Array.from(e.target.files ?? []))}
                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
            </div>

            {bulkFiles.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {bulkFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{f.name}</span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatSize(Math.round(f.size / 1024))}</span>
                  </div>
                ))}
                <p className="text-xs font-bold text-right" style={{ color: '#0043ff' }}>
                  {bulkFiles.length} archivo{bulkFiles.length !== 1 ? 's' : ''} seleccionado{bulkFiles.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className={lbl}>Categor&#237;a (aplica a todos)</label>
            <select name="category" className={inp}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className={lbl}>Visibilidad (aplica a todos)</label>
            <div className="flex gap-6 mt-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input name="parque_visibility" type="checkbox" value="parque1" defaultChecked
                  className="w-4 h-4 rounded accent-blue-600" />
                Parque 1
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input name="parque_visibility" type="checkbox" value="parque3" defaultChecked
                  className="w-4 h-4 rounded accent-blue-600" />
                Parque 3
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Pods cambiar la visibilidad individual de cada archivo despues.</p>
          </div>

          {/* Progress */}
          {bulkProgress && (
            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-blue-800">
                  {bulkBusy
                    ? `Subiendo... ${bulkProgress.done}/${bulkProgress.total}`
                    : `Completado: ${bulkProgress.done}/${bulkProgress.total}`}
                </span>
                {!bulkBusy && bulkProgress.errors.length === 0 && (
                  <span className="text-xs font-bold text-green-600">Todos subidos correctamente</span>
                )}
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.done / bulkProgress.total) * 100 : 0}%` }} />
              </div>
              {bulkProgress.errors.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-bold text-red-700">{bulkProgress.errors.length} error{bulkProgress.errors.length !== 1 ? 'es' : ''}:</p>
                  {bulkProgress.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={closeBulk}
                className="px-5 py-2.5 text-sm font-bold rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
                {bulkProgress && !bulkBusy ? 'Cerrar' : 'Cancelar'}
              </button>
              {(!bulkProgress || bulkProgress.errors.length > 0) && (
                <button type="submit" disabled={bulkBusy || bulkFiles.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-60 transition-all"
                  style={{ background: 'linear-gradient(135deg,#0043ff,#0C2749)' }}>
                  {bulkBusy
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Subiendo...</>
                    : <><Upload className="w-4 h-4" /> Subir {bulkFiles.length} archivo{bulkFiles.length !== 1 ? 's' : ''}</>}
                </button>
              )}
            </div>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
