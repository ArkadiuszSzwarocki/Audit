import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-audit-app-12345');

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (sessionToken) {
    try {
      const { payload } = await jose.jwtVerify(sessionToken, JWT_SECRET);
      return NextResponse.json({ 
        isAdmin: payload.role === 'ADMIN',
        user: { 
          id: payload.id as string, 
          name: payload.name as string, 
          login: (payload.login as string) || (payload.name as string) || 'admin',
          role: payload.role as string 
        }
      });
    } catch (e) {
      // Invalid token
    }
  }

  // Fallback to old admin_session check for backward compatibility
  const isAdmin = cookieStore.get('admin_session')?.value === 'true';
  if (isAdmin) {
    return NextResponse.json({
      isAdmin: true,
      user: { id: 'admin-fallback', name: 'Administrator', login: 'admin', role: 'ADMIN' }
    });
  }

  return NextResponse.json({ 
    isAdmin: false, 
    user: { id: 'operator-guest', name: 'Operator Produkcji', login: 'operator', role: 'OPERATOR' } 
  });
}
