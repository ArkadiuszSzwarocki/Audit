import { cookies } from 'next/headers';
import * as jose from 'jose';

export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'audit-app-secure-jwt-secret-key-2026-firmowa-siec'
);

export interface AuthSession {
  id: string;
  name: string;
  login: string;
  role: string;
  isZarzad: boolean;
  isAdmin: boolean;
  isKaizenCommittee: boolean;
}

export async function verifyJwtToken(token: string): Promise<jose.JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function signJwtToken(payload: Record<string, any>, expiresIn: string = '7d'): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  const adminSessionCookie = cookieStore.get('admin_session')?.value;
  
  console.log('DEBUG - getAuthSession() - sessionToken:', !!sessionToken);
  console.log('DEBUG - getAuthSession() - admin_session cookie value:', adminSessionCookie);

  if (sessionToken) {
    const payload = await verifyJwtToken(sessionToken);
    if (payload) {
      console.log('DEBUG - getAuthSession() - JWT Payload ID:', payload.id);
      const roleStr = String(payload.role || '').toUpperCase();
      const isZarzad = roleStr === 'ZARZAD' || roleStr === 'ZARZĄD' || roleStr === 'BOARD';
      const isAdmin = isZarzad || roleStr === 'ADMIN' || roleStr === 'ADMINISTRATOR';
      const isKaizenCommittee = isAdmin || roleStr === 'KOMISJA KAIZEN' || roleStr === 'KOMISJA_KAIZEN' || roleStr === 'KAIZEN_COMMITTEE';

      console.log('DEBUG - getAuthSession() - Returning session from JWT');
      return {
        id: payload.id as string,
        name: payload.name as string,
        login: payload.login as string,
        role: payload.role as string,
        isZarzad,
        isAdmin,
        isKaizenCommittee,
      };
    }
  }

  // Fallback check for legacy admin_session cookie
  const isAdminCookie = adminSessionCookie === 'true';
  console.log('DEBUG - getAuthSession() - isAdminCookie check:', isAdminCookie);
  if (isAdminCookie) {
    // Return admin user ID directly (hardcoded from database)
    console.log('DEBUG - getAuthSession() - Returning admin fallback session');
    return {
      id: '3c704b95-0006-425c-8f7c-4638723f55a0',
      name: 'Administrator',
      login: 'admin',
      role: 'ADMIN',
      isZarzad: false,
      isAdmin: true,
      isKaizenCommittee: true,
    };
  }

  console.log('DEBUG - getAuthSession() - No session, returning null');
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

export async function checkIsKaizenCommittee(): Promise<boolean> {
  const session = await getAuthSession();
  return session ? session.isKaizenCommittee : false;
}

export async function getAuth(req: any): Promise<AuthSession | null> {
  // Extract token from Authorization header or cookies
  const authHeader = req.headers.get('authorization');
  let token: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    // Try to get from cookies in request
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc: any, cookie: string) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {});
      token = cookies.session_token;
    }
  }

  if (token) {
    const payload = await verifyJwtToken(token);
    if (payload) {
      const roleStr = String(payload.role || '').toUpperCase();
      const isZarzad = roleStr === 'ZARZAD' || roleStr === 'ZARZĄD' || roleStr === 'BOARD';
      const isAdmin = isZarzad || roleStr === 'ADMIN' || roleStr === 'ADMINISTRATOR';
      const isKaizenCommittee = isAdmin || roleStr === 'KOMISJA KAIZEN' || roleStr === 'KOMISJA_KAIZEN' || roleStr === 'KAIZEN_COMMITTEE';

      return {
        id: payload.id as string,
        name: payload.name as string,
        login: payload.login as string,
        role: payload.role as string,
        isZarzad,
        isAdmin,
        isKaizenCommittee,
      };
    }
  }

  return null;
}
