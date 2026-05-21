import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('x-user-role')?.value;
    // Only redirect if the role cookie is present (set by the OAuth callback).
    // If it's missing, the session expired while Supabase was paused,
    // so we show the login form to force a fresh OAuth flow.
    if (userRole) redirect('/dashboard');
  }

  return <LoginForm />;
}
