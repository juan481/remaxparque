import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { FileText, Download, ArrowRight, Users, Home as HomeIcon, ClipboardList, Scale, AlertCircle } from 'lucide-react';

export default async function LegalesPage() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: docs } = await admin.from('documents').select('*').eq('status','vigente').order('effective_date',{ascending:false});
  const ventas = (docs ?? []).filter(d => d.category === 'ventas');
  const alquileres = (docs ?? []).filter(d => d.category === 'alquileres');
  const uif = (docs ?? []).filter(d => d.category === 'uif');
  const { data: news } = await admin.from('news').select('id,title,content,urgency,published_at').eq('is_published',true).order('published_at',{ascending:false}).limit(3);

  const CATS = [
    { label: 'Ventas', desc: 'Contratos, condiciones, documentacion necesaria', docs: ventas, icon: Scale, color: '#0043ff' },
    { label: 'Alquileres', desc: 'Contratos, condiciones, documentacion necesaria', docs: alquileres, icon: HomeIcon, color: '#059669' },
    { label: 'UIF', desc: 'Formularios de prevencion de lavado de activos', docs: uif, icon: AlertCircle, color: '#D97706' },
  ];

  const PROCS = [
    { icon: Users, label: 'Conoce al Staff', desc: 'Directorio del equipo', color: '#0043ff', bg: '#EFF6FF' },
    { icon: HomeIcon, label: 'Alta de propiedades', desc: 'Proceso paso a paso', color: '#059669', bg: '#ECFDF5' },
    { icon: ClipboardList, label: 'Solicitud de informes', desc: 'Dominio e inhibicion', color: '#7C3AED', bg: '#F5F3FF' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Legales</h1>
        <p className="text-gray-500 mt-1">Contratos, formularios y documentos actualizados del equipo</p>
      </div>
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
                        ver mas <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {catDocs.length > 0 && (
                    <div className="mt-4 space-y-2 pl-14">
                      {catDocs.slice(0,3).map((doc: {id:string,title:string,file_url:string|null,version:string|null}) => (
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
                  <p className="font-bold text-gray-500">Sin documentos cargados aun</p>
                  <p className="text-sm text-gray-400 mt-1">El admin puede subir documentos desde el panel de administracion</p>
                </div>
              )}
            </div>
          </section>
          <section>
            <h2 className="text-lg font-black mb-4" style={{color:'#0C2749'}}>Procesos administrativos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PROCS.map(({ icon: Icon, label, desc, color, bg }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group cursor-pointer">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200" style={{background:bg}}>
                    <Icon className="w-7 h-7" style={{color}} />
                  </div>
                  <div>
                    <p className="font-black text-sm" style={{color:'#0C2749'}}>{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold mt-auto" style={{color}}>
                    ver mas <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
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
                {(news ?? []).map((n: {id:string,title:string,content:string|null,urgency:string,published_at:string|null}) => (
                  <div key={n.id} className="p-4 hover:bg-gray-50/50 cursor-pointer">
                    <div className="flex items-start gap-2 mb-1">
                      {n.urgency === 'urgente' && <span className="text-xs font-black px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{background:'#ff1200'}}>nuevo</span>}
                      <p className="text-sm font-bold leading-tight" style={{color:'#0C2749'}}>{n.title}</p>
                    </div>
                    {n.content && <p className="text-xs text-gray-400 line-clamp-2">{n.content}</p>}
                    <button className="mt-2 text-xs font-bold hover:underline" style={{color:'#0043ff'}}>ver mas</button>
                  </div>
                ))}
              </div>
            )}
            <div className="px-5 py-3 border-t border-gray-50">
              <Link href="/novedades" className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-bold rounded-xl text-white" style={{background:'#0043ff'}}>
                ver mas articulos <ArrowRight className="w-4 h-4" />
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
    </div>
  );
}
