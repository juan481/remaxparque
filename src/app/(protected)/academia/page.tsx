import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { BookOpen, Clock, Play, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const CATS = ['Todos','Ventas','Alquileres','UIF','Herramientas digitales','Liderazgo'];
const DIFF_COLOR: Record<string,string> = { basico:'#059669', intermedio:'#0043ff', avanzado:'#ff1200' };

export default async function AcademiaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: courses } = await admin.from('courses').select('id,title,description,difficulty,duration_minutes,instructor,thumbnail_url').eq('is_published', true).order('created_at', { ascending: false });
  const { data: progress } = await admin.from('course_progress').select('course_id,progress_percent,completed_at').eq('user_id', user!.id);
  const progressMap = Object.fromEntries((progress ?? []).map(p => [p.course_id, p]));

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 w-fit">
        <span className="px-5 py-2 text-sm font-bold rounded-xl text-white" style={{background:'#0C2749'}}>
          Cursos
        </span>
        <Link href="/academia/biblioteca"
          className="px-5 py-2 text-sm font-bold rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all">
          Biblioteca Digital
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{color:'#0C2749'}}>Academia</h1>
        <p className="text-gray-500 text-sm mt-1">Capacitaciones y cursos para potenciar tu carrera</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Cursos disponibles', value: courses?.length ?? 0, icon: BookOpen, color: '#0043ff' },
          { label: 'En progreso', value: (progress ?? []).filter(p => p.progress_percent > 0 && !p.completed_at).length, icon: Play, color: '#7C3AED' },
          { label: 'Completados', value: (progress ?? []).filter(p => p.completed_at).length, icon: CheckCircle, color: '#059669' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${color}15`}}>
              <Icon className="w-5 h-5" style={{color}} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{color:'#0C2749'}}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {CATS.map(cat => (
          <button key={cat} className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all first:text-white first:border-transparent" style={cat === 'Todos' ? {background:'#0C2749', color:'white', border:'none'} : {background:'white', color:'#374151', borderColor:'#E5E7EB'}}>
            {cat}
          </button>
        ))}
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => {
            const prog = progressMap[course.id];
            const pct = prog?.progress_percent ?? 0;
            const done = !!prog?.completed_at;
            return (
              <Link key={course.id} href={`/academia/cursos/${course.id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden group block">
                {/* Thumbnail */}
                <div className="h-32 flex items-center justify-center relative overflow-hidden" style={{background:'#0C2749'}}>
                  {course.thumbnail_url
                    ? <img src={course.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    : <BookOpen className="w-10 h-10 text-white/50" />
                  }
                  {done && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Completado
                    </div>
                  )}
                  {course.difficulty && (
                    <div className="absolute bottom-3 left-3 text-xs px-2 py-1 rounded-full font-medium text-white"
                      style={{background: DIFF_COLOR[course.difficulty] ?? '#0043ff'}}>
                      {course.difficulty}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm leading-tight mb-1" style={{color:'#0C2749'}}>{course.title}</h3>
                  {course.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{course.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    {course.duration_minutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{course.duration_minutes}min</span>}
                    {course.instructor && <span>{course.instructor}</span>}
                  </div>
                  {pct > 0 && !done && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Progreso</span><span>{pct}%</span></div>
                      <div className="h-1.5 bg-gray-100 rounded-full"><div className="h-full rounded-full" style={{width:`${pct}%`, background:'#0043ff'}} /></div>
                    </div>
                  )}
                  <div className="w-full py-2 text-sm font-medium rounded-xl text-white text-center transition-all hover:opacity-90" style={{background: done ? '#059669' : '#0043ff'}}>
                    {done ? 'Ver de nuevo' : pct > 0 ? 'Continuar' : 'Comenzar'}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-600 mb-2">Pr&#243;ximamente</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">Los cursos y capacitaciones estar&#225;n disponibles muy pronto.</p>
        </div>
      )}
    </div>
  );
}