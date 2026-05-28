'use client';
import { useState, useTransition } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { changePasswordAction } from './_actions';

export default function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const err = await changePasswordAction(fd);
      if (err) setError(err);
    });
  }

  const inp = 'w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-[#0043ff] transition-colors bg-white pr-12';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Nueva contraseña</label>
          <div className="relative">
            <input
              name="password"
              type={showPass ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className={inp}
              disabled={pending}
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
              {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirmá la contraseña</label>
          <div className="relative">
            <input
              name="confirm"
              type={showPass ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Repetí tu contraseña"
              className={inp}
              disabled={pending}
            />
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm font-medium text-red-700 bg-red-50 border border-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
          {pending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Establecer contraseña
            </>
          )}
        </button>
      </form>
    </div>
  );
}
