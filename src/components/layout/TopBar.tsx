'use client';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/types/database';

export default function TopBar({ profile }: { profile: Profile }) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <header className="h-14 bg-[#060E1E]/80 backdrop-blur border-b border-white/5 flex items-center justify-between px-6">
      <div>
        <span className="text-gray-400 text-sm">
          {profile.parque === 'parque1' ? 'RE/MAX Parque 1' : profile.parque === 'parque3' ? 'RE/MAX Parque 3' : 'RE/MAX Parque'}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <a href="/perfil" className="text-gray-400 hover:text-white text-sm transition-colors">
          {profile.full_name?.split(' ')[0]}
        </a>
        <button onClick={handleSignOut} className="text-gray-500 hover:text-red-400 text-xs transition-colors">
          Salir
        </button>
      </div>
    </header>
  );
}
