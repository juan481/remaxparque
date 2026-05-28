import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { Calendar, Images, ExternalLink } from 'lucide-react';
import EventsView from './EventsView';

export default async function EventosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin.from('profiles').select('parque').eq('id', user!.id).single();
  const parqueFilter = profile?.parque ?? 'both';

  const now = new Date().toISOString();

  const [eventsRes, regsRes, galleryRes] = await Promise.all([
    admin
      .from('news')
      .select('id,title,content,urgency,category,published_at,drive_url,image_url,location,event_online')
      .eq('is_published', true)
      .eq('category', 'evento')
      .in('parque_visibility', ['both', parqueFilter])
      .order('published_at', { ascending: true }),
    admin
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', user!.id),
    // Past events with an image — for the photo gallery grid
    admin
      .from('news')
      .select('id,title,published_at,image_url,drive_url')
      .eq('is_published', true)
      .eq('category', 'evento')
      .in('parque_visibility', ['both', parqueFilter])
      .not('image_url', 'is', null)
      .lt('published_at', now)
      .order('published_at', { ascending: false })
      .limit(12),
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
  const gallery = galleryRes.data ?? [];

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

      {/* Photo gallery — past events with images */}
      {gallery.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-3 mb-5">
            <Images className="w-5 h-5" style={{color:'#0043ff'}} />
            <h2 className="text-xl font-black" style={{color:'#0C2749'}}>Fotos de eventos</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map(ev => {
              const d = ev.published_at ? new Date(ev.published_at) : null;
              return (
                <div key={ev.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="h-40 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ev.image_url!}
                      alt={ev.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {ev.drive_url && (
                      <a href={ev.drive_url} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70">
                        <ExternalLink className="w-4 h-4 text-white" />
                      </a>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold leading-tight truncate" style={{color:'#0C2749'}}>{ev.title}</p>
                    {d && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {d.toLocaleDateString('es-AR', {day:'2-digit', month:'short', year:'numeric'})}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}