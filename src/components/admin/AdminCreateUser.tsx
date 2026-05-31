'use client';
import { useState, useRef } from 'react';
import { X, Eye, EyeOff, UserPlus, RefreshCw, Trash2, ChevronDown, Pencil, Camera } from 'lucide-react';
import { createUser, resetUserPassword, deleteUser, changeUserRole, updateUserProfile } from '@/app/(admin)/admin/_actions/users';
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

// ── Change Role Inline ────────────────────────────────────────
export function ChangeRoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole);
  const [busy, setBusy] = useState(false);

  async function handleChange(newRole: string) {
    if (newRole === role) return;
    setBusy(true);
    setRole(newRole);
    await changeUserRole(userId, newRole);
    setBusy(false);
  }

  const colors: Record<string, string> = { agent: '#0043ff', staff: '#7C3AED', admin: '#ff1200' };
  const labels: Record<string, string> = { agent: 'Agente', staff: 'Staff', admin: 'Admin' };

  return (
    <div className="relative inline-flex items-center gap-1">
      <select
        value={role}
        onChange={e => handleChange(e.target.value)}
        disabled={busy}
        className="appearance-none pl-2.5 pr-7 py-1.5 text-xs font-bold rounded-lg border-0 cursor-pointer disabled:opacity-60 focus:outline-none"
        style={{ background: (colors[role] ?? '#9CA3AF') + '18', color: colors[role] ?? '#9CA3AF' }}>
        <option value="agent">Agente</option>
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
      </select>
      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: colors[role] ?? '#9CA3AF' }} />
    </div>
  );
}

// ── Edit User Profile (admin only) ────────────────────────────
type EditableUser = {
  id: string; full_name: string | null; avatar_url: string | null;
  email: string | null; phone: string | null; department: string | null;
  role: string; parque: string | null;
};

export function EditUserButton({ user }: { user: EditableUser }) {
  const [open, setOpen]     = useState(false);
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(user.avatar_url);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function close() { setOpen(false); setErr(null); }

  async function handleAvatar(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('userId', user.id);
    const res = await fetch('/api/admin/staff/upload-avatar', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.url) setPreview(data.url);
    else setErr(data.error ?? 'Error al subir imagen');
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const fd = new FormData(e.currentTarget);
    if (preview && preview !== user.avatar_url) fd.set('avatar_url', preview);
    const result = await updateUserProfile(user.id, fd);
    setBusy(false);
    if ('error' in result) { setErr(result.error); return; }
    close();
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
        style={{ background: '#EFF6FF', color: '#0043ff' }}>
        <Pencil className="w-3.5 h-3.5" />
      </button>

      <AdminModal title={`Editar — ${user.full_name ?? 'Usuario'}`} open={open} onClose={close}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-gray-100">
            <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
              {preview ? (
                <img src={preview} alt="" className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100"
                  style={{ objectPosition: 'center top' }} />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black ring-4 ring-gray-100"
                  style={{ background: 'linear-gradient(135deg,#0C2749,#0043ff)' }}>
                  {user.full_name?.[0] ?? '?'}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading
                  ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Camera className="w-5 h-5 text-white" />
                }
              </div>
            </div>
            <p className="text-xs text-gray-400">Clic para cambiar foto · JPG/PNG/WebP · máx 3 MB</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatar(f); }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={lbl}>Nombre completo</label>
              <input name="full_name" required defaultValue={user.full_name ?? ''} className={inp} />
            </div>
            <div>
              <label className={lbl}>Cargo / Departamento</label>
              <input name="department" defaultValue={user.department ?? ''} className={inp} placeholder="Ej: Broker, Coordinadora..." />
            </div>
            <div>
              <label className={lbl}>Teléfono</label>
              <input name="phone" defaultValue={user.phone ?? ''} className={inp} placeholder="+54 9 11 ..." />
            </div>
            <div>
              <label className={lbl}>Rol</label>
              <div className="relative">
                <select name="role" defaultValue={user.role} className={sel}>
                  {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={lbl}>Parque</label>
              <div className="relative">
                <select name="parque" defaultValue={user.parque ?? 'parque1'} className={sel}>
                  {PARQUE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {err && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{err}</p>}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={close} className="px-5 py-2.5 text-sm font-bold rounded-xl text-gray-500 hover:bg-gray-100">Cancelar</button>
            <button type="submit" disabled={busy}
              className="px-6 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#0043ff,#0C2749)' }}>
              {busy ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  );
}
