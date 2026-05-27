import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ChatInterface from '@/components/park-ia/ChatInterface';

export default function AsistentePage() {
  return (
    /*
     * Full-viewport chat: escape layout padding and fill exactly the space
     * below the NavBar. We cancel main's py-8 with -mt-8 -mb-8, then set
     * height using the --nav-h CSS variable defined in globals.css.
     */
    <div
      className="flex flex-col -mx-4 sm:-mx-6 -mt-8 -mb-8 overflow-hidden"
      style={{ height: 'calc(100svh - var(--nav-h, 60px))' }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-4 sm:px-6 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <Link
          href="/dashboard"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#0C2749,#0043ff)' }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-black text-sm leading-none" style={{ color: '#0C2749' }}>Park IA</p>
            <p className="text-xs text-gray-400 mt-0.5">Asistente RE/MAX Parque</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-400">En línea</span>
        </div>
      </div>

      {/* Chat fills all remaining height — no overflow at page level */}
      <div className="flex-1 min-h-0 flex flex-col max-w-2xl w-full mx-auto w-full">
        <ChatInterface fullPage />
      </div>
    </div>
  );
}
