'use client';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import ChatInterface from './park-ia/ChatInterface';

export default function ParkAIButton() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Don't render on the asistente page — the chat is already fullscreen there
  if (pathname === '/asistente') return null;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  function handleClick() {
    if (isMobile) {
      router.push('/asistente');
    } else {
      setOpen(o => !o);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3">
      {open && !isMobile && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up flex flex-col" style={{ maxHeight: '520px' }}>
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ background: 'linear-gradient(135deg,#0C2749,#0043ff)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-black text-white text-base leading-none">Park IA</p>
                <p className="text-xs text-blue-200 mt-0.5">Asistente RE/MAX Parque</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors duration-200">
              <span className="text-white text-sm font-bold leading-none">✕</span>
            </button>
          </div>
          <ChatInterface />
        </div>
      )}

      <button onClick={handleClick}
        className="flex items-center gap-2.5 px-5 py-3.5 rounded-full shadow-2xl text-white font-bold text-base transition-all duration-200 hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg,#0C2749,#0043ff)' }}>
        <Sparkles className="w-5 h-5" />
        <span className="hidden sm:inline">{open ? 'Cerrar' : 'Park IA'}</span>
      </button>
    </div>
  );
}