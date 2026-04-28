'use client';
import { useState } from 'react';
import { Plus, Eye, EyeOff, Calendar, Newspaper } from 'lucide-react';
import { createNews, updateNews, deleteNews } from '@/app/(admin)/admin/_actions/news';
import AdminModal from './AdminModal';

type NewsItem = {
  id: string; title: string; content: string | null; urgency: string;
  category: string | null; is_published: boolean; published_at: string | null;
  created_at: string; image_url: string | null;
};

const CATS = [
  { value: 'general', label: 'General' },
  { value: 'ventas', label: 'Ventas' },
  { value: 'alquileres', label: 'Alquileres' },
  { value: 'legal', label: 'Legal / UIF' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'administracion', label: 'Administraci&oacute;n' },
  { value: 'capacitacion', label: 'Capacitaci&oacute;n' },
];

const urgColor: Record<string,string> = { urgente:'#ff1200', importante:'#D97706', normal:'#0043ff' };
const urgBg: Record<string,string>   = { urgente:'#FEF2F2', importante:'#FFFBEB', normal:'#EFF6FF' };
const urgLabel: Record<string,string> = { urgente:'Urgente', importante:'Importante', normal:'Novedad' };

const inp = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const lbl = 'block text-sm font-bold text-gray-700 mb-1.5';

export default function NovedadesClient({ news }: { news: NewsItem[] }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<NewsItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState<string | null>(null);

  const published = news.filter(n => n.is_published).length;
  const drafts    = news.filter(n => !n.is_published).length;

  function openNew()  { setEdit(null); setErr(null); setOpen(true); }
  function openEdit(item: NewsItem) { setEdit(item); setErr(null); setOpen(true); }
  function close()    { setOpen(false); setEdit(null); setErr(null); }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const fd = new FormData(e.currentTarget);
      edit ? await updateNews(edit.id, fd) : await createNews(fd);
      close();
    } catch(ex) { setErr(ex instanceof Error ? ex.message : 'Error inesperado'); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!edit || !confirm('Eliminar esta novedad?')) return;
    setBusy(true);
    try { await deleteNews(edit.id); close(); }
    catch(ex) { setErr(ex instanceof Error ? ex.message : 'Error al eliminar'); }
    finally { setBusy(false); }
  }

  const fmt    = (iso: string) => new Date(iso).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'});
  const toDTL  = (iso: string | null) => iso ? iso.slice(0,16) : '';
  const catLabel = (val: string | null) => CATS.find(c => c.value === val)?.label.replace(/&[a-z]+;/g,'ó') ?? val ?? '—';

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Novedades</h1>
          <p className="text-gray-500 mt-1">Notas del blog, comunicados y actualizaciones del equipo</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-2xl shadow-sm hover:opacity-90 active:scale-95 transition-all"
          style={{background:'#0043ff'}}>
          <Plus className="w-5 h-5" /> Nueva nota
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {label:'Total',    value:news.length, color:'#0C2749'},
          {label:'Publicadas',value:published,  color:'#059669'},
          {label:'Borradores',value:drafts,     color:'#D97706'},
        ].map(({label,value,color}) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <p className="text-4xl font-black" style={{color}}>{value}</p>
            <p className="text-sm font-bold text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {news.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <Newspaper className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-black mb-2" style={{color:'#0C2749'}}>Sin novedades todav&#237;a</h2>
          <p className="text-gray-400 max-w-sm mx-auto mb-6">Cre&#225; la primera nota para el equipo.</p>
          <button onClick={openNew} className="px-6 py-3 text-white font-bold rounded-2xl" style={{background:'#0043ff'}}>
            Crear primera nota
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
            <div className="col-span-5">T&#237;tulo</div>
            <div className="col-span-2">Tipo</div>
            <div className="col-span-2">Categor&#237;a</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-1" />
          </div>
          {news.map((item, i) => {
            const color = urgColor[item.urgency] ?? '#0043ff';
            const bg    = urgBg[item.urgency]    ?? '#EFF6FF';
            return (
              <div key={item.id}
                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors ${i !== 0 ? 'border-t border-gray-50' : ''}`}>
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  {item.image_url
                    ? <img src={item.image_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                    : <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:bg}}>
                        <Newspaper className="w-5 h-5" style={{color}} />
                      </div>
                  }
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate" style={{color:'#0C2749'}}>{item.title}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {item.published_at ? fmt(item.published_at) : fmt(item.created_at)}
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:bg,color}}>
                    {urgLabel[item.urgency] ?? item.urgency}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-gray-600 font-medium capitalize">{catLabel(item.category)}</span>
                </div>
                <div className="col-span-2">
                  {item.is_published
                    ? <span className="flex items-center gap-1 text-xs font-bold text-green-600"><Eye className="w-4 h-4 text-green-500" />Publicada</span>
                    : <span className="flex items-center gap-1 text-xs font-bold text-gray-400"><EyeOff className="w-4 h-4 text-gray-400" />Borrador</span>
                  }
                </div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => openEdit(item)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                    style={{background:bg,color}}>
                    Editar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AdminModal title={edit ? 'Editar nota' : 'Nueva nota'} open={open} onClose={close} size="lg">
        <form key={edit?.id ?? 'new'} onSubmit={submit} className="space-y-4">
          <div>
            <label className={lbl}>T&#237;tulo <span className="text-red-500">*</span></label>
            <input name="title" required defaultValue={edit?.title ?? ''} className={inp}
              placeholder="Ej: Actualizaci&#243;n de formularios UIF" />
          </div>
          <div>
            <label className={lbl}>Contenido</label>
            <textarea name="content" rows={5} defaultValue={edit?.content ?? ''} className={inp + ' resize-y'}
              placeholder="Escrib&#237; el contenido completo de la nota aqu&#237;..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Tipo</label>
              <select name="urgency" defaultValue={edit?.urgency ?? 'normal'} className={inp}>
                <option value="normal">Novedad</option>
                <option value="importante">Importante</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Categor&#237;a</label>
              <select name="category" defaultValue={edit?.category ?? 'general'} className={inp}>
                {CATS.map(c => (
                  <option key={c.value} value={c.value} dangerouslySetInnerHTML={{__html: c.label}} />
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Imagen de portada (URL)</label>
            <input name="image_url" type="url" defaultValue={edit?.image_url ?? ''} className={inp}
              placeholder="https://... (opcional, para mostrar en la card)" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Fecha de publicaci&#243;n</label>
              <input name="published_at" type="datetime-local" defaultValue={toDTL(edit?.published_at ?? null)} className={inp} />
            </div>
            <div className="flex items-center gap-3 pt-7">
              <input name="is_published" type="checkbox" id="np_pub" value="on"
                defaultChecked={edit?.is_published ?? false} className="w-4 h-4 rounded accent-blue-600" />
              <label htmlFor="np_pub" className="text-sm font-bold text-gray-700">Publicar ahora</label>
            </div>
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
                style={{background:'#0043ff'}}>
                {busy ? 'Guardando...' : edit ? 'Guardar cambios' : 'Publicar nota'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
