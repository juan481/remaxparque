'use client';
import { useState } from 'react';
import { CheckCircle, XCircle, ChevronDown, User } from 'lucide-react';

interface Props {
  user: { id: string; full_name: string | null; avatar_url: string | null; created_at: string };
}

const PARQUE_OPTIONS = [
  { value: 'parque1', label: 'RE/MAX Parque 1' },
  { value: 'parque3', label: 'RE/MAX Parque 3' },
  { value: 'both', label: 'Ambos Parques' },
];
const ROLE_OPTIONS = [
  { value: 'agent', label: 'Agente' },
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
];

export default function AdminApproveUser({ user }: Props) {
  const [role, setRole] = useState('agent');
  const [parque, setParque] = useState('parque1');
  const [loading, setLoading] = useState<'approve'|'reject'|null>(null);
  const [done, setDone] = useState<'approved'|'rejected'|null>(null);

  async function approve() {
    setLoading('approve');
    await fetch('/api/admin/approve-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, role, parque }),
    });
    setLoading(null);
    setDone('approved');
  }

  if (done === 'approved') return (
    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
      <div>
        <p className="font-bold text-green-800">{user.full_name} aprobado</p>
        <p className="text-sm text-green-600">Como {ROLE_OPTIONS.find(r=>r.value===role)?.label} en {PARQUE_OPTIONS.find(p=>p.value===parque)?.label}</p>
      </div>
    </div>
  );

  if (done === 'rejected') return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
      <p className="font-bold text-red-800">Solicitud de {user.full_name} rechazada</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-wrap items-center gap-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-3 flex-1 min-w-48">
        {user.avatar_url
          ? <img src={user.avatar_url} alt="" className="w-11 h-11 rounded-full flex-shrink-0" />
          : <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{background:'#0C2749'}}>{user.full_name?.[0]??'?'}</div>
        }
        <div>
          <p className="font-bold" style={{color:'#0C2749'}}>{user.full_name ?? 'Sin nombre'}</p>
          <p className="text-xs text-gray-400">{new Date(user.created_at).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'})}</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <select value={role} onChange={e => setRole(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 text-sm font-semibold bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0043ff] cursor-pointer" style={{color:'#0C2749'}}>
            {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={parque} onChange={e => setParque(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 text-sm font-semibold bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0043ff] cursor-pointer" style={{color:'#0C2749'}}>
            {PARQUE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button onClick={approve} disabled={!!loading}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50"
          style={{background:'#059669'}}>
          <CheckCircle className="w-4 h-4" />
          {loading === 'approve' ? 'Aprobando...' : 'Aprobar'}
        </button>
        <button onClick={() => setDone('rejected')} disabled={!!loading}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl border-2 transition-all duration-200 hover:bg-red-50 active:scale-95 disabled:opacity-50"
          style={{borderColor:'#ff1200', color:'#ff1200'}}>
          <XCircle className="w-4 h-4" /> Rechazar
        </button>
      </div>
    </div>
  );
}