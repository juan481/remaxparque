import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ProcessAccordion from '@/components/ProcessAccordion';
import { Users, ArrowRight } from 'lucide-react';

export default async function DirectorioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from('profiles')
    .select('parque, role')
    .eq('id', user!.id)
    .single();

  const isAdmin = ['staff', 'admin'].includes(profile?.role ?? '');
  const userParque = profile?.parque ?? 'both';

  // Fetch counts for each parque card
  const [{ count: countP1 }, { count: countP3 }] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true })
      .in('role', ['staff', 'admin'])
      .in('parque', ['parque1', 'both']),
    admin.from('profiles').select('*', { count: 'exact', head: true })
      .in('role', ['staff', 'admin'])
      .in('parque', ['parque3', 'both']),
  ]);

  // Which parque cards to show
  const showP1 = isAdmin || userParque === 'parque1' || userParque === 'both';
  const showP3 = isAdmin || userParque === 'parque3' || userParque === 'both';

  const parques = [
    showP1 && { key: 'parque1', label: 'RE/MAX Parque 1', color: '#0043ff', bg: '#EFF6FF', count: countP1 ?? 0 },
    showP3 && { key: 'parque3', label: 'RE/MAX Parque 3', color: '#ff1200', bg: '#FFF1F0', count: countP3 ?? 0 },
  ].filter(Boolean) as { key: string; label: string; color: string; bg: string; count: number }[];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Mi Oficina</h1>
        <p className="text-gray-500 mt-1">Directorio del equipo y guía de procesos operativos</p>
      </div>

      {/* Parque cards → Ver Staff */}
      <section className="mb-10">
        <h2 className="text-lg font-black mb-5" style={{color:'#0C2749'}}>Conocé al Staff</h2>
        <div className={`grid gap-5 ${parques.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-sm'}`}>
          {parques.map(({ key, label, color, bg, count }) => (
            <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: bg}}>
                  <Users className="w-5 h-5" style={{color}} />
                </div>
                <div>
                  <h3 className="font-black text-base" style={{color:'#0C2749'}}>{label}</h3>
                  <p className="text-sm text-gray-400">{count} integrante{count !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <Link
                href={`/staff?parque=${key}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-bold rounded-xl transition-all hover:opacity-90 active:scale-95"
                style={{background: color, color: '#fff'}}>
                <Users className="w-4 h-4" />
                Ver Staff
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2" style={{color:'#0C2749'}}>Guía de procesos</h2>
        <p className="text-gray-500 text-sm mb-6">Hacé clic en cada proceso para ver los pasos detallados</p>
        <ProcessAccordion />
      </section>
    </div>
  );
}
