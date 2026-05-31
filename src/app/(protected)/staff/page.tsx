import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone } from 'lucide-react';

type StaffMember = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  department: string | null;
  email: string | null;
  phone: string | null;
  parque: string | null;
};

const roleLabel: Record<string, string> = { admin: 'Broker', staff: 'Staff' };
const roleColor: Record<string, string> = { admin: '#ff1200', staff: '#0043ff' };
const roleBg:    Record<string, string> = { admin: '#FFF1F0', staff: '#EFF6FF' };

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ parque?: string }>;
}) {
  const { parque } = await searchParams;
  const parqueKey = parque === 'parque3' ? 'parque3' : 'parque1';
  const parqueLabel = parqueKey === 'parque1' ? 'RE/MAX Parque 1' : 'RE/MAX Parque 3';
  const parqueColor = parqueKey === 'parque1' ? '#0043ff' : '#ff1200';
  const parqueBg    = parqueKey === 'parque1' ? '#EFF6FF' : '#FFF1F0';

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: members } = await admin
    .from('profiles')
    .select('id, full_name, avatar_url, role, department, email, phone, parque')
    .in('role', ['staff', 'admin'])
    .in('parque', [parqueKey, 'both'])
    .order('role', { ascending: true }) // admin (broker) first
    .order('full_name', { ascending: true });

  const staff: StaffMember[] = members ?? [];

  return (
    <div>
      {/* Back nav */}
      <Link href="/directorio"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Mi Oficina
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{background: parqueBg}}>
          <div className="w-5 h-5 rounded-full" style={{background: parqueColor}} />
        </div>
        <div>
          <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>{parqueLabel}</h1>
          <p className="text-gray-500 mt-0.5">
            {staff.length} integrante{staff.length !== 1 ? 's' : ''} del equipo
          </p>
        </div>
      </div>

      {staff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <p className="text-gray-400">No hay staff cargado para este parque todavía.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map(member => {
            const isBroker = member.role === 'admin';
            const color  = roleColor[member.role] ?? '#0043ff';
            const bg     = roleBg[member.role]    ?? '#EFF6FF';
            const label  = roleLabel[member.role]  ?? member.role;

            return (
              <div key={member.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200">
                {/* Card top band */}
                <div className="h-16 relative" style={{background: `linear-gradient(135deg, ${color}22, ${color}08)`}}>
                  <div className="absolute inset-x-0 bottom-0 h-8"
                    style={{background: 'linear-gradient(to bottom, transparent, white)'}} />
                </div>

                {/* Avatar */}
                <div className="flex flex-col items-center -mt-10 px-6 pb-6">
                  <div className="relative mb-4">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.full_name ?? ''}
                        className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-md"
                        style={{objectPosition: 'center top'}}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full ring-4 ring-white shadow-md flex items-center justify-center text-white text-2xl font-black"
                        style={{background: `linear-gradient(135deg, #0C2749, ${color})`}}>
                        {member.full_name?.[0] ?? '?'}
                      </div>
                    )}
                    {/* Role badge */}
                    <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black border-2 border-white"
                      style={{background: bg, color}}>
                      {label}
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="text-base font-black text-center leading-tight mb-0.5"
                    style={{color: '#0C2749'}}>
                    {member.full_name ?? 'Sin nombre'}
                  </h3>

                  {/* Department */}
                  {member.department && (
                    <p className="text-xs text-gray-400 text-center mb-4">{member.department}</p>
                  )}
                  {!member.department && <div className="mb-4" />}

                  {/* Contact info */}
                  <div className="w-full space-y-2">
                    {member.email && (
                      <a href={`mailto:${member.email}`}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm hover:opacity-80 transition-opacity"
                        style={{background: '#F8FAFC'}}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{background: bg}}>
                          <Mail className="w-3.5 h-3.5" style={{color}} />
                        </div>
                        <span className="text-gray-600 truncate font-medium text-xs">{member.email}</span>
                      </a>
                    )}
                    {member.phone && (
                      <a href={`https://wa.me/${member.phone.replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm hover:opacity-80 transition-opacity"
                        style={{background: '#F8FAFC'}}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{background: '#ECFDF5'}}>
                          <Phone className="w-3.5 h-3.5" style={{color: '#059669'}} />
                        </div>
                        <span className="text-gray-600 font-medium text-xs">{member.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
