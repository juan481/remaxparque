'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users, FileText, BarChart3, LayoutDashboard, Newspaper,
  Calendar, BookOpen, Megaphone, Library, ImageIcon, Menu, X,
} from 'lucide-react';

const ALL_SECTIONS = [
  { href: '/admin',            label: 'Resumen',    icon: LayoutDashboard, exact: true,  adminOnly: false },
  { href: '/admin/usuarios',   label: 'Usuarios',   icon: Users,           exact: false, adminOnly: true  },
  { href: '/admin/cursos',     label: 'Academia',   icon: BookOpen,        exact: false, adminOnly: false },
  { href: '/admin/marketing',  label: 'Marketing',  icon: Megaphone,       exact: false, adminOnly: false },
  { href: '/admin/eventos',    label: 'Eventos',    icon: Calendar,        exact: false, adminOnly: false },
  { href: '/admin/documentos', label: 'Documentos', icon: FileText,        exact: false, adminOnly: false },
  { href: '/admin/novedades',  label: 'Novedades',  icon: Newspaper,       exact: false, adminOnly: false },
  { href: '/admin/biblioteca', label: 'Biblioteca', icon: Library,         exact: false, adminOnly: false },
  { href: '/admin/banner',     label: 'Banner',     icon: ImageIcon,       exact: false, adminOnly: false },
  { href: '/admin/analytics',  label: 'Analytics',  icon: BarChart3,       exact: false, adminOnly: true  },
];

interface Props { role: string }

export default function AdminNav({ role }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = role === 'admin';

  const SECTIONS = ALL_SECTIONS.filter(s => isAdmin || !s.adminOnly);

  return (
    <div style={{ background: '#fff1f1', borderBottom: '2px solid #fecaca' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Desktop xl+: single row */}
        <div className="hidden xl:flex items-center gap-0">
          {SECTIONS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={'flex items-center gap-1.5 px-3 py-3 text-xs font-bold whitespace-nowrap border-b-2 -mb-px transition-all duration-200 ' + (
                  active
                    ? 'border-[#ff1200] text-[#ff1200]'
                    : 'border-transparent text-gray-500 hover:text-[#ff1200] hover:bg-red-50/60'
                )}>
                <Icon className={'w-3.5 h-3.5 ' + (active ? 'text-[#ff1200]' : 'text-gray-400')} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Mobile/tablet */}
        <div className="xl:hidden">
          <button onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 py-3 text-sm font-bold text-red-700 w-full">
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            {open ? 'Cerrar menú' : 'Secciones del admin'}
          </button>
          {open && (
            <div className="grid grid-cols-5 gap-1 pb-3">
              {SECTIONS.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link key={href} href={href} onClick={() => setOpen(false)}
                    className={'flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-center transition-all ' + (
                      active ? 'bg-red-100' : 'hover:bg-red-50'
                    )}>
                    <Icon className={'w-5 h-5 ' + (active ? 'text-[#ff1200]' : 'text-gray-400')} />
                    <span className={'text-[10px] font-bold leading-tight ' + (active ? 'text-[#ff1200]' : 'text-gray-500')}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
