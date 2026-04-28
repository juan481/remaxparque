'use client';
import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Edit, Video, FileText, AlignLeft, BookOpen, ArrowLeft, GripVertical } from 'lucide-react';
import Link from 'next/link';
import {
  createModule, updateModule, deleteModule, reorderModules,
  createLesson, updateLesson, deleteLesson, reorderLessons,
  getSignedUploadUrl,
} from '@/app/(admin)/admin/_actions/course_content';
import { createClient } from '@/lib/supabase/client';
import AdminModal from './AdminModal';

type Lesson = {
  id: string; module_id: string; title: string;
  type: 'video' | 'pdf' | 'text'; content: string | null;
  video_url: string | null; file_url: string | null; file_name: string | null;
  file_size_kb: number | null; duration_minutes: number | null;
  sort_order: number; is_published: boolean; is_free_preview: boolean;
};

type Module = {
  id: string; course_id: string; title: string; description: string | null;
  sort_order: number; is_published: boolean; lessons: Lesson[];
};

type Course = { id: string; title: string; };

const inp = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const lbl = 'block text-sm font-bold text-gray-700 mb-1.5';

const LESSON_TYPE_META = {
  video: { icon: Video, label: 'Video', color: '#7C3AED', bg: '#F5F3FF' },
  pdf:   { icon: FileText, label: 'PDF', color: '#ff1200', bg: '#FEF2F2' },
  text:  { icon: AlignLeft, label: 'Texto', color: '#0043ff', bg: '#EFF6FF' },
};

