export const ROLES = ['pending', 'agent', 'staff', 'admin'] as const;
export type Role = typeof ROLES[number];

export const PARQUES = ['parque1', 'parque3', 'both'] as const;
export type Parque = typeof PARQUES[number];

export function canAccess(role: Role, module: string, action: string = 'read'): boolean {
  const perms: Record<Role, Record<string, string[]>> = {
    pending: {},
    agent: { legales: ['read'], academia: ['read'], marketing: ['read'], eventos: ['read', 'enroll'], novedades: ['read'] },
    staff: { legales: ['read'], academia: ['read', 'write'], marketing: ['read', 'write'], eventos: ['read', 'write'], novedades: ['read', 'write'], analytics: ['read'], admin: ['read'] },
    admin: { legales: ['read', 'write', 'delete'], academia: ['read', 'write', 'delete'], marketing: ['read', 'write', 'delete'], eventos: ['read', 'write', 'delete'], novedades: ['read', 'write', 'delete'], analytics: ['read'], admin: ['read', 'write'] },
  };
  return perms[role]?.[module]?.includes(action) ?? false;
}

export function isAdmin(role: Role): boolean {
  return role === 'admin' || role === 'staff';
}
