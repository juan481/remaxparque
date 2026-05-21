'use client';
import { useState } from 'react';
import { Plus, Image as ImageIcon, Link as LinkIcon, Trash2, Pencil, Eye, EyeOff } from 'lucide-react';
import { createBanner, updateBanner, deleteBanner } from '@/app/(admin)/admin/_actions/banner';
import AdminModal from './AdminModal';

type Banner = {
  id: string;
  image_url: string;
  link_url: string | null;
  title: string | null;
  is_active: boolean;
  parque_visibility: string;
};

const inp = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const lbl = 'block text-sm font-bold text-gray-700 mb-1.5';

export default function BannerClient({ banners }: { banners: Banner[] }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Banner | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function openNew() { setEdit(null); setErr(null); setOpen(true); }
  function openEdit(b: Banner) { setEdit(b); setErr(null); setOpen(true); }
  function close() { setOpen(false); setEdit(null); setErr(null); }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const fd = new FormData(e.currentTarget);
      edit ? await updateBanner(edit.id, fd) : await createBanner(fd);
      close();
    } catch (ex) { setErr(ex instanceof Error ? ex.message : 'Error inesperado'); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!edit || !confirm('Eliminar este banner?')) return;
    setBusy(true);
    try { await deleteBanner(edit.id); close(); }
    catch (ex) { setErr(ex instanceof Error ? ex.message : 'Error al eliminar'); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Banners del Home</h1>
          <p className="text-gray-500 mt-1">Gestioná los banners que aparecen debajo del header en el inicio</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all shadow-sm"
          style={{background:'#0043ff'}}>
          <Plus className="w-4 h-4" /> Nuevo banner
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total', value: banners.length, color: '#0043ff', bg: '#EFF6FF' },
          { label: 'Activos', value: banners.filter(b => b.is_active).length, color: '#059669', bg: '#ECFDF5' },
          { label: 'Inactivos', value: banners.filter(b => !b.is_active).length, color: '#9CA3AF', bg: '#F9FAFB' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <p className="text-3xl font-black" style={{color: s.color}}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="font-bold text-gray-400">No hay banners cargados</p>
          <p className="text-sm text-gray-400 mt-1">Creá el primero con el botón "Nuevo banner"</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col sm:flex-row">
              <div className="w-full sm:w-48 h-32 sm:h-auto flex-shrink-0 relative overflow-hidden bg-gray-100">
                <img src={b.image_url} alt={b.title ?? 'Banner'} className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {b.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {b.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                      {b.parque_visibility === 'both' ? 'Ambos parques' : b.parque_visibility === 'parque1' ? 'Parque 1' : 'Parque 3'}
                    </span>
                  </div>
                  {b.title && <p className="font-bold text-base" style={{color:'#0C2749'}}>{b.title}</p>}
                  {b.link_url && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 truncate">
                      <LinkIcon className="w-3 h-3 flex-shrink-0" /> {b.link_url}
                    </p>
                  )}
                </div>
                <div className="flex justify-end mt-3">
                  <button onClick={() => openEdit(b)}
                    className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl border-2 transition-all hover:bg-[#0043ff] hover:text-white hover:border-[#0043ff]"
                    style={{borderColor:'#0043ff', color:'#0043ff'}}>
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal open={open} onClose={close} title={edit ? 'Editar banner' : 'Nuevo banner'}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={lbl}>URL de la imagen *</label>
            <input name="image_url" required defaultValue={edit?.image_url ?? ''} className={inp} placeholder="https://..." />
          </div>
          <div>
            <label className={lbl}>Título (opcional)</label>
            <input name="title" defaultValue={edit?.title ?? ''} className={inp} placeholder="Ej: Capacitación anual 2026" />
          </div>
          <div>
            <label className={lbl}>Link al hacer clic (opcional)</label>
            <input name="link_url" defaultValue={edit?.link_url ?? ''} className={inp} placeholder="https://..." />
          </div>
          <div>
            <label className={lbl}>Visibilidad por parque</label>
            <select name="parque_visibility" defaultValue={edit?.parque_visibility ?? 'both'} className={inp}>
              <option value="both">Ambos parques</option>
              <option value="parque1">Solo Parque 1</option>
              <option value="parque3">Solo Parque 3</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" name="is_active" id="is_active" defaultChecked={edit?.is_active ?? false} className="w-4 h-4 rounded" />
            <label htmlFor="is_active" className="text-sm font-bold text-gray-700">Mostrar en el home ahora</label>
          </div>

          {err && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{err}</p>}

          <div className="flex gap-3 pt-2">
            {edit && (
              <button type="button" onClick={remove} disabled={busy}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 transition-all disabled:opacity-50">
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            )}
            <button type="button" onClick={close} disabled={busy}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={busy}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
              style={{background:'#0043ff'}}>
              {busy ? 'Guardando...' : edit ? 'Guardar cambios' : 'Crear banner'}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}