import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import EventosClient from '@/components/admin/EventosClient';

export default async function AdminEventosPage() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [eventsRes, regsRes] = await Promise.all([
    admin.from('news').select('*').eq('category', 'evento').order('published_at', { ascending: false }),
    admin.from('event_registrations').select('event_id'),
  ]);

  // Count registrations per event
  const countMap: Record<string, number> = {};
  for (const r of regsRes.data ?? []) {
    countMap[r.event_id] = (countMap[r.event_id] ?? 0) + 1;
  }
  const regCounts = Object.entries(countMap).map(([event_id, count]) => ({ event_id, count }));

  return <EventosClient events={eventsRes.data ?? []} regCounts={regCounts} />;
}
