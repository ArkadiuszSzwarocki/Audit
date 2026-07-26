import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'audit-app-secure-jwt-secret-key-2026-firmowa-siec'
);

const PUBLIC_API_PATHS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/check',
  '/api/system-info',
];

const PUBLIC_PAGE_PATHS = [
  '/logowanie',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read session cookie
  const sessionToken = request.cookies.get('session_token')?.value;
  const legacyAdminSession = request.cookies.get('admin_session')?.value;

  let sessionPayload: jose.JWTPayload | null = null;

  if (sessionToken) {
    try {
      const { payload } = await jose.jwtVerify(sessionToken, JWT_SECRET);
      sessionPayload = payload;
    } catch {
      // Invalid/expired token
    }
  } else if (legacyAdminSession === 'true') {
    sessionPayload = {
      id: 'admin-fallback',
      name: 'Administrator',
      login: 'admin',
      role: 'ADMIN',
    };
  }

  const isAuthenticated = !!sessionPayload;

  // 1. Handle API routes
  if (pathname.startsWith('/api/')) {
    const isPublicApi = PUBLIC_API_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`));

    if (!isPublicApi && !isAuthenticated) {
      return NextResponse.json(
        { error: 'Brak autoryzacji. Zaloguj się, aby uzyskać dostęp do API.' },
        { status: 401 }
      );
    }

    if (isAuthenticated && sessionPayload) {
      const roleStr = String(sessionPayload.role || '').toUpperCase();
      const isAdmin = roleStr === 'ADMIN' || roleStr === 'ADMINISTRATOR' || roleStr === 'ZARZAD' || roleStr === 'ZARZĄD' || roleStr === 'BOARD';

      const isUserMutation = pathname.startsWith('/api/users') && request.method !== 'GET';
      const isAdminOnlyApi =
        isUserMutation ||
        pathname.startsWith('/api/roles') ||
        pathname.startsWith('/api/admin');

      if (isAdminOnlyApi && !isAdmin) {
        return NextResponse.json(
          { error: 'Brak wystarczających uprawnień (wymagana rola Administrator lub Zarząd).' },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  }

  // 2. Handle Page routes
  const isPublicPage = PUBLIC_PAGE_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`));

  if (!isAuthenticated && !isPublicPage) {
    const loginUrl = new URL('/logowanie', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && pathname === '/logowanie') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const middleware = proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
