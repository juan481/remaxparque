'use client';
import { useState, useTransition } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { loginAction } from './_actions';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const err = await loginAction(fd);
      if (err) setError(err);
    });
  }

  const inp = 'w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-[#0043ff] transition-colors bg-white';

  return (
    <div className="min-h-screen flex" style={{ background: '#f7f5ee' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0C2749 0%, #000e35 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 flex rounded-full overflow-hidden shadow-lg">
                <div className="w-1/2" style={{ background: '#ff1200' }} />
                <div className="w-1/2" style={{ background: '#0043ff' }} />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-4 bg-white rounded-b-sm" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-wide mb-2">ACADEMIA</h1>
          <p className="text-xl font-light opacity-80 mb-1">RE/MAX Parque</p>
          <div className="w-12 h-0.5 mx-auto my-6 opacity-40" style={{ background: '#ff1200' }} />
          <p className="text-sm opacity-60 max-w-xs leading-relaxed">
            El hub digital de documentos, capacitaciones y herramientas para los mejores agentes inmobiliarios.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            {[['150+', 'Agentes'], ['2', 'Oficinas'], ['100%', 'Digital']].map(([n, l]) => (
              <div key={l}>
                <p className="text-2xl font-bold">{n}</p>
                <p className="text-xs opacity-50 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 flex rounded-full overflow-hidden">
                <div className="w-1/2" style={{ background: '#ff1200' }} />
                <div className="w-1/2" style={{ background: '#0043ff' }} />
              </div>
            </div>
            <div>
              <p className="font-black text-sm tracking-wide" style={{ color: '#0C2749' }}>ACADEMIA RE/MAX</p>
              <p className="text-xs text-gray-400">Parque</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: '#0C2749' }}>Bienvenido</h2>
          <p className="text-gray-500 text-sm mb-8">Ingresá con tu email y contraseña para continuar</p>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tucorreo@remax.com.ar"
                  className={inp}
                  disabled={pending}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={inp + ' pr-12'}
                    disabled={pending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}>
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Turnstile — solo se muestra si hay site key configurada */}
              {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  options={{ theme: 'light', language: 'es' }}
                />
              )}

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm font-medium text-red-700 bg-red-50 border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #0043ff, #0C2749)' }}>
                {pending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Ingresar
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-gray-400 text-xs mt-5">
              Solo para agentes y staff de RE/MAX Parque
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
