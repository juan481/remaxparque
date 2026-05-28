'use server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Simple per-email rate limiter (resets on process restart)
const loginAttempts = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_ATTEMPTS = 8;

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const rec = loginAttempts.get(email);
  if (!rec || now - rec.ts > WINDOW_MS) {
    loginAttempts.set(email, { count: 1, ts: now });
    return true;
  }
  if (rec.count >= MAX_ATTEMPTS) return false;
  rec.count += 1;
  return true;
}

export async function loginAction(formData: FormData): Promise<string | null> {
  const email = (formData.get('email') as string | null)?.trim() ?? '';
  const password = (formData.get('password') as string | null) ?? '';

  if (!email || !password) return 'Por favor completá todos los campos.';

  if (!checkRateLimit(email)) {
    return 'Demasiados intentos fallidos. Esperá 15 minutos antes de volver a intentar.';
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(list) {
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    const msg = error?.message ?? '';
    if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
      return 'Email o contraseña incorrectos.';
    }
    if (msg.includes('Email not confirmed')) {
      return 'Tu cuenta no está confirmada. Contactá al administrador.';
    }
    return 'Error al iniciar sesión. Intentá de nuevo.';
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from('profiles')
    .select('role, parque, password_changed')
    .eq('id', data.user.id)
    .single();

  if (!profile || profile.role === 'pending') {
    await supabase.auth.signOut();
    return 'Tu cuenta está pendiente de activación. Contactá al administrador.';
  }

  // Set role cookie (same as Google OAuth callback)
  cookieStore.set('x-user-role', profile.role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  // Force password change on first login
  if (profile.password_changed === false) {
    redirect('/change-password');
  }

  redirect('/dashboard');
}
