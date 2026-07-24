import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwtToken } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (sessionToken) {
    const payload = await verifyJwtToken(sessionToken);
    if (payload) {
      return NextResponse.json({ 
        isAdmin: payload.role === 'ADMIN' || payload.role === 'ZARZAD',
        user: { 
          id: payload.id as string, 
          name: payload.name as string, 
          login: (payload.login as string) || (payload.name as string) || 'admin',
          role: payload.role as string 
        }
      });
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
