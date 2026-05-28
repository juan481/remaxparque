import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Users, Clock, CheckCircle, UserCheck, AlertCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
import AdminApproveUser from '@/components/admin/AdminApproveUser';
import { CreateUserButton, ResetPasswordButton, DeleteUserButton } from '@/components/admin/AdminCreateUser';

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: string;
  parque: string | null;
  created_at: string;
  password_changed: boolean | null;
};

export default async function UsuariosPage() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: pending } = await admin
    .from('profiles')
    .select('id,full_name,avatar_url,email,created_at')
    .eq('role', 'pending')
    .order('created_at', { ascending: false });

  const { data: active } = await admin
    .from('profiles')
    .select('id,full_name,avatar_url,email,role,parque,created_at,password_changed')
    .neq('role', 'pending')
    .order('created_at', { ascending: false });

  const total  = (active?.length ?? 0);
  const agents = (active ?? []).filter(u => u.role === 'agent').length;
  const staff  = (active ?? []).filter(u => u.role === 'staff').length;

  const roleColor:  Record<string, string> = { agent: '#0043ff', staff: '#7C3AED', admin: '#ff1200' };
  const roleLabel:  Record<string, string> = { agent: 'Agente', staff: 'Staff', admin: 'Admin' };
  const parqueLabel: Record<string, string> = { parque1: 'Parque 1', parque3: 'Parque 3', both: 'Ambos' };

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black" style={{ color: '#0C2749' }}>Gestión de Usuarios</h1>
          <p className="text-gray-500 mt-1">Aprobá nuevos accesos y administrá el equipo</p>
        </div>
        <CreateUserButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total activos', value: total,             icon: Users,      color: '#0043ff', bg: '#EFF6FF' },
          { label: 'Agentes',       value: agents,            icon: UserCheck,  color: '#059669', bg: '#ECFDF5' },
          { label: 'Staff',         value: staff,             icon: CheckCircle,color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'Pendientes',    value: pending?.length ?? 0, icon: Clock,   color: '#D97706', bg: '#FFFBEB' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <div>
              <p className="text-3xl font-black" style={{ color: '#0C2749' }}>{value}</p>
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
              <h2 className="text-xl font-black" style={{ color: '#0C2749' }}>Esperando aprobación</h2>
            </div>
            <span className="text-sm font-bold px-3 py-1 rounded-full text-white" style={{ background: '#D97706' }}>{pending.length}</span>
          </div>
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-1">
            <div className="flex items-center gap-2 px-4 py-3 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">Estos usuarios se registraron pero no pueden entrar hasta que los apruebes</p>
            </div>
            <div className="space-y-2 p-2">
              {(pending as { id: string; full_name: string | null; avatar_url: string | null; created_at: string }[])
                .map(user => (
                  <AdminApproveUser key={user.id} user={user} />
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Active users */}
      <section>
        <h2 className="text-xl font-black mb-4" style={{ color: '#0C2749' }}>Equipo activo ({active?.length ?? 0})</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
            <div className="col-span-4">Usuario</div>
            <div className="col-span-2">Rol</div>
            <div className="col-span-2">Parque</div>
            <div className="col-span-2">Contraseña</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>
          {(active ?? []).map((user: Profile, i: number) => (
            <div key={user.id}
              className={`grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-blue-50/30 transition-colors duration-150 ${i !== 0 ? 'border-t border-gray-50' : ''}`}>
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                  : <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: '#0C2749' }}>{user.full_name?.[0] ?? '?'}</div>
                }
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: '#0C2749' }}>{user.full_name ?? 'Sin nombre'}</p>
                  {user.email && <p className="text-xs text-gray-400 truncate">{user.email}</p>}
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: roleColor[user.role] ?? '#9CA3AF' }}>
                  {roleLabel[user.role] ?? user.role}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-sm font-medium text-gray-600">{parqueLabel[user.parque ?? ''] ?? user.parque ?? '—'}</span>
              </div>
              <div className="col-span-2">
                {user.password_changed === false ? (
                  <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#D97706' }}>
                    <ShieldAlert className="w-3.5 h-3.5" /> Pendiente
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#059669' }}>
                    <ShieldCheck className="w-3.5 h-3.5" /> Cambiada
                  </span>
                )}
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1.5">
                <ResetPasswordButton userId={user.id} userName={user.full_name ?? 'Usuario'} />
                <DeleteUserButton userId={user.id} userName={user.full_name ?? 'Usuario'} />
              </div>
            </div>
          ))}
          {(active ?? []).length === 0 && (
            <div className="px-5 py-12 text-center text-gray-400 text-sm">Sin usuarios activos</div>
          )}
        </div>
      </section>
    </div>
  );
}
