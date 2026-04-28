import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import NavBar from '@/components/layout/NavBar';
import AdminNav from '@/components/admin/AdminNav';
import ParkAIButton from '@/components/ParkAIButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !['staff', 'admin'].includes(profile.role)) redirect('/dashboard');

  return (
    <div className="min-h-screen flex flex-col" style={{background:'#f7f5ee'}}>
      <NavBar profile={profile} />
      <div className="sticky top-0 z-40 border-b-2 border-red-300" style={{background:'#FEF2F2'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm font-black text-red-800 tracking-wide">MODO ADMINISTRACION</span>
          <span className="hidden sm:inline text-xs text-red-500 font-medium">— Los cambios afectan a todos los usuarios del equipo</span>
          <span className="ml-auto text-xs font-black px-2.5 py-1 rounded-full text-white capitalize" style={{background:'#ff1200'}}>{profile.role}</span>
        </div>
      </div>
      <AdminNav />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      <ParkAIButton />
    </div>
  );
}
