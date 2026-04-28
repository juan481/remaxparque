import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import ParkAIButton from '@/components/ParkAIButton';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role === 'pending') redirect('/pending');

  return (
    <div className="min-h-screen flex flex-col" style={{background:'#f7f5ee'}}>
      <NavBar profile={profile} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-100 py-4 px-6 mt-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-gray-400">&#169; 2026 RE/MAX Parque. Dise&#241;ado por Just Create</p>
          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5"><div className="absolute inset-0 flex rounded-full overflow-hidden"><div className="w-1/2" style={{background:'#ff1200'}}/><div className="w-1/2" style={{background:'#0043ff'}}/></div></div>
            <span className="text-xs font-bold" style={{color:'#0C2749'}}>RE/MAX PARQUE</span>
          </div>
        </div>
      </footer>
      <ParkAIButton />
    </div>
  );
}
