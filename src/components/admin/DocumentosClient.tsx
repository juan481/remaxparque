'use client';
import { useState } from 'react';
import { Plus, FileText, Upload } from 'lucide-react';
import { createDocument, updateDocument, deleteDocument } from '@/app/(admin)/admin/_actions/documents';
import AdminModal from './AdminModal';

type Doc = {
  id: string; title: string; type: string | null; category: string | null;
  status: string; version: string | null; effective_date: string | null;
  parque_visibility: string[]; file_url: string | null; file_size_kb: number | null;
  changelog_summary: string | null; legal_excerpt: string | null;
};

const statusColor: Record<string,string> = { vigente:'#059669', borrador:'#D97706', obsoleto:'#9CA3AF' };
const statusBg: Record<string,string> = { vigente:'#ECFDF5', borrador:'#FFFBEB', obsoleto:'#F9FAFB' };
const typeLabel: Record<string,string> = { contrato:'Contrato', formulario:'Formulario', proceso:'Proceso', otro:'Otro' };
const catLabel: Record<string,string> = { ventas:'Ventas', alquileres:'Alquileres', uif:'UIF', admin:'Admin', otro:'Otro' };
const inp = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const lbl = 'block text-sm font-bold text-gray-700 mb-1.5';

export default function DocumentosClient({ docs }: { docs: Doc[] }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Doc | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const vigente = docs.filter(d => d.status === 'vigente').length;
  const borrador = docs.filter(d => d.status === 'borrador').length;

  function openNew() { setEdit(null); setErr(null); setOpen(true); }
  function openEdit(item: Doc) { setEdit(item); setErr(null); setOpen(true); }
  function close() { setOpen(false); setEdit(null); setErr(null); }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const fd = new FormData(e.currentTarget);
      edit ? await updateDocument(edit.id, fd) : await createDocument(fd);
      close();
    } catch(ex) { setErr(ex instanceof Error ? ex.message : 'Error inesperado'); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!edit || !confirm('Eliminar este documento?')) return;
    setBusy(true);
    try { await deleteDocument(edit.id); close(); }
    catch(ex) { setErr(ex instanceof Error ? ex.message : 'Error al eliminar'); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Documentos Legales</h1>
          <p className="text-gray-500 mt-1">Gestioná contratos, formularios y procedimientos del equipo</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all duration-200" style={{background:'linear-gradient(135deg,#0043ff,#0C2749)'}}>
          <Upload className="w-5 h-5" /> Subir documento
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[{label:'Total',value:docs.length,color:'#0C2749',bg:'#EFF6FF'},{label:'Vigentes',value:vigente,color:'#059669',bg:'#ECFDF5'},{label:'Borradores',value:borrador,color:'#D97706',bg:'#FFFBEB'}].map(({label,value,color,bg}) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md transition-all">
            <p className="text-4xl font-black" style={{color}}>{value}</p>
            <p className="text-sm font-bold text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {docs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-black mb-2" style={{color:'#0C2749'}}>Sin documentos todavía</h2>
          <p className="text-gray-400 max-w-sm mx-auto mb-6">Subí el primer contrato o formulario para el equipo.</p>
          <button onClick={openNew} className="px-6 py-3 text-white font-bold rounded-2xl" style={{background:'linear-gradient(135deg,#0043ff,#0C2749)'}}>Subir primer documento</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
            <div className="col-span-5">Documento</div>
            <div className="col-span-2">Tipo</div>
            <div className="col-span-2">Categoría</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-1"></div>
          </div>
          {docs.map((doc, i) => (
            <div key={doc.id} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-blue-50/30 transition-colors ${i!==0?'border-t border-gray-50':''}`}>
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'#EFF6FF'}}>
                  <FileText className="w-5 h-5" style={{color:'#0043ff'}} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate" style={{color:'#0C2749'}}>{doc.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {doc.version && <span className="text-xs text-gray-400">v{doc.version}</span>}
                    {doc.parque_visibility?.map(p => (
                      <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                        {p==='parque1'?'P1':p==='parque3'?'P3':'Ambos'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-span-2"><span className="text-sm text-gray-600 font-medium">{typeLabel[doc.type??'']??doc.type??'—'}</span></div>
              <div className="col-span-2"><span className="text-sm text-gray-600 font-medium">{catLabel[doc.category??'']??doc.category??'—'}</span></div>
              <div className="col-span-2">
                <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{color:statusColor[doc.status]??'#9CA3AF',background:statusBg[doc.status]??'#F9FAFB'}}>
                  {doc.status==='vigente'?'Vigente':doc.status==='borrador'?'Borrador':'Obsoleto'}
                </span>
              </div>
              <div className="col-span-1 flex justify-end">
                <button onClick={()=>openEdit(doc)} className="text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity" style={{background:'#EFF6FF',color:'#0043ff'}}>Editar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal title={edit?'Editar documento':'Subir documento'} open={open} onClose={close} size="lg">
        <form key={edit?.id??'new'} onSubmit={submit} className="space-y-4">
          <div>
            <label className={lbl}>Título <span className="text-red-500">*</span></label>
            <input name="title" required defaultValue={edit?.title??''} className={inp} placeholder="Ej: Contrato de Compraventa v3" />
          </div>

          <div>
            <label className={lbl}>Archivo PDF {!edit && <span className="text-red-500">*</span>}</label>
            <input name="file" type="file" accept=".pdf,.doc,.docx" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
            {edit?.file_url && <p className="text-xs text-gray-400 mt-1">Archivo actual: <a href={edit.file_url} target="_blank" className="text-blue-600 underline">ver archivo</a> ({edit.file_size_kb} KB)</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Tipo</label>
              <select name="type" defaultValue={edit?.type??''} className={inp}>
                <option value="">— Seleccionar —</option>
                <option value="contrato">Contrato</option>
                <option value="formulario">Formulario</option>
                <option value="proceso">Proceso</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Categoría</label>
              <select name="category" defaultValue={edit?.category??''} className={inp}>
                <option value="">— Seleccionar —</option>
                <option value="ventas">Ventas</option>
                <option value="alquileres">Alquileres</option>
                <option value="uif">UIF</option>
                <option value="admin">Admin</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Estado</label>
              <select name="status" defaultValue={edit?.status??'borrador'} className={inp}>
                <option value="borrador">Borrador</option>
                <option value="vigente">Vigente</option>
                <option value="obsoleto">Obsoleto</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Versión</label>
              <input name="version" defaultValue={edit?.version??''} className={inp} placeholder="Ej: 3.1" />
            </div>
          </div>

          <div>
            <label className={lbl}>Fecha efectiva</label>
            <input name="effective_date" type="date" defaultValue={edit?.effective_date?.slice(0,10)??''} className={inp} />
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

          <div>
            <label className={lbl}>Resumen de cambios</label>
            <textarea name="changelog_summary" rows={2} defaultValue={edit?.changelog_summary??''} className={inp+' resize-none'} placeholder="Ej: Se actualizó la cláusula de arbitraje..." />
          </div>

          {err && <p className="text-sm text-red-600 font-medium bg-red-50 px-4 py-2.5 rounded-xl">{err}</p>}

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            {edit && <button type="button" onClick={remove} disabled={busy} className="px-4 py-2.5 text-sm font-bold rounded-xl text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">Eliminar</button>}
            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={close} className="px-5 py-2.5 text-sm font-bold rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
              <button type="submit" disabled={busy} className="px-6 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-60 transition-all" style={{background:'linear-gradient(135deg,#0043ff,#0C2749)'}}>
                {busy?'Guardando...':edit?'Guardar cambios':'Subir documento'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
