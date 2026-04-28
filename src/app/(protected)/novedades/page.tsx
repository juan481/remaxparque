import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Newspaper, Calendar } from 'lucide-react';

type NewsRow = {
  id: string;
  title: string;
  content: string | null;
  urgency: string;
  category: string | null;
  published_at: string | null;
  created_at: string;
  image_url: string | null;
};

const urgColor: Record<string,string>  = { urgente:'#ff1200', importante:'#D97706', normal:'#0043ff' };
const urgBg: Record<string,string>     = { urgente:'#FEF2F2', importante:'#FFFBEB', normal:'#EFF6FF' };
const urgLabel: Record<string,string>  = { urgente:'Urgente', importante:'Importante', normal:'Novedad' };

export default async function NovedadesPage() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: news } = await admin
    .from('news')
    .select('id,title,content,urgency,category,published_at,created_at,image_url')
    .eq('is_published', true)
    .neq('category', 'evento')
    .order('published_at', { ascending: false });

  const items: NewsRow[] = news ?? [];

  function formatDate(d: string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function isNew(n: NewsRow) {
    const ref = n.published_at ?? n.created_at;
    return (Date.now() - new Date(ref).getTime()) < 7 * 24 * 60 * 60 * 1000;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{color:'#0C2749'}}>Novedades</h1>
        <p className="text-gray-500 text-sm mt-1">Noticias, actualizaciones y comunicados del equipo</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <Newspaper className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-bold mb-2" style={{color:'#0C2749'}}>Sin novedades publicadas</h2>
          <p className="text-gray-400 max-w-sm mx-auto">
            Cuando el equipo publique novedades van a aparecer ac&#225;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(n => {
            const color = urgColor[n.urgency] ?? '#0043ff';
            const bg    = urgBg[n.urgency]    ?? '#EFF6FF';
            const label = urgLabel[n.urgency] ?? 'Novedad';
            const date  = formatDate(n.published_at ?? n.created_at);

            return (
              <article key={n.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col group cursor-pointer">

                {/* Imagen o placeholder */}
                <div className="h-44 relative overflow-hidden flex-shrink-0" style={{background:'#f3f4f6'}}>
                  {n.image_url ? (
                    <img
                      src={n.image_url}
                      alt={n.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{background:'#EFF6FF'}}>
                      <Newspaper className="w-10 h-10" style={{color:'#0043ff', opacity:0.2}} />
                    </div>
                  )}

                  {/* Badge tipo */}
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background: color, color:'#fff'}}>
                      {label}
                    </span>
                  </div>

                  {/* Badge nuevo */}
                  {isNew(n) && (
                    <div className="absolute top-3 right-3">
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-white shadow-sm" style={{color:'#ff1200'}}>
                        Nuevo
                      </span>
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-5 flex flex-col flex-1">
                  {/* Categoría + fecha */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {n.category && n.category !== 'general' && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{background: bg, color}}>
                        {n.category}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {date}
                    </span>
                  </div>

                  {/* Título */}
                  <h2 className="font-bold text-base leading-snug mb-2 group-hover:text-[#0043ff] transition-colors" style={{color:'#0C2749'}}>
                    {n.title}
                  </h2>

                  {/* Excerpt */}
                  {n.content && (
                    <p className="text-sm text-gray-500 line-clamp-3 flex-1 leading-relaxed">
                      {n.content}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
