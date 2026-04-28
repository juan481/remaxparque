import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { User, MapPin, Briefcase, Mail, Shield } from 'lucide-react';

const ROLE_LABEL: Record<string,string> = { pending:'Pendiente', agent:'Agente', staff:'Staff', admin:'Administrador' };
const ROLE_COLOR: Record<string,string> = { pending:'#9CA3AF', agent:'#0043ff', staff:'#7C3AED', admin:'#ff1200' };
const PARQUE_LABEL: Record<string,string> = { parque1:'RE/MAX Parque 1', parque3:'RE/MAX Parque 3', both:'Ambos Parques' };

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user!.id).single();

  const roleColor = ROLE_COLOR[profile?.role ?? 'agent'];
  const roleLabel = ROLE_LABEL[profile?.role ?? 'agent'];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{color:'#0C2749'}}>Mi Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Tu informaci&#243;n en RE/MAX Parque</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        {/* Banner */}
        <div className="h-24" style={{background:`linear-gradient(135deg, #0C2749, #0043ff)`}} />
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <div className="relative">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-2xl ring-4 ring-white shadow-lg" />
                : <div className="w-20 h-20 rounded-2xl ring-4 ring-white shadow-lg flex items-center justify-center text-white text-2xl font-bold" style={{background:'#0C2749'}}>{profile?.full_name?.[0]??'?'}</div>
              }
            </div>
            <span className="mb-2 text-sm font-semibold px-3 py-1.5 rounded-full text-white" style={{background:roleColor}}>{roleLabel}</span>
          </div>

          <h2 className="text-xl font-bold mb-1" style={{color:'#0C2749'}}>{profile?.full_name ?? 'Sin nombre'}</h2>

          <div className="space-y-2 mt-4">
            {user?.email && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" /> {user.email}
              </div>
            )}
            {profile?.parque && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" /> {PARQUE_LABEL[profile.parque] ?? profile.parque}
              </div>
            )}
            {profile?.department && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Briefcase className="w-4 h-4 text-gray-400" /> {profile.department}
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-gray-400" />
              Miembro desde {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-AR',{month:'long',year:'numeric'}) : '-'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs text-gray-400 text-center">Para modificar tu informaci&#243;n contact&#225; al administrador de la plataforma.</p>
      </div>
    </div>
  );
}