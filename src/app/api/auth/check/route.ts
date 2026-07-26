import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwtToken } from '@/lib/auth';
import { prisma } from '@/config/db';

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (sessionToken) {
    const payload = await verifyJwtToken(sessionToken);
    if (payload) {
      let currentRole = payload.role as string;
      let userName = payload.name as string;
      let userLogin = (payload.login as string) || (payload.name as string) || 'admin';

      let userIsKaizenCommittee = false;

      let userNotifyBhp = false;
      let userNotifyQuality = false;

      try {
        if (payload.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: payload.id as string },
            select: {
              id: true,
              role: true,
              name: true,
              login: true,
              isKaizenCommittee: true,
              notifyBhp: true,
              notifyQuality: true,
              notifyFaults: true,
              notifyKaizen: true,
              notifyAudits: true,
            }
          });
          if (dbUser) {
            currentRole = dbUser.role;
            userName = dbUser.name;
            userLogin = dbUser.login;
            userIsKaizenCommittee = Boolean(dbUser.isKaizenCommittee);
            userNotifyBhp = Boolean(dbUser.notifyBhp);
            userNotifyQuality = Boolean(dbUser.notifyQuality);
          }
        }
      } catch (err) {
        console.error('Error fetching live role in /api/auth/check:', err);
      }

      const roleStr = String(currentRole || '').toUpperCase();
      const isAdmin = roleStr === 'ADMIN' || roleStr === 'ADMINISTRATOR' || roleStr === 'ZARZAD' || roleStr === 'ZARZĄD' || roleStr === 'BOARD';
      const isKaizenCommittee = isAdmin || userIsKaizenCommittee || roleStr === 'KOMISJA KAIZEN' || roleStr === 'KOMISJA_KAIZEN' || roleStr === 'KAIZEN_COMMITTEE';

      return NextResponse.json({ 
        isAdmin,
        isKaizenCommittee,
        user: { 
          id: payload.id as string, 
          name: userName, 
          login: userLogin,
          role: currentRole,
          isKaizenCommittee: userIsKaizenCommittee,
          notifyBhp: userNotifyBhp,
          notifyQuality: userNotifyQuality,
        }
      });
    }
  }

  // Fallback to old admin_session check for backward compatibility
  const isAdmin = cookieStore.get('admin_session')?.value === 'true';
  if (isAdmin) {
    return NextResponse.json({
      isAdmin: true,
      isKaizenCommittee: true,
      user: { id: 'admin-fallback', name: 'Administrator', login: 'admin', role: 'ADMIN' }
    });
  }

  return NextResponse.json({ 
    isAdmin: false, 
    isKaizenCommittee: false,
    user: { id: 'operator-guest', name: 'Operator Produkcji', login: 'operator', role: 'OPERATOR' } 
  });
}
