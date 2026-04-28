'use client';
import { useState } from 'react';
import { Plus, Camera, Image as ImageIcon, Video, Share2, FileText, MessageCircle, Link, Megaphone } from 'lucide-react';
import { createTemplate, updateTemplate, deleteTemplate } from '@/app/(admin)/admin/_actions/marketing';
import AdminModal from './AdminModal';

type Template = {
  id: string; title: string; category: string; description: string | null;
  canva_link: string | null; thumbnail_url: string | null;
  parque_visibility: string[]; is_active: boolean;
};

const CAT_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  historias: { label:'Historias', icon: Camera, color:'#E1306C', bg:'#FDF2F8' },
  posts: { label:'Posts', icon: ImageIcon, color:'#0043ff', bg:'#EFF6FF' },
  reels: { label:'Reels', icon: Video, color:'#7C3AED', bg:'#F5F3FF' },
  'nueva-imagen': { label:'Nueva imagen', icon: Share2, color:'#059669', bg:'#ECFDF5' },
  fuentes: { label:'Fuentes', icon: FileText, color:'#D97706', bg:'#FFFBEB' },
  whatsapp: { label:'WhatsApp', icon: MessageCircle, color:'#25D366', bg:'#F0FDF4' },
};

const inp = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const lbl = 'block text-sm font-bold text-gray-700 mb-1.5';

