import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Calendar } from 'lucide-react';
import EventsCalendar from '@/components/EventsCalendar';

export default async function EventosPage() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: rawEvents } = await admin
    .from('news')
    .select('id, title, content, urgency, category, published_at, drive_url')
    .eq('is_published', true)
    .eq('category', 'evento')
    .order('published_at', { ascending: true });

  const events = (rawEvents ?? []).map((e: {id:string,title:string,urgency:string,category:string|null,published_at:string|null,drive_url:string|null}) => ({
    id: e.id,
    title: e.title,
    date: e.published_at ?? new Date().toISOString(),
    urgency: e.urgency,
    category: e.category ?? undefined,
    drive_url: e.drive_url ?? undefined,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Eventos</h1>
        <p className="text-gray-500 mt-1">Capacitaciones, reuniones y actividades del equipo RE/MAX Parque</p>
      </div>
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-black mb-2" style={{color:'#0C2749'}}>Sin eventos publicados</h2>
          <p className="text-gray-400 max-w-sm mx-auto">Los proximos eventos del equipo van a aparecer aca con fechas y detalles.</p>
        </div>
      ) : (
        <EventsCalendar events={events} />
      )}
    </div>
  );
}
