import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Mail, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import ProcessAccordion from '@/components/ProcessAccordion';

export default async function DirectorioPage() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: staff } = await admin
    .from('profiles')
    .select('id, full_name, avatar_url, role, department')
    .in('role', ['staff', 'admin'])
    .order('created_at', { ascending: true });

  const { data: agents } = await admin
    .from('profiles')
    .select('id, full_name, avatar_url, role, parque')
    .eq('role', 'agent')
    .order('full_name', { ascending: true });

  const roleLabel: Record<string,string> = { admin: 'Broker', staff: 'Staff', agent: 'Agente' };
  const roleColor: Record<string,string> = { admin: '#ff1200', staff: '#0043ff', agent: '#059669' };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Mi Oficina</h1>
        <p className="text-gray-500 mt-1">Directorio del equipo y guia de procesos operativos</p>
      </div>

      {(staff ?? []).length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-black mb-5" style={{color:'#0C2749'}}>Conoce al Staff</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              {(staff ?? []).map((s: {id:string,full_name:string|null,avatar_url:string|null,role:string,department:string|null}) => {
                const isBroker = s.role === 'admin';
                const color = roleColor[s.role] ?? '#666';
                return (
                  <div key={s.id} className="flex flex-col items-center gap-3 flex-shrink-0 group cursor-pointer" style={{minWidth: isBroker ? '140px' : '100px'}}>
                    <div className="relative">
                      {s.avatar_url
                        ? <img src={s.avatar_url} alt={s.full_name ?? ''} className="rounded-full object-cover ring-2 transition-all duration-200 group-hover:ring-4"
                            style={{width: isBroker ? '100px' : '72px', height: isBroker ? '100px' : '72px'}} />
                        : <div className="rounded-full flex items-center justify-center text-white font-black text-xl transition-all duration-200 group-hover:scale-105"
                            style={{width: isBroker ? '100px' : '72px', height: isBroker ? '100px' : '72px', background:'linear-gradient(135deg,#0C2749,#0043ff)', fontSize: isBroker ? '32px' : '24px'}}>
                            {s.full_name?.[0]??'?'}
                          </div>
                      }
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white" style={{background: color}} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-sm leading-tight" style={{color:'#0C2749', fontSize: isBroker ? '15px' : '13px'}}>{s.full_name ?? 'Staff'}</p>
                      <p className="text-xs font-bold mt-0.5" style={{color}}>{roleLabel[s.role] ?? s.role}</p>
                      {s.department && <p className="text-xs text-gray-400 mt-0.5">{s.department}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {(agents ?? []).length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black" style={{color:'#0C2749'}}>Agentes ({agents?.length ?? 0})</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {(agents ?? []).slice(0,10).map((a: {id:string,full_name:string|null,avatar_url:string|null,parque:string|null}) => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                {a.avatar_url
                  ? <img src={a.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  : <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-black group-hover:scale-105 transition-transform duration-200" style={{background:'linear-gradient(135deg,#0C2749,#0043ff)'}}>
                      {a.full_name?.[0]??'?'}
                    </div>
                }
                <div className="text-center">
                  <p className="text-sm font-bold leading-tight" style={{color:'#0C2749'}}>{a.full_name ?? 'Agente'}</p>
                  {a.parque && <p className="text-xs text-gray-400 mt-0.5">{a.parque === 'parque1' ? 'Parque 1' : a.parque === 'parque3' ? 'Parque 3' : 'Ambos'}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-black mb-2" style={{color:'#0C2749'}}>Guia de procesos</h2>
        <p className="text-gray-500 text-sm mb-6">Hace clic en cada proceso para ver los pasos detallados</p>
        <ProcessAccordion />
      </section>
    </div>
  );
}
