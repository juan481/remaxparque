"use client";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function loginWithGoogle() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  return (
    <div className="min-h-screen flex" style={{background:"#f7f5ee"}}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white relative overflow-hidden" style={{background:"linear-gradient(135deg, #0C2749 0%, #000e35 100%)"}}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 2px 2px, white 1px, transparent 0)",backgroundSize:"40px 40px"}} />
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 flex rounded-full overflow-hidden shadow-lg">
                <div className="w-1/2" style={{background:"#ff1200"}} />
                <div className="w-1/2" style={{background:"#0043ff"}} />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-4 bg-white rounded-b-sm" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-wide mb-2">ACADEMIA</h1>
          <p className="text-xl font-light opacity-80 mb-1">RE/MAX Parque</p>
          <div className="w-12 h-0.5 mx-auto my-6 opacity-40" style={{background:"#ff1200"}} />
          <p className="text-sm opacity-60 max-w-xs leading-relaxed">
            El hub digital de documentos, capacitaciones y herramientas para los mejores agentes inmobiliarios.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            {[["150+","Agentes"],["2","Oficinas"],["100%","Digital"]].map(([n,l]) => (
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
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 flex rounded-full overflow-hidden">
                <div className="w-1/2" style={{background:"#ff1200"}} />
                <div className="w-1/2" style={{background:"#0043ff"}} />
              </div>
            </div>
            <div>
              <p className="font-black text-sm tracking-wide" style={{color:"#0C2749"}}>ACADEMIA RE/MAX</p>
              <p className="text-xs text-gray-400">Parque</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{color:"#0C2749"}}>Bienvenido</h2>
          <p className="text-gray-500 text-sm mb-8">Ingres&#225; con tu cuenta Google corporativa para continuar</p>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <button onClick={loginWithGoogle} disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-5 bg-white border-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 hover:shadow-md"
              style={{borderColor: loading ? "#E5E7EB" : "#0043ff"}}>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? "Redirigiendo..." : "Continuar con Google"}
            </button>
            <p className="text-center text-gray-400 text-xs mt-5">Solo para agentes y staff de RE/MAX Parque</p>
          </div>
        </div>
      </div>
    </div>
  );
}