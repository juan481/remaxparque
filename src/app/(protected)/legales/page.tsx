import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FileText, Download, ArrowRight, Users, Home as HomeIcon, ClipboardList, Scale, AlertCircle, Search } from 'lucide-react';
import SectionSearchBar from '@/components/shared/SectionSearchBar';

export default async function LegalesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch user parque to filter docs
  const { data: profile } = user
    ? await admin.from('profiles').select('parque, role').eq('id', user.id).single()
    : { data: null };
  const isAdmin = ['staff', 'admin'].includes(profile?.role ?? '');
  const userParque = profile?.parque ?? null;

  // Build document query — scoped to Legales section, filtered by parque
  let docsQuery = admin.from('documents').select('*').eq('status','vigente').order('effective_date',{ascending:false});
  if (!isAdmin && userParque && userParque !== 'both') {
    docsQuery = docsQuery.contains('parque_visibility', [userParque]);
  }
  if (query.length >= 2) {
    docsQuery = docsQuery.or(`title.ilike.%${query}%`);
  }
  const { data: docs } = await docsQuery;

  const ventas    = (docs ?? []).filter(d => d.category === 'ventas');
  const alquileres = (docs ?? []).filter(d => d.category === 'alquileres');
  const uif       = (docs ?? []).filter(d => d.category === 'uif');

  const { data: news } = await admin
    .from('news')
    .select('id,title,content,urgency,published_at')
    .eq('is_published',true)
    .order('published_at',{ascending:false})
    .limit(3);

  const CATS = [
    { label: 'Ventas',     desc: 'Contratos, condiciones, documentacion necesaria', docs: ventas,     icon: Scale,       color: '#0043ff' },
    { label: 'Alquileres', desc: 'Contratos, condiciones, documentacion necesaria', docs: alquileres, icon: HomeIcon,    color: '#059669' },
    { label: 'UIF',        desc: 'Formularios de prevención de lavado de activos',  docs: uif,        icon: AlertCircle, color: '#D97706' },
  ];

  const PROCS = [
    { icon: Users,         label: 'Conocé al Staff',       desc: 'Directorio del equipo',         color: '#0043ff', bg: '#EFF6FF', href: '/directorio' },
    { icon: HomeIcon,      label: 'Alta de propiedades',   desc: 'Proceso paso a paso',           color: '#059669', bg: '#ECFDF5', href: '/documentos/alta-propiedades' },
    { icon: ClipboardList, label: 'Solicitud de informes', desc: 'Dominio e inhibición',          color: '#7C3AED', bg: '#F5F3FF', href: '/documentos/solicitud-informes' },
  ];

  const quickTags = [
    { label: 'Contrato alquiler', value: 'alquiler' },
    { label: 'Compraventa',       value: 'compraventa' },
    { label: 'UIF',               value: 'UIF' },
    { label: 'Reserva',           value: 'reserva' },
  ];

  const isSearching = query.length >= 2;
  const allResults = docs ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Legales</h1>
        <p className="text-gray-500 mt-1">Contratos, formularios y documentos actualizados del equipo</p>
      </div>

      {/* Search — scoped to Legales */}
      <SectionSearchBar
        placeholder="Buscar contratos, formularios, documentos..."
        defaultValue={query}
        quickTags={quickTags}
      />

      {isSearching && (
        <p className="text-sm text-gray-500 mb-6">
          {allResults.length === 0
            ? `Sin resultados para "${query}" en Legales`
            : `${allResults.length} resultado${allResults.length !== 1 ? 's' : ''} en Legales para "${query}"`
          }
        </p>
      )}

      {/* When searching: show flat list of results */}
      {isSearching && allResults.length > 0 && (
        <div className="mb-8 space-y-2">
          {allResults.map((doc: {id:string;title:string;file_url:string|null;version:string|null;category:string|null;type:string|null}) => {
            const catColors: Record<string,string> = { ventas:'#0043ff', alquileres:'#059669', uif:'#D97706' };
            const color = catColors[doc.category ?? ''] ?? '#0C2749';
            return (
              <div key={doc.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: color + '15'}}>
                    <FileText className="w-4 h-4" style={{color}} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {doc.category && <span className="text-xs capitalize font-medium" style={{color}}>{doc.category}</span>}
                      {doc.version && <span className="text-xs text-gray-400">v{doc.version}</span>}
                    </div>
                  </div>
                </div>
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg text-white flex-shrink-0"
                    style={{background: color}}>
                    <Download className="w-3 h-3" /> PDF
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isSearching && allResults.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center mb-8">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <h3 className="font-semibold text-gray-500 mb-1">Sin resultados en Legales</h3>
          <p className="text-sm text-gray-400">Intentá con otras palabras clave</p>
        </div>
      )}

      {/* Normal (non-search) view */}
      {!isSearching && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <h2 className="text-lg font-black" style={{color:'#0C2749'}}>Contratos y Documentos</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {CATS.map(({ label, desc, docs: catDocs, icon: Icon, color }) => (
                  <div key={label} className="px-6 py-5 hover:bg-gray-50/50 transition-colors duration-150">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: color + '15'}}>
                          <Icon className="w-5 h-5" style={{color}} />
                        </div>
                        <div>
                          <p className="font-black text-base" style={{color:'#0C2749'}}>{label}</p>
                          <p className="text-sm text-gray-400">{desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background: color + '15', color}}>{catDocs.length} docs</span>
                        <button className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl" style={{background: color + '15', color}}>
                          ver más <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {catDocs.length > 0 && (
                      <div className="mt-4 space-y-2 pl-14">
                        {catDocs.slice(0,3).map((doc: {id:string;title:string;file_url:string|null;version:string|null}) => (
                          <div key={doc.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-gray-300 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-700 truncate">{doc.title}</span>
                              {doc.version && <span className="text-xs text-gray-400">v{doc.version}</span>}
                            </div>
                            {doc.file_url && (
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg text-white flex-shrink-0"
                                style={{background: color}}>
                                <Download className="w-3 h-3" /> PDF
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {(docs ?? []).length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="font-bold text-gray-500">Sin documentos cargados aún</p>
                    <p className="text-sm text-gray-400 mt-1">El admin puede subir documentos desde el panel de administración</p>
                  </div>
                )}
              </div>
            </section>
            <section>
              <h2 className="text-lg font-black mb-4" style={{color:'#0C2749'}}>Procesos administrativos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PROCS.map(({ icon: Icon, label, desc, color, bg, href }) => (
                  <Link key={label} href={href}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200" style={{background:bg}}>
                      <Icon className="w-7 h-7" style={{color}} />
                    </div>
                    <div>
                      <p className="font-black text-sm" style={{color:'#0C2749'}}>{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold mt-auto" style={{color}}>
                      ver más <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="text-base font-black" style={{color:'#0C2749'}}>Novedades</h2>
              </div>
              {(news ?? []).length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">Sin novedades recientes</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {(news ?? []).map((n: {id:string;title:string;content:string|null;urgency:string;published_at:string|null}) => (
                    <div key={n.id} className="p-4 hover:bg-gray-50/50 cursor-pointer">
                      <div className="flex items-start gap-2 mb-1">
                        {n.urgency === 'urgente' && <span className="text-xs font-black px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{background:'#ff1200'}}>nuevo</span>}
                        <p className="text-sm font-bold leading-tight" style={{color:'#0C2749'}}>{n.title}</p>
                      </div>
                      {n.content && <p className="text-xs text-gray-400 line-clamp-2">{n.content}</p>}
                      <button className="mt-2 text-xs font-bold hover:underline" style={{color:'#0043ff'}}>ver más</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="px-5 py-3 border-t border-gray-50">
                <Link href="/novedades" className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-bold rounded-xl text-white" style={{background:'#0043ff'}}>
                  ver más artículos <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-black mb-4" style={{color:'#0C2749'}}>Resumen</h3>
              <div className="space-y-3">
                {CATS.map(({ label, docs: catDocs, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">{label}</span>
                    <span className="text-sm font-black" style={{color}}>{catDocs.length} vigentes</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
