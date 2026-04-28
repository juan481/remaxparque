'use client';
import { useState } from 'react';
import type { Profile } from '@/types/database';

const PARQUES = [
  { value: 'parque1', label: 'Parque 1' },
  { value: 'parque3', label: 'Parque 3' },
  { value: 'both', label: 'Ambos' },
];
const ROLES = ['agent', 'staff', 'admin'];

export default function UserTable({ users, showApproval = false }: { users: Profile[]; showApproval?: boolean }) {
  const [processing, setProcessing] = useState<string | null>(null);

  async function approveUser(userId: string, parque: string, role: string) {
    setProcessing(userId);
    await fetch('/api/admin/approve-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, parque, role }),
    });
    window.location.reload();
  }

  if (users.length === 0) {
    return <p className="text-gray-500 text-sm py-4">No hay usuarios en este estado.</p>;
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left text-gray-400 font-medium px-4 py-3">Usuario</th>
            <th className="text-left text-gray-400 font-medium px-4 py-3">Parque</th>
            <th className="text-left text-gray-400 font-medium px-4 py-3">Rol</th>
            <th className="text-left text-gray-400 font-medium px-4 py-3">Registro</th>
            {showApproval && <th className="px-4 py-3"></th>}
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <UserRow key={user.id} user={user} showApproval={showApproval} processing={processing} onApprove={approveUser} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserRow({ user, showApproval, processing, onApprove }: {
  user: Profile;
  showApproval: boolean;
  processing: string | null;
  onApprove: (id: string, parque: string, role: string) => void;
}) {
  const [parque, setParque] = useState('parque1');
  const [role, setRole] = useState('agent');

  return (
    <tr className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <img src={user.avatar_url} className="w-8 h-8 rounded-full" alt="" />
          ) : (
            <div className="w-8 h-8 bg-[#003DA5] rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user.full_name?.[0] ?? '?'}
            </div>
          )}
          <span className="text-white">{user.full_name ?? 'Sin nombre'}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-300 capitalize">{user.parque ?? '�'}</td>
      <td className="px-4 py-3">
        <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {new Date(user.created_at).toLocaleDateString('es-AR')}
      </td>
      {showApproval && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <select value={parque} onChange={e => setParque(e.target.value)}
              className="bg-[#0A1628] border border-white/10 text-gray-300 rounded px-2 py-1 text-xs">
              {PARQUES.map(p => <option key={p.value} value={p.value} className="bg-[#0A1628]">{p.label}</option>)}
            </select>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="bg-[#0A1628] border border-white/10 text-gray-300 rounded px-2 py-1 text-xs">
              {ROLES.map(r => <option key={r} value={r} className="bg-[#0A1628]">{r}</option>)}
            </select>
            <button onClick={() => onApprove(user.id, parque, role)}
              disabled={processing === user.id}
              className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1 rounded transition-colors disabled:opacity-60">
              {processing === user.id ? '...' : 'Aprobar'}
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}
