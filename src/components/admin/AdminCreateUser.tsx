'use client';
import { useState } from 'react';
import { X, Eye, EyeOff, UserPlus, RefreshCw, Trash2, ChevronDown } from 'lucide-react';
import { createUser, resetUserPassword, deleteUser } from '@/app/(admin)/admin/_actions/users';
import AdminModal from './AdminModal';

const PARQUE_OPTIONS = [
  { value: 'parque1', label: 'RE/MAX Parque 1' },
  { value: 'parque3', label: 'RE/MAX Parque 3' },
  { value: 'both', label: 'Ambos Parques' },
];
const ROLE_OPTIONS = [
  { value: 'agent', label: 'Agente' },
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin (Broker)' },
];

const inp = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const lbl = 'block text-sm font-bold text-gray-700 mb-1.5';
const sel = 'appearance-none w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer';

// ── Create User Modal ──────────────────────────────────────────
export function CreateUserButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function close() { setOpen(false); setErr(null); setDone(false); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const result = await createUser(new FormData(e.currentTarget));
    setBusy(false);
    if ('error' in result) { setErr(result.error); return; }
    setDone(true);
    setTimeout(close, 1500);
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-2xl shadow hover:opacity-90 active:scale-95 transition-all"
        style={{ background: 'linear-gradient(135deg,#0043ff,#0C2749)' }}>
        <UserPlus className="w-4 h-4" /> Crear usuario
      </button>

      <AdminModal title="Nuevo usuario" open={open} onClose={close}>
        {done ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#ECFDF5' }}>
              <UserPlus className="w-8 h-8" style={{ color: '#059669' }} />
            </div>
            <p className="font-black text-lg" style={{ color: '#0C2749' }}>Usuario creado</p>
            <p className="text-sm text-gray-400 mt-1">Se le pedirá cambiar la contraseña al iniciar sesión.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={lbl}>Nombre completo <span className="text-red-500">*</span></label>
              <input name="full_name" required className={inp} placeholder="Ej: Juan Pérez" />
            </div>
            <div>
              <label className={lbl}>Email <span className="text-red-500">*</span></label>
              <input name="email" type="email" required className={inp} placeholder="juan@remax.com.ar" />
            </div>
            <div>
              <label className={lbl}>Contraseña temporal <span className="text-red-500">*</span></label>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'} required minLength={8}
                  className={inp + ' pr-10'} placeholder="Mínimo 8 caracteres" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">El usuario deberá cambiarla al iniciar sesión por primera vez.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Rol</label>
                <div className="relative">
                  <select name="role" defaultValue="agent" className={sel}>
                    {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={lbl}>Parque</label>
                <div className="relative">
                  <select name="parque" defaultValue="parque1" className={sel}>
                    {PARQUE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            {err && <p className="text-sm text-red-600 font-medium bg-red-50 px-4 py-2.5 rounded-xl">{err}</p>}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={close} className="px-5 py-2.5 text-sm font-bold rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
              <button type="submit" disabled={busy}
                className="px-6 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#0043ff,#0C2749)' }}>
                {busy ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        )}
      </AdminModal>
    </>
  );
}

// ── Reset Password Button (inline in user row) ────────────────
export function ResetPasswordButton({ userId, userName, userEmail }: { userId: string; userName: string; userEmail: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState('');

  function close() { setOpen(false); setErr(null); setDone(false); setPassword(''); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const result = await resetUserPassword(userId, password, userEmail, userName);
    setBusy(false);
    if ('error' in result) { setErr(result.error); return; }
    setDone(true);
    setTimeout(close, 1200);
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
        style={{ background: '#FFFBEB', color: '#D97706' }}>
        <RefreshCw className="w-3.5 h-3.5" /> Reiniciar
      </button>

      <AdminModal title={`Reset contraseña — ${userName}`} open={open} onClose={close}>
        {done ? (
          <div className="text-center py-6">
            <p className="font-bold text-green-700">¡Contraseña actualizada!</p>
            <p className="text-sm text-gray-400 mt-1">El usuario deberá cambiarla al iniciar sesión.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={lbl}>Nueva contraseña temporal <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required minLength={8}
                  value={password} onChange={e => setPassword(e.target.value)}
                  className={inp + ' pr-10'} placeholder="Mínimo 8 caracteres" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {err && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{err}</p>}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={close} className="px-5 py-2.5 text-sm font-bold rounded-xl text-gray-500 hover:bg-gray-100">Cancelar</button>
              <button type="submit" disabled={busy}
                className="px-5 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-60"
                style={{ background: '#D97706' }}>
                {busy ? 'Guardando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </form>
        )}
      </AdminModal>
    </>
  );
}

// ── Delete User Button ────────────────────────────────────────
export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true); setErr(null);
    const result = await deleteUser(userId);
    setBusy(false);
    if ('error' in result) { setErr(result.error); return; }
    setOpen(false);
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
        style={{ background: '#FFF1F2', color: '#ff1200' }}>
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <AdminModal title="Eliminar usuario" open={open} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Eliminar a <span className="font-bold" style={{ color: '#0C2749' }}>{userName}</span>?
            Esta acción no se puede deshacer.
          </p>
          {err && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{err}</p>}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => setOpen(false)} className="px-5 py-2.5 text-sm font-bold rounded-xl text-gray-500 hover:bg-gray-100">Cancelar</button>
            <button onClick={handleDelete} disabled={busy}
              className="px-5 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-60"
              style={{ background: '#ff1200' }}>
              {busy ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </AdminModal>
    </>
  );
}
