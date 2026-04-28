'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types/database';
import { ChevronDown, LogOut, User, MapPin, Shield, Menu, X } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/academia', label: 'Academia' },
  { href: '/marketing', label: 'Marketing' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/legales', label: 'Legales' },
  { href: '/novedades', label: 'Novedades' },
  { href: '/directorio', label: 'Mi Oficina' },
];

export default function NavBar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = ['staff', 'admin'].includes(profile.role);
  const parqueLabel = profile.parque === 'parque1' ? 'Parque 1' : profile.parque === 'parque3' ? 'Parque 3' : 'Ambos Parques';
  const firstName = profile.full_name?.split(' ')[0] ?? 'Agente';

  useEffect(() => { setMobileOpen(false); setProfileOpen(false); }, [pathname]);

  return (
    <header className="sticky top-0 z-50 shadow-lg">
      <div style={{background:'#0C2749'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <img
              src="/logo-remax.png"
              alt="RE/MAX Parque"
              className="h-9 w-auto object-contain"
              onError={(e) => {
                const t = e.currentTarget;
                t.style.display = 'none';
                const fallback = t.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="hidden" style={{display:'none'}}>
              <div className="relative w-9 h-9 flex">
                <div className="absolute inset-0 flex rounded-full overflow-hidden shadow-md">
                  <div className="w-1/2" style={{background:'#ff1200'}} />
                  <div className="w-1/2" style={{background:'#0043ff'}} />
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-2.5 bg-white rounded-b" />
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-black text-sm tracking-wider leading-none">ACADEMIA</div>
              <div className="text-blue-300 text-xs font-medium leading-none mt-0.5">RE/MAX Parque</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20">
              <MapPin className="w-3.5 h-3.5" style={{color:'#A3D4F2'}} />
              <span className="text-sm font-medium" style={{color:'#A3D4F2'}}>{parqueLabel}</span>
            </div>

            <div className="relative hidden md:block">
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 text-white px-3 py-2 rounded-full transition-all duration-200 hover:bg-white/15 active:scale-95">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full ring-2 ring-white/40" />
                  : <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{background:'#ff1200'}}>{profile.full_name?.[0]??'U'}</div>
                }
                <span className="font-semibold text-sm">{firstName}</span>
                <ChevronDown className={cn('w-4 h-4 opacity-70 transition-transform duration-200', profileOpen && 'rotate-180')} />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-slide-down">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center gap-3">
                        {profile.avatar_url
                          ? <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                          : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{background:'#0C2749'}}>{profile.full_name?.[0]??'U'}</div>
                        }
                        <div>
                          <p className="font-bold text-sm" style={{color:'#0C2749'}}>{profile.full_name}</p>
                          <p className="text-xs text-gray-400 capitalize mt-0.5">{profile.role} &middot; {parqueLabel}</p>
                        </div>
                      </div>
                    </div>
                    <Link href="/perfil" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-5 py-3.5 text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0043ff] transition-colors duration-150">
                      <User className="w-5 h-5" /> Mi Perfil
                    </Link>
                    <form action="/api/auth/signout" method="post">
                      <button type="submit" className="w-full flex items-center gap-3 px-5 py-3.5 text-base font-medium hover:bg-red-50 transition-colors duration-150" style={{color:'#ff1200'}}>
                        <LogOut className="w-5 h-5" /> Cerrar sesi&#243;n
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>

            <button onClick={() => { setMobileOpen(!mobileOpen); setProfileOpen(false); }}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-white/15 transition-colors duration-200 active:scale-95">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <nav className="hidden md:block bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center overflow-x-auto">
          {NAV.map(({ href, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
            return (
              <Link key={href} href={href}
                className={cn(
                  'px-4 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-200',
                  active ? 'border-[#0043ff] text-[#0043ff]' : 'border-transparent text-gray-500 hover:text-[#0C2749] hover:border-gray-300'
                )}>
                {label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link href="/admin" className={cn(
              'ml-auto flex-shrink-0 flex items-center gap-1.5 px-4 py-4 text-sm font-semibold border-b-2 transition-all duration-200',
              pathname.startsWith('/admin') ? 'border-[#ff1200] text-[#ff1200]' : 'border-transparent text-gray-500 hover:text-[#ff1200]'
            )}>
              <Shield className="w-4 h-4" /> Admin
            </Link>
          )}
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden bg-white border-b-2 border-gray-100 shadow-xl animate-slide-down">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3 px-4 py-3 mb-3 rounded-xl bg-gray-50">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{background:'#0C2749'}}>{profile.full_name?.[0]??'U'}</div>
              }
              <div>
                <p className="font-bold text-sm" style={{color:'#0C2749'}}>{profile.full_name}</p>
                <p className="text-xs text-gray-400 capitalize">{profile.role} &middot; {parqueLabel}</p>
              </div>
            </div>
            <div className="space-y-1">
              {NAV.map(({ href, label }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
                return (
                  <Link key={href} href={href}
                    className={cn('px-4 py-3 rounded-xl text-base font-semibold transition-all duration-150 block',
                      active ? 'bg-blue-50 text-[#0043ff]' : 'text-gray-600 hover:bg-gray-50 hover:text-[#0043ff]')}>
                    {label}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link href="/admin"
                  className={cn('flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-150',
                    pathname.startsWith('/admin') ? 'bg-red-50 text-[#ff1200]' : 'text-gray-600 hover:bg-red-50 hover:text-[#ff1200]')}>
                  <Shield className="w-5 h-5" /> Admin
                </Link>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <form action="/api/auth/signout" method="post">
                <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium hover:bg-red-50 transition-colors duration-150" style={{color:'#ff1200'}}>
                  <LogOut className="w-5 h-5" /> Cerrar sesi&#243;n
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
