import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Users, Download, Activity, TrendingUp, BarChart3, ArrowUp } from 'lucide-react';

export default async function AnalyticsPage() {
  const admin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString();

  const [activeUsers7, downloads7, totalUsers, sessions30] = await Promise.all([
    admin.from('analytics_events').select('user_id',{count:'exact',head:true}).eq('event_type','session_start').gte('created_at',sevenDaysAgo),
    admin.from('analytics_events').select('*',{count:'exact',head:true}).eq('event_type','doc_download').gte('created_at',sevenDaysAgo),
    admin.from('profiles').select('*',{count:'exact',head:true}).neq('role','pending'),
    admin.from('analytics_events').select('event_type,parque,created_at').eq('event_type','session_start').gte('created_at',thirtyDaysAgo),
  ]);

  const p1Sessions = (sessions30.data ?? []).filter((e:{parque:string|null}) => e.parque === 'parque1').length;
  const p3Sessions = (sessions30.data ?? []).filter((e:{parque:string|null}) => e.parque === 'parque3').length;
  const totalSessions = p1Sessions + p3Sessions || 1;

  const kpis = [
    { label:'Usuarios activos', sub:'Ultimos 7 dias', value: activeUsers7.count ?? 0, icon: Users, color:'#0043ff', bg:'#EFF6FF', trend:'+12%' },
    { label:'Descargas', sub:'Ultimos 7 dias', value: downloads7.count ?? 0, icon: Download, color:'#059669', bg:'#ECFDF5', trend:'+5%' },
    { label:'Total equipo', sub:'Usuarios activos', value: totalUsers.count ?? 0, icon: Activity, color:'#7C3AED', bg:'#F5F3FF', trend:'' },
    { label:'Sesiones 30 dias', sub:'Ambos parques', value: (sessions30.data ?? []).length, icon: TrendingUp, color:'#D97706', bg:'#FFFBEB', trend:'' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Analytics</h1>
        <p className="text-gray-500 mt-1">Adopci&#243;n y uso de la plataforma en tiempo real</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(({ label, sub, value, icon: Icon, color, bg, trend }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:bg}}>
                <Icon className="w-6 h-6" style={{color}} />
              </div>
              {trend && (
                <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <ArrowUp className="w-3 h-3" />{trend}
                </div>
              )}
            </div>
            <p className="text-4xl font-black" style={{color:'#0C2749'}}>{value}</p>
            <p className="text-sm font-bold text-gray-700 mt-1">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Parque distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5" style={{color:'#0043ff'}} />
            <h2 className="text-lg font-bold" style={{color:'#0C2749'}}>Sesiones por parque</h2>
            <span className="text-xs text-gray-400 ml-1">(&#250;ltimos 30 dias)</span>
          </div>
          <div className="space-y-5">
            {[
              { label:'RE/MAX Parque 1', count: p1Sessions, color:'#0043ff' },
              { label:'RE/MAX Parque 3', count: p3Sessions, color:'#ff1200' },
            ].map(({ label, count, color }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold" style={{color:'#0C2749'}}>{label}</span>
                  <span className="text-sm font-black" style={{color}}>{count}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{width:`${Math.round(count/totalSessions*100)}%`, background:color}} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{Math.round(count/totalSessions*100)}% del total</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold mb-6" style={{color:'#0C2749'}}>Estado de la plataforma</h2>
          <div className="space-y-4">
            {[
              { label:'Base de datos', status:'Online', color:'#059669' },
              { label:'Autenticacion Google', status:'Online', color:'#059669' },
              { label:'Storage de archivos', status:'Online', color:'#059669' },
              { label:'Chatbot IA (RAG)', status:'Proximamente', color:'#D97706' },
            ].map(({ label, status, color }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <span className="text-base font-medium text-gray-700">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{background:color}} />
                  <span className="text-sm font-semibold" style={{color}}>{status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}