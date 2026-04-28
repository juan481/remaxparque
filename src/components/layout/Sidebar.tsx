'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types/database';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: '??' },
  { href: '/legales', label: 'Legales', icon: '??' },
  { href: '/academia', label: 'Academia', icon: '??' },
  { href: '/marketing', label: 'Marketing', icon: '??' },
  { href: '/eventos', label: 'Eventos', icon: '??' },
  { href: '/novedades', label: 'Novedades', icon: '??' },
  { href: '/directorio', label: 'Directorio', icon: '??' },
  { href: '/perfil', label: 'Mi Perfil', icon: '??' },
];

const ADMIN_ITEMS = [
  { href: '/admin/usuarios', label: 'Usuarios', icon: '??' },
  { href: '/admin/documentos', label: 'Documentos', icon: '??' },
  { href: '/admin/analytics', label: 'Analytics', icon: '??' },
];

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const isAdmin = ['staff', 'admin'].includes(profile.role);

  return (
    <aside className="w-64 bg-[#060E1E] border-r border-white/5 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#003DA5] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">RE/MAX</p>
            <p className="text-[#003DA5] text-xs">Academia Parque</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-[#003DA5]/20 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}>
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-gray-600 text-xs uppercase tracking-wider px-3">Administraci�n</p>
            </div>
            {ADMIN_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  pathname.startsWith(item.href)
                    ? 'bg-[#003DA5]/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}>
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 bg-[#003DA5] rounded-full flex items-center justify-center text-white text-xs font-bold">
              {profile.full_name?.[0] ?? '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{profile.full_name ?? 'Agente'}</p>
            <p className="text-gray-500 text-xs capitalize">{profile.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
