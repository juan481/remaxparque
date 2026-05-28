'use server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function changePasswordAction(formData: FormData): Promise<string | null> {
  const newPassword = (formData.get('password') as string | null) ?? '';
  const confirm = (formData.get('confirm') as string | null) ?? '';

  if (!newPassword || newPassword.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (newPassword !== confirm) {
    return 'Las contraseñas no coinciden.';
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return 'Sesión inválida. Volvé a iniciar sesión.';

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return error.message;

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await admin
    .from('profiles')
    .update({ password_changed: true })
    .eq('id', user.id);

  redirect('/dashboard');
}
