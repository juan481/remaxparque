'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, FileText, BarChart3, LayoutDashboard, Newspaper, Calendar, BookOpen, Megaphone, Library } from 'lucide-react';

const SECTIONS = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard, exact: true },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users, exact: false },
  { href: '/admin/documentos', label: 'Documentos', icon: FileText, exact: false },
  { href: '/admin/novedades', label: 'Novedades', icon: Newspaper, exact: false },
  { href: '/admin/eventos', label: 'Eventos', icon: Calendar, exact: false },
  { href: '/admin/cursos', label: 'Academia', icon: BookOpen, exact: false },
  { href: '/admin/biblioteca', label: 'Biblioteca', icon: Library, exact: false },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone, exact: false },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <div style={{background:'#fff1f1', borderBottom:'2px solid #fecaca'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto">
        {SECTIONS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={"flex items-center gap-1.5 px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 -mb-px transition-all duration-200 " + (
                active ? 'border-[#ff1200] text-[#ff1200]' : 'border-transparent text-gray-500 hover:text-[#ff1200] hover:bg-red-50/60'
              )}>
              <Icon className={"w-4 h-4 " + (active ? 'text-[#ff1200]' : 'text-gray-400')} />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
