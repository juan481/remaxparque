import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Users, FileText, BarChart3, Clock, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';

export default async function AdminPage() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString();

  const [pendingRes, activeRes, docsRes, downloadsRes] = await Promise.all([
    admin.from('profiles').select('id,full_name,avatar_url,created_at').eq('role','pending').order('created_at',{ascending:false}),
    admin.from('profiles').select('*',{count:'exact',head:true}).neq('role','pending'),
    admin.from('documents').select('*',{count:'exact',head:true}).eq('status','vigente'),
    admin.from('analytics_events').select('*',{count:'exact',head:true}).eq('event_type','doc_download').gte('created_at',sevenDaysAgo),
  ]);

  const pending = pendingRes.data ?? [];
  const pendingCount = pending.length;

  const CARDS = [
    {
      href: '/admin/usuarios',
      title: 'Gestion de Usuarios',
      desc: 'Aproba nuevos ingresos, asigna roles y parques al equipo',
      icon: Users,
      color: '#0043ff',
      bg: '#EFF6FF',
      badge: pendingCount > 0 ? { text: `${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}`, urgent: true } : null,
      stat: `${activeRes.count ?? 0} activos`,
    },
    {
      href: '/admin/documentos',
      title: 'Documentos Legales',
      desc: 'Subi contratos, formularios y archivos de procedimiento',
      icon: FileText,
      color: '#7C3AED',
      bg: '#F5F3FF',
      badge: null,
      stat: `${docsRes.count ?? 0} vigentes`,
    },
    {
      href: '/admin/analytics',
      title: 'Analytics',
      desc: 'Ve cuantos usuarios entran, que descargan y como adoptan la plataforma',
      icon: BarChart3,
      color: '#059669',
      bg: '#ECFDF5',
      badge: null,
      stat: `${downloadsRes.count ?? 0} descargas esta semana`,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 rounded-full text-xs font-black text-white tracking-wider" style={{background:'#ff1200'}}>ADMIN</span>
          <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Panel de administración</h1>
        </div>
        <p className="text-gray-500">Gestioná usuarios, documentos y analizá el uso de la plataforma</p>
      </div>

      {/* Pending alert */}
      {pendingCount > 0 && (
        <Link href="/admin/usuarios"
          className="flex items-center gap-4 mb-8 p-5 rounded-2xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors duration-200 group">
          <div className="w-12 h-12 rounded-2xl bg-amber-200 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-700" />
          </div>
          <div className="flex-1">
            <p className="font-black text-amber-900 text-lg">
              {pendingCount === 1 ? '1 persona esperando aprobación' : `${pendingCount} personas esperando aprobación`}
            </p>
            <p className="text-sm text-amber-700 mt-0.5">No pueden entrar a la plataforma hasta que las aprobés</p>
          </div>
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm group-hover:gap-3 transition-all duration-200">
            Ir a aprobar <ArrowRight className="w-5 h-5" />
          </div>
        </Link>
      )}

      {/* Section cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {CARDS.map(({ href, title, desc, icon: Icon, color, bg, badge, stat }) => (
          <Link key={href} href={href}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200" style={{background:bg}}>
                <Icon className="w-7 h-7" style={{color}} />
              </div>
              {badge && (
                <span className={`text-xs font-black px-3 py-1.5 rounded-full text-white ${badge.urgent ? 'animate-pulse' : ''}`}
                  style={{background: badge.urgent ? '#D97706' : '#9CA3AF'}}>
                  {badge.text}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-black mb-1" style={{color:'#0C2749'}}>{title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
            <div className="flex items-center justify-between border-t border-gray-50 pt-4">
              <span className="text-sm font-bold" style={{color}}>{stat}</span>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#0043ff] group-hover:translate-x-1 transition-all duration-200" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick pending preview */}
      {pending.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black" style={{color:'#0C2749'}}>Accesos pendientes</h2>
            <Link href="/admin/usuarios" className="text-sm font-bold hover:underline" style={{color:'#0043ff'}}>Ver todos</Link>
          </div>
          <div className="space-y-3">
            {pending.slice(0,3).map((u: {id:string,full_name:string|null,avatar_url:string|null,created_at:string}) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                {u.avatar_url
                  ? <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{background:'#0C2749'}}>{u.full_name?.[0]??'?'}</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{color:'#0C2749'}}>{u.full_name ?? 'Sin nombre'}</p>
                  <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'})}</p>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                  <Clock className="w-3 h-3" /> Esperando
                </span>
              </div>
            ))}
            {pending.length > 3 && (
              <p className="text-sm text-center text-gray-400 pt-1">+{pending.length - 3} más</p>
            )}
          </div>
        </div>
      )}

      {pendingCount === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{color:'#059669'}} />
          <p className="font-black text-lg" style={{color:'#0C2749'}}>Todo al día</p>
          <p className="text-gray-400 text-sm mt-1">No hay usuarios esperando aprobación</p>
        </div>
      )}
    </div>
  );
}
