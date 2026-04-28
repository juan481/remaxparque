import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import EventosClient from '@/components/admin/EventosClient';

export default async function AdminEventosPage() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: events } = await admin
    .from('news')
    .select('*')
    .eq('category', 'evento')
    .order('published_at', { ascending: false });
  return <EventosClient events={events ?? []} />;
}
