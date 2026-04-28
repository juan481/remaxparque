import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { Search, Megaphone, FileText, Camera, Users, ChevronRight, Flame, Bell } from 'lucide-react';
import Link from 'next/link';

const QUICK = [
  { href: '/marketing', label: 'Plantillas para redes', icon: Megaphone, color: '#0043ff', bg: '#EEF2FF' },
  { href: '/legales', label: 'Contratos y documentos', icon: FileText, color: '#0C2749', bg: '#EFF6FF' },
  { href: '/marketing?cat=fotos', label: 'Fotos y videos', icon: Camera, color: '#059669', bg: '#ECFDF5' },
  { href: '/academia', label: 'Induccion nuevos', icon: Users, color: '#7C3AED', bg: '#F5F3FF' },
];

const PARA_VOS = [
  { href: '/marketing', label: 'Mis plantillas', sub: 'Redes sociales y branding', color: '#0043ff', bg: '#EFF6FF' },
  { href: '/academia', label: 'Mis cursos', sub: 'Capacitaciones y tutoriales', color: '#7C3AED', bg: '#F5F3FF' },
  { href: '/legales', label: 'Mis contratos', sub: 'Documentos y formularios', color: '#059669', bg: '#ECFDF5' },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user!.id).single();
  const { data: recentDocs } = await admin.from('documents').select('id,title,type').eq('status','vigente').order('created_at',{ascending:false}).limit(3);
  const { data: recentNews } = await admin.from('news').select('id,title,created_at').eq('is_published',true).order('created_at',{ascending:false}).limit(3);
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Agente';

  return (
    <div>
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{color:'#0C2749'}}>
          &#161;Buen d&#237;a, <span style={{color:'#0043ff'}}>{firstName}</span>! &#128075;
        </h1>
        <p className="text-gray-500 text-sm mt-1">Bienvenido a tu hub de RE/MAX Parque</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form action="/buscar" method="get" className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input name="q" type="text" placeholder="Busc&#225; curso, documento, capacitaci&#243;n..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
          </div>
          <button type="submit" className="px-5 py-3 text-white text-sm font-medium rounded-xl transition-all hover:opacity-90 active:scale-95 shadow-sm" style={{background:'#0043ff'}}>
            Buscar
          </button>
        </form>
        <div className="flex gap-2 mt-3 flex-wrap">
          {[
            {label:'Capacitaci&#243;n', href:'/buscar?q=Capacitacion'},
            {label:'Contrato de alquiler', href:'/buscar?q=alquiler'},
            {label:'Plantillas Instagram', href:'/buscar?q=instagram'},
          ].map(({label, href}) => (
            <a key={href} href={href} className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
              dangerouslySetInnerHTML={{__html: label}} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Accesos Rapidos */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{color:'#0C2749'}}>Accesos R&#225;pidos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK.map(({ href, label, icon: Icon, color, bg }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:bg}}>
                    <Icon className="w-6 h-6" style={{color}} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Para Vos */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#0C2749'}}>Para Vos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PARA_VOS.map(({ href, label, sub, color, bg }) => (
                <Link key={href} href={href}
                  className="relative overflow-hidden rounded-2xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5 group border border-gray-100"
                  style={{background:bg}}>
                  <ChevronRight className="absolute right-3 top-3 w-4 h-4 opacity-30 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all" style={{color}} />
                  <p className="font-bold text-sm leading-tight" style={{color}}>{label}</p>
                  <p className="text-xs mt-1 text-gray-500">{sub}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Lo mas buscado */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4" style={{color:'#ff1200'}} />
              <h3 className="text-sm font-semibold" style={{color:'#0C2749'}}>Lo m&#225;s buscado</h3>
            </div>
            {recentDocs && recentDocs.length > 0 ? (
              <div className="space-y-2">
                {recentDocs.map((doc, i) => (
                  <Link key={doc.id} href={`/legales/${doc.id}`}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 hover:text-blue-600 transition-colors group">
                    <span className="text-xs font-bold text-gray-300 w-4">{i+1}</span>
                    <span className="text-sm text-gray-600 group-hover:text-blue-600 truncate">{doc.title}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Pronto aparecer&#225;n documentos aqu&#237;</p>
            )}
            <Link href="/legales" className="mt-3 text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all" style={{color:'#0043ff'}}>
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Novedades */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4" style={{color:'#0043ff'}} />
              <h3 className="text-sm font-semibold" style={{color:'#0C2749'}}>Novedades</h3>
            </div>
            {recentNews && recentNews.length > 0 ? (
              <div className="space-y-2">
                {recentNews.map(item => (
                  <div key={item.id} className="py-2 border-b border-gray-50 last:border-0">
                    <p className="text-sm text-gray-700 truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(item.created_at).toLocaleDateString('es-AR',{day:'2-digit',month:'short'})}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Las novedades aparecer&#225;n aqu&#237;</p>
            )}
            <Link href="/novedades" className="mt-3 text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all" style={{color:'#0043ff'}}>
              Ver todas <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}