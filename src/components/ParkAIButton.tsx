'use client';
import { useState, useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

const PARTICLES = [
  { angle: 0,   dist: 52 }, { angle: 45,  dist: 44 },
  { angle: 90,  dist: 52 }, { angle: 135, dist: 44 },
  { angle: 180, dist: 52 }, { angle: 225, dist: 44 },
  { angle: 270, dist: 52 }, { angle: 315, dist: 44 },
];

export default function ParkAIButton() {
  const router   = useRouter();
  const pathname = usePathname();
  const [launching, setLaunching] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset animation if user navigates away before it completes
  useEffect(() => {
    setLaunching(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [pathname]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  // Don't render on the asistente page — AFTER all hooks
  if (pathname === '/asistente') return null;

  function handleClick() {
    if (launching) return;
    setLaunching(true);
    timeoutRef.current = setTimeout(() => {
      router.push('/asistente');
      // Reset after navigation (in case back-navigation returns here)
      setTimeout(() => setLaunching(false), 300);
    }, 760);
  }

  return (
    <>
      <style>{`
        @keyframes park-ring {
          0%   { transform: scale(0.95); opacity: 0.7; }
          100% { transform: scale(2.8);  opacity: 0; }
        }
        @keyframes park-particle {
          0%   { transform: translate(var(--pdx), var(--pdy)) scale(1); opacity: 1; }
          100% { transform: translate(var(--pfx), var(--pfy)) scale(0); opacity: 0; }
        }
        @keyframes park-spin {
          from { transform: rotate(0deg)   scale(1); }
          to   { transform: rotate(540deg) scale(1.4); }
        }
        @keyframes park-glow {
          0%,100% { box-shadow: 0 8px 32px rgba(0,67,255,0.5); }
          50%     { box-shadow: 0 8px 48px rgba(124,58,237,0.8), 0 0 0 6px rgba(0,67,255,0.2); }
        }
      `}</style>

      <div className="fixed bottom-5 right-5 z-[100]" style={{ isolation: 'isolate' }}>
        {/* Expanding rings + particles */}
        {launching && (
          <div className="absolute inset-0 pointer-events-none rounded-full">
            {[0, 200, 400].map((delay) => (
              <div key={delay} className="absolute inset-0 rounded-full"
                style={{ background:'linear-gradient(135deg,#0C2749,#0043ff)', animation:`park-ring 0.85s ease-out ${delay}ms forwards`, opacity:0 }} />
            ))}
            {PARTICLES.map(({ angle, dist }, idx) => {
              const rad = (angle * Math.PI) / 180;
              const fx = Math.round(Math.cos(rad) * dist);
              const fy = Math.round(Math.sin(rad) * dist);
              const colors = ['#0043ff','#ff1200','#7C3AED','#fff'];
              return (
                <div key={idx} className="absolute rounded-full"
                  style={{
                    width: idx % 2 === 0 ? '7px' : '5px',
                    height: idx % 2 === 0 ? '7px' : '5px',
                    background: colors[idx % colors.length],
                    top:'50%', left:'50%',
                    marginTop: idx % 2 === 0 ? '-3.5px' : '-2.5px',
                    marginLeft: idx % 2 === 0 ? '-3.5px' : '-2.5px',
                    // @ts-expect-error CSS custom props
                    '--pdx':'0px','--pdy':'0px',
                    '--pfx':`${fx}px`,'--pfy':`${fy}px`,
                    animation:`park-particle 0.75s cubic-bezier(0.22,1,0.36,1) ${idx*30}ms forwards`,
                  }} />
              );
            })}
          </div>
        )}

        <button onClick={handleClick}
          className="relative flex items-center gap-2.5 px-5 py-3.5 rounded-full shadow-2xl text-white font-bold text-base transition-colors duration-300"
          style={{
            background: launching ? 'linear-gradient(135deg,#7C3AED,#0043ff,#0C2749)' : 'linear-gradient(135deg,#0C2749,#0043ff)',
            animation: launching ? 'park-glow 0.4s ease-in-out 2' : 'none',
          }}
          aria-label="Abrir Park IA">
          <Sparkles className="w-5 h-5 flex-shrink-0"
            style={{ animation: launching ? 'park-spin 0.76s cubic-bezier(0.22,1,0.36,1) forwards' : 'none' }} />
          <span className="hidden sm:inline whitespace-nowrap">
            {launching ? 'Iniciando IA...' : 'Park IA'}
          </span>
        </button>
      </div>
    </>
  );
}
