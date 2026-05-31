'use server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { revalidatePath } from 'next/cache';

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://academia.remax-parque.com.ar';

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

export async function resetUserPassword(
  userId: string,
  newPassword: string,
  userEmail: string,
  userName: string,
): Promise<Result> {
  if (!newPassword || newPassword.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  const db = admin();
  const { error } = await db.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return { error: error.message };

  await db.from('profiles').update({ password_changed: false }).eq('id', userId);

  // Notificar al usuario por email
  if (userEmail) {
    const nombre = userName.split(' ')[0] ?? userName;
    await resend.emails.send({
      from: 'Academia RE/MAX Parque <academia@remax-parque.com.ar>',
      to: userEmail,
      subject: 'Tu contraseña fue reiniciada — Academia RE/MAX Parque',
      text: `Hola ${nombre},\n\nTu contraseña fue reiniciada por el administrador.\n\nNueva contraseña temporal: ${newPassword}\n\nAl ingresar se te pedirá que la cambies.\n\n${SITE_URL}/login`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f7f5ee;">
          <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);">
            <div style="background:linear-gradient(135deg,#0C2749,#000e35);padding:28px 32px;text-align:center;">
              <p style="margin:0;color:#fff;font-size:20px;font-weight:900;letter-spacing:2px;">ACADEMIA</p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">RE/MAX Parque</p>
            </div>
            <div style="padding:32px;">
              <p style="margin:0 0 16px;color:#0C2749;font-size:20px;font-weight:900;">Hola, ${nombre}</p>
              <p style="color:#6B7280;font-size:15px;line-height:1.6;">El administrador reinició tu contraseña de acceso a Academia RE/MAX Parque.</p>
              <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin:24px 0;">
                <p style="margin:0 0 10px;color:#0C2749;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">Nueva contraseña temporal</p>
                <p style="margin:0;color:#0C2749;font-size:20px;font-weight:700;font-family:monospace;letter-spacing:2px;">${newPassword}</p>
              </div>
              <p style="color:#D97706;font-size:13px;background:#FFFBEB;padding:12px 16px;border-radius:8px;border-left:3px solid #D97706;">
                <strong>Al ingresar</strong> se te pedirá que establezcas una nueva contraseña personal.
              </p>
              <div style="margin-top:24px;">
                <a href="${SITE_URL}/login"
                   style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0043ff,#0C2749);color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;">
                  Ingresar ahora →
                </a>
              </div>
            </div>
          </div>
        </div>`,
    });
  }

  revalidatePath('/admin/usuarios');
  return { ok: true };
}

export async function changeUserRole(userId: string, newRole: string): Promise<Result> {
  const validRoles = ['agent', 'staff', 'admin'];
  if (!validRoles.includes(newRole)) return { error: 'Rol inválido.' };

  const db = admin();
  const { error } = await db.from('profiles').update({ role: newRole }).eq('id', userId);
  if (error) return { error: error.message };

  revalidatePath('/admin/usuarios');
  return { ok: true };
}

export async function updateUserProfile(userId: string, formData: FormData): Promise<Result> {
  const fullName  = (formData.get('full_name') as string | null)?.trim() ?? '';
  const phone     = (formData.get('phone') as string | null)?.trim() || null;
  const department= (formData.get('department') as string | null)?.trim() || null;
  const role      = (formData.get('role') as string | null) ?? '';
  const parque    = (formData.get('parque') as string | null) ?? '';
  const avatarUrl = (formData.get('avatar_url') as string | null)?.trim() || null;

  if (!fullName) return { error: 'El nombre no puede estar vacío.' };

  const db = admin();
  const update: Record<string, unknown> = { full_name: fullName, phone, department, role, parque };
  if (avatarUrl) update.avatar_url = avatarUrl;

  const { error } = await db.from('profiles').update(update).eq('id', userId);
  if (error) return { error: error.message };

  revalidatePath('/admin/usuarios');
  revalidatePath('/staff');
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
