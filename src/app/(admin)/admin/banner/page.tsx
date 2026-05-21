import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import BannerClient from '@/components/admin/BannerClient';

export default async function AdminBannerPage() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: banners } = await admin
    .from('banners')
    .select('*')
    .order('created_at', { ascending: false });
  return <BannerClient banners={banners ?? []} />;
}