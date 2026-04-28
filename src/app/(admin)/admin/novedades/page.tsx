import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import NovedadesClient from '@/components/admin/NovedadesClient';

export default async function AdminNovedadesPage() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: news } = await admin
    .from('news')
    .select('*')
    .neq('category', 'evento')
    .order('created_at', { ascending: false });
  return <NovedadesClient news={news ?? []} />;
}
