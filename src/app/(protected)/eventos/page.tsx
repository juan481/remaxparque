import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { Calendar } from 'lucide-react';
import EventsView from './EventsView';

export default async function EventosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin.from('profiles').select('parque').eq('id', user!.id).single();

  const [eventsRes, regsRes] = await Promise.all([
    admin
      .from('news')
      .select('id,title,content,urgency,category,published_at,drive_url,image_url,location,event_online')
      .eq('is_published', true)
      .eq('category', 'evento')
      .in('parque_visibility', ['both', profile?.parque ?? 'both'])
      .order('published_at', { ascending: true }),
    admin
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', user!.id),
  ]);

  const events = (eventsRes.data ?? []).map(e => ({
    id: e.id,
    title: e.title,
    content: e.content,
    date: e.published_at ?? new Date().toISOString(),
    urgency: e.urgency,
    category: e.category ?? undefined,
    drive_url: e.drive_url ?? undefined,
    image_url: e.image_url ?? undefined,
    location: e.location ?? undefined,
    event_online: e.event_online ?? false,
  }));

  const registeredIds = (regsRes.data ?? []).map(r => r.event_id);

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
          <p className="text-gray-400 max-w-sm mx-auto">Los próximos eventos del equipo van a aparecer acá con fechas y detalles.</p>
        </div>
      ) : (
        <EventsView events={events} userId={user!.id} registeredIds={registeredIds} />
      )}
    </div>
  );
}