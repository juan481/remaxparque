import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChangePasswordForm from './ChangePasswordForm';

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: '#EFF6FF' }}>
          <svg className="w-8 h-8" fill="none" stroke="#0043ff" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black" style={{ color: '#0C2749' }}>Cambiá tu contraseña</h1>
        <p className="text-gray-500 text-sm mt-2">
          Por seguridad, necesitás establecer una contraseña personal antes de continuar.
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
