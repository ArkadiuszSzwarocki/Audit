import { cookies } from 'next/headers';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-audit-app-12345');

export interface AuthSession {
  id: string;
  name: string;
  login: string;
  role: string;
  isZarzad: boolean;
  isAdmin: boolean;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (sessionToken) {
    try {
      const { payload } = await jose.jwtVerify(sessionToken, JWT_SECRET);
      const roleStr = String(payload.role || '').toUpperCase();
      const isZarzad = roleStr === 'ZARZAD' || roleStr === 'ZARZĄD' || roleStr === 'BOARD';
      const isAdmin = isZarzad || roleStr === 'ADMIN' || roleStr === 'ADMINISTRATOR';

      return {
        id: payload.id as string,
        name: payload.name as string,
        login: payload.login as string,
        role: payload.role as string,
        isZarzad,
        isAdmin,
      };
    } catch {
      // Token invalid or expired
    }
  }

  // Fallback check for legacy admin_session cookie
  const isAdminCookie = cookieStore.get('admin_session')?.value === 'true';
  if (isAdminCookie) {
    return {
      id: 'admin-fallback',
      name: 'Administrator',
      login: 'admin',
      role: 'ADMIN',
      isZarzad: false,
      isAdmin: true,
    };
  }

  return null;
}

export async function checkIsAdmin(): Promise<boolean> {
  const session = await getAuthSession();
  return session ? session.isAdmin : false;
}

export async function checkIsZarzad(): Promise<boolean> {
  const session = await getAuthSession();
  return session ? session.isZarzad : false;
}
