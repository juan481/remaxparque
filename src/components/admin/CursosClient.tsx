'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Eye, EyeOff, BookOpen, Clock, CheckCircle, LayoutList } from 'lucide-react';
import { createCourse, updateCourse, deleteCourse } from '@/app/(admin)/admin/_actions/courses';
import AdminModal from './AdminModal';

type Course = {
  id: string; title: string; description: string | null; difficulty: string | null;
  duration_minutes: number | null; instructor: string | null; is_published: boolean;
  category: string | null; thumbnail_url: string | null;
};

const diffColor: Record<string,string> = { basico:'#059669', intermedio:'#0043ff', avanzado:'#ff1200' };
const diffBg: Record<string,string> = { basico:'#ECFDF5', intermedio:'#EFF6FF', avanzado:'#FEF2F2' };
const inp = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const lbl = 'block text-sm font-bold text-gray-700 mb-1.5';

export default function CursosClient({ courses, completionsByCourse }: { courses: Course[]; completionsByCourse: Record<string,number> }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Course | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const published = courses.filter(c => c.is_published).length;
  const drafts = courses.filter(c => !c.is_published).length;
  const totalCompletions = Object.values(completionsByCourse).reduce((a,b) => a+b, 0);

  function openNew() { setEdit(null); setErr(null); setOpen(true); }
  function openEdit(item: Course) { setEdit(item); setErr(null); setOpen(true); }
  function close() { setOpen(false); setEdit(null); setErr(null); }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const fd = new FormData(e.currentTarget);
      edit ? await updateCourse(edit.id, fd) : await createCourse(fd);
      close();
    } catch(ex) { setErr(ex instanceof Error ? ex.message : 'Error inesperado'); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!edit || !confirm('Eliminar este curso?')) return;
    setBusy(true);
    try { await deleteCourse(edit.id); close(); }
    catch(ex) { setErr(ex instanceof Error ? ex.message : 'Error al eliminar'); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Academia</h1>
          <p className="text-gray-500 mt-1">Gestioná cursos y capacitaciones del equipo</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all duration-200" style={{background:'linear-gradient(135deg,#0043ff,#0C2749)'}}>
          <Plus className="w-5 h-5" /> Nuevo curso
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[{label:'Total',value:courses.length,color:'#0C2749',bg:'#EFF6FF'},{label:'Publicados',value:published,color:'#059669',bg:'#ECFDF5'},{label:'Borradores',value:drafts,color:'#D97706',bg:'#FFFBEB'},{label:'Completados',value:totalCompletions,color:'#7C3AED',bg:'#F5F3FF'}].map(({label,value,color,bg}) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md transition-all">
            <p className="text-4xl font-black" style={{color}}>{value}</p>
            <p className="text-sm font-bold text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-black mb-2" style={{color:'#0C2749'}}>Sin cursos cargados</h2>
          <p className="text-gray-400 max-w-sm mx-auto mb-6">Creá el primer curso para que el equipo pueda capacitarse.</p>
          <button onClick={openNew} className="px-6 py-3 text-white font-bold rounded-2xl" style={{background:'linear-gradient(135deg,#0043ff,#0C2749)'}}>Crear primer curso</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map(course => {
            const diff = course.difficulty ?? 'basico';
            const color = diffColor[diff] ?? '#0043ff';
            const bg = diffBg[diff] ?? '#EFF6FF';
            const done = completionsByCourse[course.id] ?? 0;
            return (
              <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
                <div className="h-28 flex items-center justify-center relative overflow-hidden" style={{background:'#0C2749'}}>
                  {course.thumbnail_url
                    ? <img src={course.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                    : <BookOpen className="w-10 h-10 text-white/30 group-hover:scale-110 transition-transform duration-300" />
                  }
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{background:color}}>{diff}</span>
                  </div>
                  <div className="absolute top-3 right-3">
                    {course.is_published
                      ? <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-green-500 text-white"><Eye className="w-3 h-3"/>Publicado</span>
                      : <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-gray-500/80 text-white"><EyeOff className="w-3 h-3"/>Borrador</span>}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-black text-sm leading-tight mb-1" style={{color:'#0C2749'}}>{course.title}</h3>
                  {course.description && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{course.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3 flex-wrap">
                    {course.duration_minutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{course.duration_minutes}min</span>}
                    {course.instructor && <span>{course.instructor}</span>}
                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500"/>{done} completados</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>openEdit(course)} className="flex-1 py-2 text-xs font-bold rounded-xl border-2 transition-all hover:text-white hover:bg-[#0043ff] hover:border-[#0043ff]" style={{borderColor:'#0043ff',color:'#0043ff'}}>
                      Editar
                    </button>
                    <Link href={`/admin/cursos/${course.id}`}
                      className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl text-white transition-all hover:opacity-80"
                      style={{background:'#0C2749'}}>
                      <LayoutList className="w-3.5 h-3.5" /> Contenido
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AdminModal title={edit?'Editar curso':'Nuevo curso'} open={open} onClose={close} size="lg">
        <form key={edit?.id??'new'} onSubmit={submit} className="space-y-4">
          <div>
            <label className={lbl}>Título <span className="text-red-500">*</span></label>
            <input name="title" required defaultValue={edit?.title??''} className={inp} placeholder="Ej: Introducción al proceso de ventas" />
          </div>
          <div>
            <label className={lbl}>Descripción</label>
            <textarea name="description" rows={3} defaultValue={edit?.description??''} className={inp+' resize-none'} placeholder="Descripción del curso..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Dificultad</label>
              <select name="difficulty" defaultValue={edit?.difficulty??'basico'} className={inp}>
                <option value="basico">Básico</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Duración (minutos)</label>
              <input name="duration_minutes" type="number" min="1" defaultValue={edit?.duration_minutes??''} className={inp} placeholder="60" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Instructor</label>
              <input name="instructor" defaultValue={edit?.instructor??''} className={inp} placeholder="Nombre del instructor" />
            </div>
            <div>
              <label className={lbl}>Categoría</label>
              <input name="category" defaultValue={edit?.category??''} className={inp} placeholder="ventas, marketing, legal..." />
            </div>
          </div>
          <div>
            <label className={lbl}>Imagen de portada (URL)</label>
            <input name="thumbnail_url" type="url" defaultValue={edit?.thumbnail_url??''} className={inp} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-3">
            <input name="is_published" type="checkbox" id="cur_pub" value="on" defaultChecked={edit?.is_published??false} className="w-4 h-4 rounded accent-blue-600" />
            <label htmlFor="cur_pub" className="text-sm font-bold text-gray-700">Publicar (visible para el equipo)</label>
          </div>
          {err && <p className="text-sm text-red-600 font-medium bg-red-50 px-4 py-2.5 rounded-xl">{err}</p>}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            {edit && <button type="button" onClick={remove} disabled={busy} className="px-4 py-2.5 text-sm font-bold rounded-xl text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">Eliminar</button>}
            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={close} className="px-5 py-2.5 text-sm font-bold rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
              <button type="submit" disabled={busy} className="px-6 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-60 transition-all" style={{background:'linear-gradient(135deg,#0043ff,#0C2749)'}}>
                {busy?'Guardando...':edit?'Guardar cambios':'Crear curso'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
