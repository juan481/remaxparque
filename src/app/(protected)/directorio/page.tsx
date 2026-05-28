import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import ProcessAccordion from '@/components/ProcessAccordion';

export default async function DirectorioPage() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: staff } = await admin
    .from('profiles')
    .select('id, full_name, avatar_url, role, department, parque')
    .in('role', ['staff', 'admin'])
    .order('created_at', { ascending: true });

  const { data: agents } = await admin
    .from('profiles')
    .select('id, full_name, avatar_url, role, parque')
    .eq('role', 'agent')
    .order('full_name', { ascending: true });

  const roleLabel: Record<string,string> = { admin: 'Broker', staff: 'Staff', agent: 'Agente' };
  const roleColor: Record<string,string> = { admin: '#ff1200', staff: '#0043ff', agent: '#059669' };

  // Split staff by parque
  const staffAll = staff ?? [];
  const staffP1   = staffAll.filter(s => s.parque === 'parque1' || s.parque === 'both');
  const staffP3   = staffAll.filter(s => s.parque === 'parque3' || s.parque === 'both');
  const hasBothGroups = staffP1.length > 0 && staffP3.length > 0;

  function renderStaff(members: typeof staffAll) {
    return members.map(s => {
      const isBroker = s.role === 'admin';
      const color = roleColor[s.role] ?? '#666';
      const size = isBroker ? '96px' : '68px';
      return (
        <div key={s.id} className="flex flex-col items-center gap-2.5 flex-shrink-0 group cursor-pointer"
          style={{minWidth: isBroker ? '130px' : '90px'}}>
          <div className="relative">
            {s.avatar_url
              ? <img src={s.avatar_url} alt={s.full_name ?? ''} className="rounded-full object-cover ring-2 ring-gray-100 transition-all duration-200 group-hover:ring-4"
                  style={{width: size, height: size, objectPosition:'center top'}} />
              : <div className="rounded-full flex items-center justify-center text-white font-black transition-all duration-200 group-hover:scale-105"
                  style={{width: size, height: size, background:'linear-gradient(135deg,#0C2749,#0043ff)', fontSize: isBroker ? '32px' : '22px'}}>
                  {s.full_name?.[0]??'?'}
                </div>
            }
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white" style={{background: color}} />
          </div>
          <div className="text-center">
            <p className="font-bold leading-tight" style={{color:'#0C2749', fontSize: isBroker ? '14px' : '12px'}}>{s.full_name ?? 'Staff'}</p>
            <p className="text-xs font-bold mt-0.5" style={{color}}>{roleLabel[s.role] ?? s.role}</p>
            {s.department && <p className="text-xs text-gray-400 mt-0.5">{s.department}</p>}
          </div>
        </div>
      );
    });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Mi Oficina</h1>
        <p className="text-gray-500 mt-1">Directorio del equipo y guía de procesos operativos</p>
      </div>

      {/* Staff — grouped by parque */}
      {staffAll.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-black mb-5" style={{color:'#0C2749'}}>Conocé al Staff</h2>
          {hasBothGroups ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {([
                { label: 'Parque 1', members: staffP1, color: '#0043ff', bg: '#EFF6FF' },
                { label: 'Parque 3', members: staffP3, color: '#ff1200', bg: '#FFF1F0' },
              ] as const).map(({ label, members, color, bg }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full" style={{background: color}} />
                    <h3 className="text-sm font-black" style={{color:'#0C2749'}}>{label}</h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background: bg, color}}>{members.length}</span>
                  </div>
                  <div className="flex items-center gap-4 overflow-x-auto pb-2">
                    {renderStaff(members)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-4 overflow-x-auto pb-2 pt-2">
                {renderStaff(staffAll)}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Agents */}
      {(agents ?? []).length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black" style={{color:'#0C2749'}}>
              Agentes ({agents?.length ?? 0})
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {(agents ?? []).map((a: {id:string;full_name:string|null;avatar_url:string|null;parque:string|null}) => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                {a.avatar_url
                  ? <img src={a.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover group-hover:scale-105 transition-transform duration-200" style={{objectPosition:'center top'}} />
                  : <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-black group-hover:scale-105 transition-transform duration-200" style={{background:'linear-gradient(135deg,#0C2749,#0043ff)'}}>
                      {a.full_name?.[0]??'?'}
                    </div>
                }
                <div className="text-center">
                  <p className="text-sm font-bold leading-tight" style={{color:'#0C2749'}}>{a.full_name ?? 'Agente'}</p>
                  {a.parque && a.parque !== 'both' && (
                    <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1" style={{background:'#EFF6FF', color:'#0043ff'}}>
                      {a.parque === 'parque1' ? 'Parque 1' : 'Parque 3'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-black mb-2" style={{color:'#0C2749'}}>Guía de procesos</h2>
        <p className="text-gray-500 text-sm mb-6">Hacé clic en cada proceso para ver los pasos detallados</p>
        <ProcessAccordion />
      </section>
    </div>
  );
}
