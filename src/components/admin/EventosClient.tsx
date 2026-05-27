'use client';
import { useState, useRef } from 'react';
import { Plus, Eye, EyeOff, Calendar, Users, X, Download, ImageIcon, Loader2 } from 'lucide-react';
import { createNews, updateNews, deleteNews } from '@/app/(admin)/admin/_actions/news';
import AdminModal from './AdminModal';

type EventItem = {
  id: string; title: string; content: string | null; urgency: string;
  is_published: boolean; published_at: string | null; created_at: string;
  drive_url: string | null; image_url: string | null;
  location: string | null; event_online: boolean; parque_visibility: string;
};

type RegCount = { event_id: string; count: number };

const catColor: Record<string,string> = { ventas:'#0043ff', capacitacion:'#7C3AED', otras:'#059669' };
const catBg: Record<string,string>    = { ventas:'#EFF6FF', capacitacion:'#F5F3FF', otras:'#ECFDF5' };
const catLabel: Record<string,string> = { ventas:'Ventas', capacitacion:'Capacitación', otras:'Otras' };
const urgColor = catColor;
const urgBg    = catBg;
const inp = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const lbl = 'block text-sm font-bold text-gray-700 mb-1.5';

export default function EventosClient({ events, regCounts }: { events: EventItem[]; regCounts: RegCount[] }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<EventItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<'proximos'|'pasados'>('proximos');
  const [regsModal, setRegsModal] = useState<{eventId:string;title:string}|null>(null);
  const [regs, setRegs] = useState<{registered_at:string;profiles:{full_name:string|null}}[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const now = new Date();
  const future = events.filter(e => e.published_at && new Date(e.published_at) >= now);
  const past   = events.filter(e => !e.published_at || new Date(e.published_at) < now);

  function countFor(id: string) { return regCounts.find(r => r.event_id === id)?.count ?? 0; }
  function openNew() { setEdit(null); setErr(null); setImageUrl(''); setUploadErr(null); setOpen(true); }
  function openEdit(item: EventItem) { setEdit(item); setErr(null); setImageUrl(item.image_url ?? ''); setUploadErr(null); setOpen(true); }
  function close() { setOpen(false); setEdit(null); setErr(null); setImageUrl(''); setUploadErr(null); }

  async function handleImageFile(file: File) {
    setUploadErr(null);
    if (!['image/jpeg', 'image/jpg'].includes(file.type)) {
      setUploadErr('Solo se permiten archivos .jpg.'); return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setUploadErr('El archivo supera el máximo de 1 MB.'); return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/eventos/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) { setImageUrl(data.url); }
      else { setUploadErr(data.error ?? 'Error al subir la imagen.'); }
    } catch { setUploadErr('Error de conexión al subir la imagen.'); }
    finally { setUploading(false); }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const fd = new FormData(e.currentTarget);
      // Inject the uploaded image URL (replaces the hidden field)
      fd.set('image_url', imageUrl);
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

  async function openRegs(eventId: string, title: string) {
    setRegsModal({ eventId, title });
    setLoadingRegs(true);
    setRegs([]);
    const res = await fetch(`/api/admin/eventos/${eventId}/registrations`);
    const data = await res.json();
    setRegs(data.registrations ?? []);
    setLoadingRegs(false);
  }

  function downloadCSV() {
    if (!regsModal || !regs.length) return;
    const rows = [
      'Nombre,Fecha de inscripción',
      ...regs.map(r => `"${r.profiles?.full_name ?? 'Sin nombre'}","${new Date(r.registered_at).toLocaleString('es-AR')}"`)
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inscriptos-${regsModal.title.replace(/\s+/g,'-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const toDTL = (iso: string | null) => iso ? iso.slice(0,16) : '';
  const displayed = tab === 'proximos' ? future : past;

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Eventos</h1>
          <p className="text-gray-500 mt-1">Gestioná capacitaciones, reuniones y actividades del equipo</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all" style={{background:'linear-gradient(135deg,#0043ff,#0C2749)'}}>
          <Plus className="w-5 h-5" /> Nuevo evento
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{l:'Total',v:events.length,c:'#0C2749',b:'#EFF6FF'},{l:'Próximos',v:future.length,c:'#059669',b:'#ECFDF5'},{l:'Pasados',v:past.length,c:'#9CA3AF',b:'#F9FAFB'}].map(({l,v,c,b})=>(
          <div key={l} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <p className="text-4xl font-black" style={{color:c}}>{v}</p>
            <p className="text-sm font-bold text-gray-500 mt-1">{l}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm w-fit">
        {(['proximos','pasados'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
            style={tab === t ? {background:'#0C2749', color:'#fff'} : {color:'#9CA3AF'}}>
            {t === 'proximos' ? `Próximos (${future.length})` : `Pasados (${past.length})`}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400">No hay eventos en esta sección</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(ev => {
            const color = catColor[ev.urgency] ?? '#0043ff';
            const bg    = catBg[ev.urgency]    ?? '#EFF6FF';
            const d     = ev.published_at ? new Date(ev.published_at) : null;
            const cnt   = countFor(ev.id);
            return (
              <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-5 hover:shadow-md transition-all">
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
                      {ev.content && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{ev.content}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {tab === 'proximos' && (
                        <button onClick={() => openRegs(ev.id, ev.title)}
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                          style={{background:'#ECFDF5', color:'#059669'}}>
                          <Users className="w-3.5 h-3.5" /> {cnt} inscripto{cnt !== 1 ? 's' : ''}
                        </button>
                      )}
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

      {/* Create/Edit modal */}
      <AdminModal title={edit?'Editar evento':'Nuevo evento'} open={open} onClose={close}>
        <form key={edit?.id??'new'} onSubmit={submit} className="space-y-4">
          <input type="hidden" name="category" value="evento" />
          <div>
            <label className={lbl}>Título <span className="text-red-500">*</span></label>
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
              <label className={lbl}>Categoría</label>
              <select name="urgency" defaultValue={edit?.urgency??'ventas'} className={inp}>
                <option value="ventas">Ventas</option>
                <option value="capacitacion">Capacitación</option>
                <option value="otras">Otras</option>
              </select>
            </div>
          </div>
          {/* Image upload */}
          <div>
            <label className={lbl}>Imagen del evento</label>
            <input type="hidden" name="image_url" value={imageUrl} />
            {imageUrl ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                <button type="button"
                  onClick={() => { setImageUrl(''); if (fileRef.current) fileRef.current.value = ''; }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="w-7 h-7 text-gray-300 mb-1.5" />
                    <span className="text-sm font-semibold text-gray-400">Subir imagen</span>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,.jpg"
                  className="hidden"
                  disabled={uploading}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
                />
              </label>
            )}
            <p className="text-xs text-gray-400 mt-1.5">Solo .jpg · Máximo 1 MB</p>
            {uploadErr && <p className="text-xs text-red-500 mt-1 font-medium">{uploadErr}</p>}
          </div>
          <div>
            <label className={lbl}>Visibilidad por parque</label>
            <select name="parque_visibility" defaultValue={edit?.parque_visibility??'both'} className={inp}>
              <option value="both">Ambos parques</option>
              <option value="parque1">Solo RE/MAX Parque 1</option>
              <option value="parque3">Solo RE/MAX Parque 3</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Ubicación</label>
            <input name="location" defaultValue={edit?.location??''} className={inp} placeholder="Ej: Oficina Parque 1, Salón 3er piso..." />
          </div>
          <div className="flex items-center gap-3">
            <input name="event_online" type="checkbox" id="ev_online" value="on" defaultChecked={edit?.event_online??false} className="w-4 h-4 rounded accent-blue-600" />
            <label htmlFor="ev_online" className="text-sm font-bold text-gray-700">Evento Online</label>
          </div>
          <div>
            <label className={lbl}>Link de materiales / fotos (Google Drive) — para eventos pasados</label>
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

      {/* Registrations modal */}
      {regsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-black text-base" style={{color:'#0C2749'}}>Inscriptos</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{regsModal.title}</p>
              </div>
              <div className="flex items-center gap-2">
                {regs.length > 0 && (
                  <button onClick={downloadCSV}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                    style={{background:'#ECFDF5',color:'#059669'}}>
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                )}
                <button onClick={() => setRegsModal(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {loadingRegs ? (
                <div className="text-center py-8 text-gray-400 text-sm">Cargando...</div>
              ) : regs.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-gray-400 text-sm">Nadie se inscribió todavía</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 mb-3">{regs.length} persona{regs.length !== 1 ? 's' : ''}</p>
                  {regs.map((r,i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0" style={{background:'#0043ff'}}>
                        {r.profiles?.full_name?.[0] ?? '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{color:'#0C2749'}}>{r.profiles?.full_name ?? 'Sin nombre'}</p>
                        <p className="text-xs text-gray-400">{new Date(r.registered_at).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'})}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
