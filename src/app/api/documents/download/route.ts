import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { documentId } = await request.json();

  const { data: profile } = await supabase
    .from('profiles')
    .select('parque')
    .eq('id', user.id)
    .single();

  await supabase.from('analytics_events').insert({
    user_id: user.id,
    event_type: 'doc_download',
    resource_id: documentId,
    parque: profile?.parque,
  });

  await supabase.from('download_logs').insert({
    user_id: user.id,
    document_id: documentId,
  });

  return NextResponse.json({ ok: true });
}
