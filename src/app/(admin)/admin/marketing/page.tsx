import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import MarketingClient from '@/components/admin/MarketingClient';

export default async function AdminMarketingPage() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: templates } = await admin
    .from('marketing_templates')
    .select('*')
    .order('created_at', { ascending: false });
  return <MarketingClient templates={templates ?? []} />;
}