export default function MarketingClient({ templates }: { templates: Template[] }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Template | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const active = templates.filter(t => t.is_active).length;

  function openNew() { setEdit(null); setErr(null); setOpen(true); }
  function openEdit(item: Template) { setEdit(item); setErr(null); setOpen(true); }
  function close() { setOpen(false); setEdit(null); setErr(null); }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const fd = new FormData(e.currentTarget);
      edit ? await updateTemplate(edit.id, fd) : await createTemplate(fd);
      close();
    } catch(ex) { setErr(ex instanceof Error ? ex.message : 'Error inesperado'); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!edit || !confirm('Eliminar esta plantilla?')) return;
    setBusy(true);
    try { await deleteTemplate(edit.id); close(); }
    catch(ex) { setErr(ex instanceof Error ? ex.message : 'Error al eliminar'); }
    finally { setBusy(false); }
  }

  const grouped = Object.keys(CAT_META).map(cat => ({
    cat,
    meta: CAT_META[cat],
    items: templates.filter(t => t.category === cat),
  }));

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Marketing</h1>
          <p className="text-gray-500 mt-1">Gestioná plantillas de Canva y recursos para el equipo</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all duration-200" style={{background:'linear-gradient(135deg,#0043ff,#0C2749)'}}>
          <Plus className="w-5 h-5" /> Agregar plantilla
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {Object.entries(CAT_META).map(([id, {label, icon: Icon, color, bg}]) => {
          const count = templates.filter(t => t.category === id && t.is_active).length;
          return (
            <div key={id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:bg}}>
                <Icon className="w-6 h-6" style={{color}} />
              </div>
              <span className="text-sm font-bold text-gray-700">{label}</span>
              <span className="text-xs text-gray-400">{count} plantilla{count!==1?'s':''}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[{label:'Total',value:templates.length,color:'#0C2749',bg:'#EFF6FF'},{label:'Activas',value:active,color:'#059669',bg:'#ECFDF5'},{label:'Inactivas',value:templates.length-active,color:'#9CA3AF',bg:'#F9FAFB'}].map(({label,value,color,bg}) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md transition-all">
            <p className="text-4xl font-black" style={{color}}>{value}</p>
            <p className="text-sm font-bold text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-black mb-2" style={{color:'#0C2749'}}>Sin plantillas todavía</h2>
          <p className="text-gray-400 max-w-sm mx-auto mb-6">Agregá la primera plantilla de Canva para el equipo.</p>
          <button onClick={openNew} className="px-6 py-3 text-white font-bold rounded-2xl" style={{background:'linear-gradient(135deg,#0043ff,#0C2749)'}}>Agregar primera plantilla</button>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.filter(g => g.items.length > 0).map(({ cat, meta, items }) => {
            const Icon = meta.icon;
            return (
              <div key={cat}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:meta.bg}}>
                    <Icon className="w-5 h-5" style={{color:meta.color}} />
                  </div>
                  <h2 className="text-lg font-black" style={{color:'#0C2749'}}>{meta.label}</h2>
                  <span className="text-sm text-gray-400">{items.length} plantilla{items.length!==1?'s':''}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(t => (
                    <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all">
                      {t.thumbnail_url ? (
                        <img src={t.thumbnail_url} alt={t.title} className="w-full h-36 object-cover rounded-xl mb-3" />
                      ) : (
                        <div className="w-full h-36 rounded-xl mb-3 flex items-center justify-center" style={{background:meta.bg}}>
                          <Icon className="w-10 h-10" style={{color:meta.color}} />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-bold text-sm leading-tight" style={{color:'#0C2749'}}>{t.title}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${t.is_active?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                          {t.is_active?'Activa':'Inactiva'}
                        </span>
                      </div>
                      {t.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{t.description}</p>}
                      <div className="flex gap-2">
                        {t.canva_link && (
                          <a href={t.canva_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80" style={{background:meta.bg,color:meta.color}}>
                            <Link className="w-3 h-3" /> Canva
                          </a>
                        )}
                        <button onClick={()=>openEdit(t)} className="text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity ml-auto" style={{background:'#EFF6FF',color:'#0043ff'}}>Editar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AdminModal title={edit?'Editar plantilla':'Nueva plantilla'} open={open} onClose={close} size="lg">
        <form key={edit?.id??'new'} onSubmit={submit} className="space-y-4">
          <div>
            <label className={lbl}>Título <span className="text-red-500">*</span></label>
            <input name="title" required defaultValue={edit?.title??''} className={inp} placeholder="Ej: Historia Promoción Propiedad" />
          </div>
          <div>
            <label className={lbl}>Categoría <span className="text-red-500">*</span></label>
            <select name="category" required defaultValue={edit?.category??''} className={inp}>
              <option value="">— Seleccionar —</option>
              {Object.entries(CAT_META).map(([id,{label}]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Descripción</label>
            <textarea name="description" rows={2} defaultValue={edit?.description??''} className={inp+' resize-none'} placeholder="Formato, uso, etc..." />
          </div>
          <div>
            <label className={lbl}>Link de Canva</label>
            <input name="canva_link" type="url" defaultValue={edit?.canva_link??''} className={inp} placeholder="https://www.canva.com/design/..." />
          </div>
          <div>
            <label className={lbl}>URL de miniatura (preview)</label>
            <input name="thumbnail_url" type="url" defaultValue={edit?.thumbnail_url??''} className={inp} placeholder="https://..." />
          </div>
          <div>
            <label className={lbl}>Visibilidad por parque</label>
            <div className="flex gap-6 mt-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input name="parque_visibility" type="checkbox" value="parque1" defaultChecked={edit?.parque_visibility?.includes('parque1')??true} className="w-4 h-4 rounded accent-blue-600" />
                Parque 1
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input name="parque_visibility" type="checkbox" value="parque3" defaultChecked={edit?.parque_visibility?.includes('parque3')??true} className="w-4 h-4 rounded accent-blue-600" />
                Parque 3
              </label>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input name="is_active" type="checkbox" id="tpl_active" value="on" defaultChecked={edit?.is_active??true} className="w-4 h-4 rounded accent-blue-600" />
            <label htmlFor="tpl_active" className="text-sm font-bold text-gray-700">Activa (visible para el equipo)</label>
          </div>
          {err && <p className="text-sm text-red-600 font-medium bg-red-50 px-4 py-2.5 rounded-xl">{err}</p>}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            {edit && <button type="button" onClick={remove} disabled={busy} className="px-4 py-2.5 text-sm font-bold rounded-xl text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">Eliminar</button>}
            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={close} className="px-5 py-2.5 text-sm font-bold rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
              <button type="submit" disabled={busy} className="px-6 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-60 transition-all" style={{background:'linear-gradient(135deg,#0043ff,#0C2749)'}}>
                {busy?'Guardando...':edit?'Guardar cambios':'Agregar plantilla'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
