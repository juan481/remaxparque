'use client';
import { useState } from 'react';
import { Plus, Eye, EyeOff, Calendar } from 'lucide-react';
import { createNews, updateNews, deleteNews } from '@/app/(admin)/admin/_actions/news';
import AdminModal from './AdminModal';

type EventItem = {
  id: string; title: string; content: string | null; urgency: string;
  is_published: boolean; published_at: string | null; created_at: string;
  drive_url: string | null;
};

const urgColor: Record<string,string> = { urgente:'#ff1200', importante:'#D97706', normal:'#0043ff' };
const urgBg: Record<string,string> = { urgente:'#FEF2F2', importante:'#FFFBEB', normal:'#EFF6FF' };
const inp = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const lbl = 'block text-sm font-bold text-gray-700 mb-1.5';

export default function EventosClient({ events }: { events: EventItem[] }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<EventItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const now = new Date();
  const upcoming = events.filter(e => e.published_at && new Date(e.published_at) >= now).length;
  const past = events.filter(e => !e.published_at || new Date(e.published_at) < now).length;

  function openNew() { setEdit(null); setErr(null); setOpen(true); }
  function openEdit(item: EventItem) { setEdit(item); setErr(null); setOpen(true); }
  function close() { setOpen(false); setEdit(null); setErr(null); }

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
    if (!edit || !confirm('Eliminar este evento?')) return;
    setBusy(true);
    try { await deleteNews(edit.id); close(); }
    catch(ex) { setErr(ex instanceof Error ? ex.message : 'Error al eliminar'); }
    finally { setBusy(false); }
  }

  const toDTL = (iso: string | null) => iso ? iso.slice(0,16) : '';

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Eventos</h1>
          <p className="text-gray-500 mt-1">Gestion&#225; capacitaciones, reuniones y actividades del equipo</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all duration-200" style={{background:'linear-gradient(135deg,#0043ff,#0C2749)'}}>
          <Plus className="w-5 h-5" /> Nuevo evento
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[{label:'Total',value:events.length,color:'#0C2749',bg:'#EFF6FF'},{label:'Próximos',value:upcoming,color:'#059669',bg:'#ECFDF5'},{label:'Pasados',value:past,color:'#9CA3AF',bg:'#F9FAFB'}].map(({label,value,color,bg}) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md transition-all">
            <p className="text-4xl font-black" style={{color}}>{value}</p>
            <p className="text-sm font-bold text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-black mb-2" style={{color:'#0C2749'}}>Sin eventos cargados</h2>
          <p className="text-gray-400 max-w-sm mx-auto mb-6">Cre&#225; el primer evento para que el equipo pueda inscribirse.</p>
          <button onClick={openNew} className="px-6 py-3 text-white font-bold rounded-2xl" style={{background:'linear-gradient(135deg,#0043ff,#0C2749)'}}>Crear primer evento</button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(ev => {
            const color = urgColor[ev.urgency] ?? '#0043ff';
            const bg = urgBg[ev.urgency] ?? '#EFF6FF';
            const d = ev.published_at ? new Date(ev.published_at) : null;
            const isUpcoming = d ? d >= now : false;
            return (
              <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-5 hover:shadow-md transition-all duration-200">
                {d ? (
                  <div className="w-16 flex-shrink-0 rounded-2xl overflow-hidden text-center" style={{background:color}}>
                    <div className="py-2">
                      <p className="text-white/80 text-xs font-bold uppercase">{d.toLocaleString('es-AR',{month:'short'})}</p>
                      <p className="text-white font-black text-3xl leading-none">{d.getDate()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 flex-shrink-0 rounded-2xl flex items-center justify-center" style={{background:bg}}>
                    <Calendar className="w-8 h-8" style={{color}} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-black text-base" style={{color:'#0C2749'}}>{ev.title}</h3>
                      {ev.content && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ev.content}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:isUpcoming?'#ECFDF5':'#F9FAFB',color:isUpcoming?'#059669':'#9CA3AF'}}>
                        {isUpcoming?'Próximo':'Pasado'}
                      </span>
                      {ev.is_published ? <Eye className="w-4 h-4 text-green-500"/> : <EyeOff className="w-4 h-4 text-gray-400"/>}
                    </div>
                  </div>
                  {d && <p className="text-xs text-gray-400 mt-2">{d.toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'})}</p>}
                </div>
                <button onClick={()=>openEdit(ev)} className="text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity flex-shrink-0" style={{background:bg,color}}>Editar</button>
              </div>
            );
          })}
        </div>
      )}

      <AdminModal title={edit?'Editar evento':'Nuevo evento'} open={open} onClose={close}>
        <form key={edit?.id??'new'} onSubmit={submit} className="space-y-4">
          <input type="hidden" name="category" value="evento" />
          <div>
            <label className={lbl}>T&#237;tulo <span className="text-red-500">*</span></label>
            <input name="title" required defaultValue={edit?.title??''} className={inp} placeholder="Ej: Reunión mensual de equipo" />
          </div>
          <div>
            <label className={lbl}>Descripción</label>
            <textarea name="content" rows={3} defaultValue={edit?.content??''} className={inp+' resize-none'} placeholder="Detalles del evento..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Fecha y hora del evento</label>
              <input name="published_at" type="datetime-local" required defaultValue={toDTL(edit?.published_at??null)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Prioridad</label>
              <select name="urgency" defaultValue={edit?.urgency??'normal'} className={inp}>
                <option value="normal">Normal</option>
                <option value="importante">Importante</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Link de fotos (Google Drive)</label>
            <input name="drive_url" type="url" defaultValue={edit?.drive_url??''} className={inp} placeholder="https://drive.google.com/..." />
          </div>
          <div className="flex items-center gap-3">
            <input name="is_published" type="checkbox" id="ev_pub" value="on" defaultChecked={edit?.is_published??false} className="w-4 h-4 rounded accent-blue-600" />
            <label htmlFor="ev_pub" className="text-sm font-bold text-gray-700">Publicar (visible para el equipo)</label>
          </div>
          {err && <p className="text-sm text-red-600 font-medium bg-red-50 px-4 py-2.5 rounded-xl">{err}</p>}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            {edit && <button type="button" onClick={remove} disabled={busy} className="px-4 py-2.5 text-sm font-bold rounded-xl text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">Eliminar</button>}
            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={close} className="px-5 py-2.5 text-sm font-bold rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
              <button type="submit" disabled={busy} className="px-6 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-60 transition-all" style={{background:'linear-gradient(135deg,#0043ff,#0C2749)'}}>
                {busy?'Guardando...':edit?'Guardar cambios':'Crear evento'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