export default function CourseContentClient({ course, initialModules }: { course: Course; initialModules: Module[] }) {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(initialModules.map(m => m.id)));

  const [modOpen, setModOpen] = useState(false);
  const [modEdit, setModEdit] = useState<Module | null>(null);
  const [modBusy, setModBusy] = useState(false);
  const [modErr, setModErr] = useState<string | null>(null);

  const [lesOpen, setLesOpen] = useState(false);
  const [lesEdit, setLesEdit] = useState<Lesson | null>(null);
  const [lesModuleId, setLesModuleId] = useState<string>('');
  const [lesBusy, setLesBusy] = useState(false);
  const [lesErr, setLesErr] = useState<string | null>(null);
  const [lesType, setLesType] = useState<'video' | 'pdf' | 'text'>('video');

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function openNewModule() { setModEdit(null); setModErr(null); setModOpen(true); }
  function openEditModule(m: Module) { setModEdit(m); setModErr(null); setModOpen(true); }
  function closeModule() { setModOpen(false); setModEdit(null); setModErr(null); }

  async function submitModule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setModBusy(true); setModErr(null);
    try {
      const fd = new FormData(e.currentTarget);
      if (modEdit) {
        await updateModule(modEdit.id, course.id, fd);
        setModules(prev => prev.map(m => m.id === modEdit.id
          ? { ...m, title: fd.get('title') as string, description: (fd.get('description') as string) || null, is_published: fd.get('is_published') === 'on' }
          : m));
        closeModule();
      } else {
        await createModule(course.id, fd);
        window.location.reload();
      }
    } catch (ex) { setModErr(ex instanceof Error ? ex.message : 'Error'); }
    finally { setModBusy(false); }
  }

  async function removeModule(m: Module) {
    if (!confirm(`Eliminar el módulo "${m.title}" y todas sus lecciones?`)) return;
    await deleteModule(m.id, course.id);
    setModules(prev => prev.filter(x => x.id !== m.id));
    closeModule();
  }

  async function moveModule(idx: number, dir: 'up' | 'down') {
    const newMods = [...modules];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newMods.length) return;
    [newMods[idx], newMods[swapIdx]] = [newMods[swapIdx], newMods[idx]];
    const reordered = newMods.map((m, i) => ({ ...m, sort_order: i }));
    setModules(reordered);
    await reorderModules(course.id, reordered.map(m => ({ id: m.id, sort_order: m.sort_order })));
  }

  function openNewLesson(moduleId: string) {
    setLesEdit(null); setLesModuleId(moduleId); setLesErr(null);
    setLesType('video'); setLesOpen(true);
  }
  function openEditLesson(les: Lesson) {
    setLesEdit(les); setLesModuleId(les.module_id); setLesErr(null);
    setLesType(les.type as 'video' | 'pdf' | 'text'); setLesOpen(true);
  }
  function closeLesson() { setLesOpen(false); setLesEdit(null); setLesErr(null); }

  async function submitLesson(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLesBusy(true); setLesErr(null);
    try {
      const fd = new FormData(e.currentTarget);

      if (lesType === 'pdf') {
        const fileInput = e.currentTarget.querySelector<HTMLInputElement>('input[name="file"]');
        const file = fileInput?.files?.[0];
        if (file && file.size > 0) {
          const { signedUrl, path } = await getSignedUploadUrl(file.name);
          const res = await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          });
          if (!res.ok) throw new Error('Error al subir el PDF al servidor');
          const { data: { publicUrl } } = createClient().storage.from('documents').getPublicUrl(path);
          fd.set('file_url_direct', publicUrl);
          fd.set('file_name_direct', file.name);
          fd.set('file_size_kb_direct', String(Math.round(file.size / 1024)));
          fd.delete('file');
        }
      }

      lesEdit ? await updateLesson(lesEdit.id, course.id, fd) : await createLesson(lesModuleId, course.id, fd);
      window.location.reload();
    } catch (ex) { setLesErr(ex instanceof Error ? ex.message : 'Error'); setLesBusy(false); }
  }

  async function removeLesson(les: Lesson) {
    if (!confirm(`Eliminar la lección "${les.title}"?`)) return;
    await deleteLesson(les.id, course.id);
    setModules(prev => prev.map(m => ({ ...m, lessons: m.lessons.filter(l => l.id !== les.id) })));
    closeLesson();
  }

  async function moveLesson(moduleId: string, idx: number, dir: 'up' | 'down') {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;
    const lessons = [...mod.lessons];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= lessons.length) return;
    [lessons[idx], lessons[swapIdx]] = [lessons[swapIdx], lessons[idx]];
    const reordered = lessons.map((l, i) => ({ ...l, sort_order: i }));
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, lessons: reordered } : m));
    await reorderLessons(moduleId, course.id, reordered.map(l => ({ id: l.id, sort_order: l.sort_order })));
  }

  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Link href="/admin/cursos"
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contenido del curso</p>
          <h1 className="text-2xl font-black truncate" style={{ color: '#0C2749' }}>{course.title}</h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="font-bold">{modules.length} m&oacute;dulos</span>
          <span>&middot;</span>
          <span className="font-bold">{totalLessons} lecciones</span>
        </div>
        <button onClick={openNewModule}
          className="flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-2xl shadow-md hover:opacity-90 active:scale-95 transition-all"
          style={{ background: '#0043ff' }}>
          <Plus className="w-4 h-4" /> Agregar m&oacute;dulo
        </button>
      </div>

      {modules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <BookOpen className="w-14 h-14 mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-black mb-2" style={{ color: '#0C2749' }}>Sin m&oacute;dulos todav&iacute;a</h2>
          <p className="text-gray-400 mb-6">Cre&aacute; el primer m&oacute;dulo para empezar a agregar lecciones.</p>
          <button onClick={openNewModule} className="px-6 py-3 text-white font-bold rounded-2xl"
            style={{ background: '#0043ff' }}>
            Crear primer m&oacute;dulo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((mod, modIdx) => {
            const isExpanded = expanded.has(mod.id);
            return (
              <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggleExpand(mod.id)}>
                  <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-gray-400 uppercase">M&oacute;d. {modIdx + 1}</span>
                      <h3 className="font-black text-base" style={{ color: '#0C2749' }}>{mod.title}</h3>
                      {!mod.is_published && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Oculto</span>
                      )}
                    </div>
                    {mod.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{mod.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mr-2">
                    <span className="font-bold">{mod.lessons.length}</span> lecc.
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => moveModule(modIdx, 'up')} disabled={modIdx === 0}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                      <ArrowUp className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button onClick={() => moveModule(modIdx, 'down')} disabled={modIdx === modules.length - 1}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                      <ArrowDown className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button onClick={() => openEditModule(mod)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                      <Edit className="w-3.5 h-3.5" style={{ color: '#0043ff' }} />
                    </button>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-50">
                    {mod.lessons.length === 0 ? (
                      <div className="px-5 py-6 text-center">
                        <p className="text-sm text-gray-400 mb-3">Sin lecciones en este m&oacute;dulo</p>
                        <button onClick={() => openNewLesson(mod.id)}
                          className="text-sm font-bold px-4 py-2 rounded-xl hover:opacity-80 transition-opacity"
                          style={{ background: '#EFF6FF', color: '#0043ff' }}>
                          <Plus className="w-3.5 h-3.5 inline mr-1" />Agregar lecci&oacute;n
                        </button>
                      </div>
                    ) : (
                      <div>
                        {mod.lessons.map((les, lesIdx) => {
                          const meta = LESSON_TYPE_META[les.type];
                          const Icon = meta.icon;
                          return (
                            <div key={les.id}
                              className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                                <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: '#0C2749' }}>{les.title}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                  <span style={{ color: meta.color }} className="font-bold">{meta.label}</span>
                                  {les.duration_minutes && <span>{les.duration_minutes} min</span>}
                                  {les.is_free_preview && <span className="text-green-600 font-bold">Vista previa</span>}
                                  {!les.is_published && <span className="text-gray-400">Oculta</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => moveLesson(mod.id, lesIdx, 'up')} disabled={lesIdx === 0}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                                  <ArrowUp className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                                <button onClick={() => moveLesson(mod.id, lesIdx, 'down')} disabled={lesIdx === mod.lessons.length - 1}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                                  <ArrowDown className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                                <button onClick={() => openEditLesson(les)} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                                  <Edit className="w-3.5 h-3.5" style={{ color: '#0043ff' }} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        <div className="px-5 py-3 border-t border-gray-50">
                          <button onClick={() => openNewLesson(mod.id)}
                            className="flex items-center gap-1.5 text-sm font-bold hover:opacity-80 transition-opacity"
                            style={{ color: '#0043ff' }}>
                            <Plus className="w-4 h-4" /> Agregar lecci&oacute;n
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Module modal */}
      <AdminModal title={modEdit ? 'Editar módulo' : 'Nuevo módulo'} open={modOpen} onClose={closeModule}>
        <form key={modEdit?.id ?? 'new-mod'} onSubmit={submitModule} className="space-y-4">
          <div>
            <label className={lbl}>T&iacute;tulo del m&oacute;dulo <span className="text-red-500">*</span></label>
            <input name="title" required defaultValue={modEdit?.title ?? ''} className={inp}
              placeholder="Ej: Introducci&oacute;n al proceso de ventas" />
          </div>
          <div>
            <label className={lbl}>Descripci&oacute;n</label>
            <textarea name="description" rows={2} defaultValue={modEdit?.description ?? ''} className={inp + ' resize-none'}
              placeholder="Descripci&oacute;n breve del m&oacute;dulo..." />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input name="is_published" type="checkbox" value="on" defaultChecked={modEdit?.is_published ?? true}
                className="w-4 h-4 rounded accent-blue-600" />
              M&oacute;dulo visible para el equipo
            </label>
          </div>
          {modErr && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{modErr}</p>}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            {modEdit && (
              <button type="button" onClick={() => removeModule(modEdit)}
                className="px-4 py-2.5 text-sm font-bold rounded-xl text-red-600 hover:bg-red-50 transition-colors">
                Eliminar
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={closeModule}
                className="px-5 py-2.5 text-sm font-bold rounded-xl text-gray-500 hover:bg-gray-100">
                Cancelar
              </button>
              <button type="submit" disabled={modBusy}
                className="px-6 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-60"
                style={{ background: '#0043ff' }}>
                {modBusy ? 'Guardando...' : modEdit ? 'Guardar' : 'Crear módulo'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* Lesson modal */}
      <AdminModal title={lesEdit ? 'Editar lección' : 'Nueva lección'} open={lesOpen} onClose={closeLesson} size="lg">
        <form key={lesEdit?.id ?? 'new-les'} onSubmit={submitLesson} className="space-y-4">
          <div>
            <label className={lbl}>Tipo de lecci&oacute;n</label>
            <div className="grid grid-cols-3 gap-3">
              {(['video', 'pdf', 'text'] as const).map(t => {
                const meta = LESSON_TYPE_META[t];
                const Icon = meta.icon;
                return (
                  <button key={t} type="button" onClick={() => setLesType(t)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${lesType === t ? '' : 'border-gray-200 hover:border-gray-300'}`}
                    style={lesType === t ? { borderColor: meta.color, background: meta.bg } : {}}>
                    <Icon className="w-5 h-5" style={{ color: meta.color }} />
                    <span className="text-xs font-bold" style={{ color: meta.color }}>{meta.label}</span>
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="type" value={lesType} />
          </div>

          <div>
            <label className={lbl}>T&iacute;tulo <span className="text-red-500">*</span></label>
            <input name="title" required defaultValue={lesEdit?.title ?? ''} className={inp}
              placeholder="Ej: Bienvenida al curso" />
          </div>

          {lesType === 'video' && (
            <div>
              <label className={lbl}>URL del video</label>
              <input name="video_url" defaultValue={lesEdit?.video_url ?? ''} className={inp}
                placeholder="https://www.youtube.com/watch?v=... o URL directa de video" />
              <p className="text-xs text-gray-400 mt-1">Compatible: YouTube, Vimeo, o URL directa (.mp4)</p>
            </div>
          )}

          {lesType === 'pdf' && (
            <div>
              <label className={lbl}>Archivo PDF {!lesEdit && <span className="text-red-500">*</span>}</label>
              <input name="file" type="file" accept=".pdf"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer" />
              {lesEdit?.file_url && (
                <p className="text-xs text-gray-400 mt-1">
                  Actual: <a href={lesEdit.file_url} target="_blank" className="text-blue-600 underline">{lesEdit.file_name ?? 'ver PDF'}</a>
                </p>
              )}
            </div>
          )}

          <div>
            <label className={lbl}>{lesType === 'text' ? 'Contenido' : 'Descripción (opcional)'}</label>
            <textarea name="content" rows={lesType === 'text' ? 6 : 3} defaultValue={lesEdit?.content ?? ''} className={inp + ' resize-y'}
              placeholder={lesType === 'text' ? 'Escribí el contenido de la lección aquí...' : 'Descripción o notas...'} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Duraci&oacute;n (minutos)</label>
              <input name="duration_minutes" type="number" min="1" defaultValue={lesEdit?.duration_minutes ?? ''} className={inp} placeholder="10" />
            </div>
            <div className="flex flex-col gap-3 pt-6">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input name="is_published" type="checkbox" value="on" defaultChecked={lesEdit?.is_published ?? true}
                  className="w-4 h-4 rounded accent-blue-600" />
                Publicada
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input name="is_free_preview" type="checkbox" value="on" defaultChecked={lesEdit?.is_free_preview ?? false}
                  className="w-4 h-4 rounded accent-green-600" />
                Vista previa libre
              </label>
            </div>
          </div>

          {lesErr && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{lesErr}</p>}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            {lesEdit && (
              <button type="button" onClick={() => removeLesson(lesEdit)}
                className="px-4 py-2.5 text-sm font-bold rounded-xl text-red-600 hover:bg-red-50 transition-colors">
                Eliminar
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={closeLesson}
                className="px-5 py-2.5 text-sm font-bold rounded-xl text-gray-500 hover:bg-gray-100">
                Cancelar
              </button>
              <button type="submit" disabled={lesBusy}
                className="px-6 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-60"
                style={{ background: '#0043ff' }}>
                {lesBusy ? 'Guardando...' : lesEdit ? 'Guardar' : 'Crear lección'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
