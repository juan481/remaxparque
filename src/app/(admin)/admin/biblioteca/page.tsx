import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import BibliotecaAdminClient from '@/components/admin/BibliotecaAdminClient';

export default async function BibliotecaAdminPage() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: resources } = await admin
    .from('library_resources')
    .select('*')
    .order('created_at', { ascending: false });
  return <BibliotecaAdminClient resources={resources ?? []} />;
}
