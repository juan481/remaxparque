import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { FileText, Download, Library } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'capacitacion', label: 'Material de Capacitacion' },
  { value: 'presentaciones', label: 'Presentaciones' },
  { value: 'plantillas', label: 'Plantillas editables' },
  { value: 'guias', label: 'Guias y Manuales' },
  { value: 'formularios', label: 'Formularios' },
  { value: 'normativa', label: 'Normativa' },
  { value: 'videos', label: 'Videos' },
  { value: 'otro', label: 'Otro' },
];

const CAT_COLOR: Record<string, string> = {
  capacitacion: '#0043ff', presentaciones: '#7C3AED',
  plantillas: '#D97706', guias: '#0D9488', formularios: '#059669',
  normativa: '#ff1200', videos: '#EC4899', otro: '#9CA3AF',
};

function catColor(cat: string) { return CAT_COLOR[cat] ?? '#9CA3AF'; }
function catLabel(cat: string) { return CATEGORIES.find(c => c.value === cat)?.label ?? cat; }
function formatSize(kb: number | null) {
  if (!kb) return '';
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

type LibResource = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  parque_visibility: string[];
  file_url: string | null;
  file_name: string | null;
  file_size_kb: number | null;
  file_type: string | null;
};

export default async function BibliotecaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from('profiles')
    .select('parque')
    .eq('id', user!.id)
    .single();

  let query = admin
    .from('library_resources')
    .select('id, title, description, category, parque_visibility, file_url, file_name, file_size_kb, file_type')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (profile?.parque && profile.parque !== 'both') {
    query = query.contains('parque_visibility', [profile.parque]);
  }

  const { data: resources } = await query;
  const list: LibResource[] = resources ?? [];

  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = list.filter(r => r.category === cat.value);
    return acc;
  }, {} as Record<string, LibResource[]>);

  const usedCategories = CATEGORIES.filter(c => (byCategory[c.value]?.length ?? 0) > 0);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 w-fit">
        <Link href="/academia"
          className="px-5 py-2 text-sm font-bold rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all">
          Cursos
        </Link>
        <span className="px-5 py-2 text-sm font-bold rounded-xl text-white"
          style={{ background: '#0C2749' }}>
          Biblioteca Digital
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0C2749' }}>Biblioteca Digital</h1>
        <p className="text-gray-500 text-sm mt-1">
          {list.length} recurso{list.length !== 1 ? 's' : ''} disponible{list.length !== 1 ? 's' : ''} para tu parque
        </p>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Library className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-600 mb-2">Sin recursos disponibles</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Pronto habr&#225; materiales disponibles para tu parque.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {usedCategories.map(cat => (
            <section key={cat.value}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: catColor(cat.value) + '15' }}>
                  <FileText className="w-4 h-4" style={{ color: catColor(cat.value) }} />
                </div>
                <h2 className="text-lg font-black" style={{ color: '#0C2749' }}>{cat.label}</h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ color: catColor(cat.value), background: catColor(cat.value) + '15' }}>
                  {byCategory[cat.value].length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {byCategory[cat.value].map((r) => (
                  <div key={r.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden">
                    {/* Color header */}
                    <div className="h-20 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg,${catColor(r.category)}25,${catColor(r.category)}08)` }}>
                      <FileText className="w-9 h-9" style={{ color: catColor(r.category) + 'aa' }} />
                    </div>

                    <div className="p-4">
                      {/* Badges */}
                      <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                        {r.file_type && (
                          <span className="text-xs font-black px-2 py-0.5 rounded-full uppercase"
                            style={{ color: catColor(r.category), background: catColor(r.category) + '15' }}>
                            {r.file_type}
                          </span>
                        )}
                        {r.parque_visibility.map(p => (
                          <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                            {p === 'parque1' ? 'P1' : 'P3'}
                          </span>
                        ))}
                      </div>

                      <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2"
                        style={{ color: '#0C2749' }}>
                        {r.title}
                      </h3>

                      {r.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-2">{r.description}</p>
                      )}

                      {r.file_size_kb && (
                        <p className="text-xs text-gray-400 mb-3">{formatSize(r.file_size_kb)}</p>
                      )}

                      {r.file_url ? (
                        <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2 text-sm font-bold rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
                          style={{ background: catColor(r.category) }}>
                          <Download className="w-4 h-4" /> Descargar
                        </a>
                      ) : (
                        <div className="w-full py-2 text-sm font-bold rounded-xl text-center text-gray-400 bg-gray-100">
                          Sin archivo
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
