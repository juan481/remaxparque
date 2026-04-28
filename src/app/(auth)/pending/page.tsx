import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Clock, LogOut } from 'lucide-react';

export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const name = user.user_metadata?.full_name?.split(' ')[0] ?? 'agente';

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:'linear-gradient(135deg, #0C2749 0%, #000e35 100%)'}}>
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 flex rounded-full overflow-hidden shadow-lg">
              <div className="w-1/2" style={{background:'#ff1200'}} />
              <div className="w-1/2" style={{background:'#0043ff'}} />
            </div>
          </div>
          <div className="text-left">
            <p className="text-white font-black text-lg tracking-wider leading-none">ACADEMIA</p>
            <p className="text-blue-300 text-xs">RE/MAX Parque</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{background:'rgba(255,193,7,0.15)'}}>
            <Clock className="w-8 h-8" style={{color:'#FCD34D'}} />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Cuenta en revision</h1>
          <p className="text-gray-400 text-sm mb-2">
            Hola <strong className="text-white">{name}</strong>, tu cuenta esta pendiente de aprobacion.
          </p>
          <p className="text-gray-500 text-xs mb-8">
            Un administrador la revisara y podras acceder a la plataforma en breve.
          </p>
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="flex items-center gap-2 mx-auto text-gray-400 hover:text-red-400 text-sm transition-colors">
              <LogOut className="w-4 h-4" /> Cerrar sesion
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}