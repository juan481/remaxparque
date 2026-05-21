'use server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function inscribirseAEvento(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await adminClient()
    .from('event_registrations')
    .insert({ event_id: eventId, user_id: user.id });

  // 23505 = unique violation = already registered, not an error for the user
  if (error && error.code !== '23505') throw new Error(error.message);
  revalidatePath('/eventos');
}

export async function cancelarInscripcion(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  await adminClient()
    .from('event_registrations')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id);

  revalidatePath('/eventos');
}