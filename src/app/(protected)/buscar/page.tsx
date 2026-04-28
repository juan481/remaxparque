import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { Search, FileText, BookOpen, Newspaper, Library, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type SearchResult = {
  id: string;
  title: string;
  description: string | null;
  type: 'documento' | 'curso' | 'novedad' | 'biblioteca';
  href: string;
  badge: string;
  badgeColor: string;
};

export default async function BuscarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: profile } = await admin.from('profiles').select('parque').eq('id', user!.id).single();
  const parque = profile?.parque as string | null;

  let results: SearchResult[] = [];

  if (query.length >= 2) {
    const like = `%${query}%`;

    const [docsRes, coursesRes, newsRes, libRes] = await Promise.all([
      admin.from('documents').select('id,title,description,type').eq('status', 'vigente').or(`title.ilike.${like},description.ilike.${like}`).limit(10),
      admin.from('courses').select('id,title,description').eq('is_published', true).or(`title.ilike.${like},description.ilike.${like}`).limit(10),
      admin.from('news').select('id,title,content').eq('is_published', true).neq('category', 'evento').or(`title.ilike.${like},content.ilike.${like}`).limit(10),
      (() => {
        let q2 = admin.from('library_resources').select('id,title,description,category,parque_visibility').eq('is_active', true).or(`title.ilike.${like},description.ilike.${like}`);
        if (parque && parque !== 'both') {
          q2 = q2.contains('parque_visibility', [parque]);
        }
        return q2.limit(10);
      })(),
    ]);

    const docs: SearchResult[] = (docsRes.data ?? []).map((d: { id: string; title: string; description: string | null; type: string | null }) => ({
      id: d.id, title: d.title, description: d.description,
      type: 'documento', href: `/legales/${d.id}`,
      badge: d.type ?? 'Documento', badgeColor: '#0C2749',
    }));

    const courses: SearchResult[] = (coursesRes.data ?? []).map((c: { id: string; title: string; description: string | null }) => ({
      id: c.id, title: c.title, description: c.description,
      type: 'curso', href: `/academia/cursos/${c.id}`,
      badge: 'Curso', badgeColor: '#0043ff',
    }));

    const news: SearchResult[] = (newsRes.data ?? []).map((n: { id: string; title: string; content: string | null }) => ({
      id: n.id, title: n.title, description: n.content,
      type: 'novedad', href: `/novedades`,
      badge: 'Novedad', badgeColor: '#D97706',
    }));

    const lib: SearchResult[] = (libRes.data ?? []).map((r: { id: string; title: string; description: string | null; category: string }) => ({
      id: r.id, title: r.title, description: r.description,
      type: 'biblioteca', href: `/academia/biblioteca`,
      badge: r.category ?? 'Biblioteca', badgeColor: '#059669',
    }));

    results = [...docs, ...lib, ...courses, ...news];
  }

  const iconMap: Record<string, typeof Search> = {
    documento: FileText,
    curso: BookOpen,
    novedad: Newspaper,
    biblioteca: Library,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{color:'#0C2749'}}>Buscar</h1>
        <p className="text-gray-500 text-sm mt-1">Busca en documentos, cursos, novedades y biblioteca</p>
      </div>

      <form action="/buscar" method="get" className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              name="q"
              type="text"
              autoFocus
              defaultValue={query}
              placeholder="Busca documentos, cursos, capacitaciones..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
          <button type="submit" className="px-6 py-3 text-white text-sm font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm" style={{background:'#0043ff'}}>
            Buscar
          </button>
        </div>
      </form>

      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-gray-400">Escrib&#237; al menos 2 caracteres para buscar.</p>
      )}

      {query.length >= 2 && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {results.length === 0
              ? `Sin resultados para "${query}"`
              : `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${query}"`
            }
          </p>

          {results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-200" />
              <h3 className="font-semibold text-gray-500 mb-1">No encontramos resultados</h3>
              <p className="text-sm text-gray-400">Intent&#225; con otras palabras clave</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map(r => {
                const Icon = iconMap[r.type] ?? FileText;
                return (
                  <Link key={r.type + r.id} href={r.href}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-4 hover:shadow-md hover:border-gray-200 transition-all group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: r.badgeColor + '15'}}>
                      <Icon className="w-5 h-5" style={{color: r.badgeColor}} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{background: r.badgeColor + '15', color: r.badgeColor}}>
                          {r.badge}
                        </span>
                      </div>
                      <p className="font-semibold text-sm leading-tight group-hover:text-[#0043ff] transition-colors" style={{color:'#0C2749'}}>{r.title}</p>
                      {r.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{r.description}</p>}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0043ff] transition-colors flex-shrink-0 mt-1" />
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {!query && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <h3 className="font-semibold text-gray-500 mb-1">&#191;Qu&#233; est&#225;s buscando?</h3>
          <p className="text-sm text-gray-400">Busca en toda la plataforma: documentos, cursos, novedades y biblioteca</p>
        </div>
      )}
    </div>
  );
}
