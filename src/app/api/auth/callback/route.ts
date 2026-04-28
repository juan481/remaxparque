import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', origin));
  }

  const cookieStore = await cookies();
  const sessionCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(incoming) {
          incoming.forEach(c => sessionCookies.push(c));
          incoming.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as never)
          );
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !user) {
    return NextResponse.redirect(new URL('/login?error=exchange_failed', origin));
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from('profiles')
    .select('role, parque')
    .eq('id', user.id)
    .maybeSingle();

  let redirectPath: string;
  let userRole = 'pending';

  if (!profile) {
    await admin.from('profiles').insert({
      id: user.id,
      full_name: user.user_metadata?.full_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role: 'pending',
    });
    await admin.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'user_signup',
    });
    redirectPath = '/pending';
  } else if (profile.role === 'pending') {
    userRole = 'pending';
    redirectPath = '/pending';
  } else {
    userRole = profile.role;
    await admin.rpc('cache_user_session', {
      p_user_id: user.id,
      p_role: profile.role,
      p_parque: profile.parque ?? 'both',
    });
    redirectPath = '/dashboard';
  }

  const response = NextResponse.redirect(new URL(redirectPath, origin));

  // Session cookies from exchangeCodeForSession
  sessionCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as never);
  });

  // Role cookie for the proxy (avoids RLS query on every request)
  response.cookies.set('x-user-role', userRole, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}