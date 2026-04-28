import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Users, Clock, CheckCircle, UserCheck, AlertCircle } from 'lucide-react';
import AdminApproveUser from '@/components/admin/AdminApproveUser';

export default async function UsuariosPage() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: pending } = await admin.from('profiles').select('*').eq('role','pending').order('created_at',{ascending:false});
  const { data: active } = await admin.from('profiles').select('*').neq('role','pending').order('created_at',{ascending:false});

  const total = (active?.length ?? 0);
  const agents = (active ?? []).filter((u:{role:string}) => u.role === 'agent').length;
  const staff = (active ?? []).filter((u:{role:string}) => u.role === 'staff').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Gesti&#243;n de Usuarios</h1>
        <p className="text-gray-500 mt-1">Aprob&#225; nuevos accesos y administr&#225; el equipo</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label:'Total activos', value:total, icon:Users, color:'#0043ff', bg:'#EFF6FF' },
          { label:'Agentes', value:agents, icon:UserCheck, color:'#059669', bg:'#ECFDF5' },
          { label:'Staff', value:staff, icon:CheckCircle, color:'#7C3AED', bg:'#F5F3FF' },
          { label:'Pendientes', value:pending?.length ?? 0, icon:Clock, color:'#D97706', bg:'#FFFBEB' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:bg}}>
              <Icon className="w-6 h-6" style={{color}} />
            </div>
            <div>
              <p className="text-3xl font-black" style={{color:'#0C2749'}}>{value}</p>
              <p className="text-sm text-gray-500 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending section */}
      {pending && pending.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse-dot" />
              <h2 className="text-xl font-black" style={{color:'#0C2749'}}>Esperando aprobaci&#243;n</h2>
            </div>
            <span className="text-sm font-bold px-3 py-1 rounded-full text-white" style={{background:'#D97706'}}>{pending.length}</span>
          </div>
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-1">
            <div className="flex items-center gap-2 px-4 py-3 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">Estos usuarios se registraron pero no pueden entrar hasta que los apruebes</p>
            </div>
            <div className="space-y-2 p-2">
              {pending.map((user: {id:string,full_name:string|null,avatar_url:string|null,created_at:string}) => (
                <AdminApproveUser key={user.id} user={user} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Active users */}
      <section>
        <h2 className="text-xl font-black mb-4" style={{color:'#0C2749'}}>Equipo activo ({active?.length ?? 0})</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
            <div className="col-span-5">Usuario</div>
            <div className="col-span-3">Rol</div>
            <div className="col-span-4">Parque</div>
          </div>
          {(active ?? []).map((user:{id:string,full_name:string|null,avatar_url:string|null,role:string,parque:string|null,created_at:string}, i:number) => {
            const roleColor:{[k:string]:string} = { agent:'#0043ff', staff:'#7C3AED', admin:'#ff1200' };
            const roleLabel:{[k:string]:string} = { agent:'Agente', staff:'Staff', admin:'Admin' };
            const parqueLabel:{[k:string]:string} = { parque1:'Parque 1', parque3:'Parque 3', both:'Ambos' };
            return (
              <div key={user.id} className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-blue-50/30 transition-colors duration-150 ${i !== 0 ? 'border-t border-gray-50' : ''}`}>
                <div className="col-span-5 flex items-center gap-3">
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                    : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{background:'#0C2749'}}>{user.full_name?.[0]??'?'}</div>
                  }
                  <div>
                    <p className="font-semibold text-sm" style={{color:'#0C2749'}}>{user.full_name ?? 'Sin nombre'}</p>
                    <p className="text-xs text-gray-400">{new Date(user.created_at).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'})}</p>
                  </div>
                </div>
                <div className="col-span-3">
                  <span className="text-sm font-bold px-3 py-1.5 rounded-full text-white" style={{background: roleColor[user.role] ?? '#9CA3AF'}}>
                    {roleLabel[user.role] ?? user.role}
                  </span>
                </div>
                <div className="col-span-4">
                  <span className="text-sm font-medium text-gray-600">{parqueLabel[user.parque ?? ''] ?? user.parque ?? '—'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}