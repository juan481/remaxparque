'use server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type Result = { error: string } | { ok: true };

export async function createUser(formData: FormData): Promise<Result> {
  const email = (formData.get('email') as string | null)?.trim() ?? '';
  const password = (formData.get('password') as string | null) ?? '';
  const fullName = (formData.get('full_name') as string | null)?.trim() ?? '';
  const parque = (formData.get('parque') as string | null) ?? 'parque1';
  const role = (formData.get('role') as string | null) ?? 'agent';

  if (!email || !password || !fullName) {
    return { error: 'Completá nombre, email y contraseña.' };
  }
  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  const db = admin();

  // Create auth user with confirmed email (no email verification needed)
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { error: 'Ya existe un usuario con ese email.' };
    }
    return { error: authError.message };
  }

  if (!authData.user) return { error: 'No se pudo crear el usuario.' };

  const { error: profileError } = await db.from('profiles').insert({
    id: authData.user.id,
    full_name: fullName,
    email,
    role,
    parque,
    password_changed: false,
  });

  if (profileError) {
    // Rollback auth user
    await db.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  revalidatePath('/admin/usuarios');
  return { ok: true };
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<Result> {
  if (!newPassword || newPassword.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  const db = admin();
  const { error } = await db.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return { error: error.message };

  // Force password change on next login
  await db.from('profiles').update({ password_changed: false }).eq('id', userId);

  revalidatePath('/admin/usuarios');
  return { ok: true };
}

export async function deleteUser(userId: string): Promise<Result> {
  const db = admin();

  await db.from('profiles').delete().eq('id', userId);
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath('/admin/usuarios');
  return { ok: true };
}
