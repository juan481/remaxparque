import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import DocumentosClient from '@/components/admin/DocumentosClient';

export default async function DocumentosAdminPage() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: docs } = await admin
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });
  return <DocumentosClient docs={docs ?? []} />;
}
