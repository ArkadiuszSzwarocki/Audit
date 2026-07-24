import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/config/db';
import { verifyJwtToken } from '@/lib/auth';

async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (sessionToken) {
    const payload = await verifyJwtToken(sessionToken);
    if (payload) {
      return {
        id: payload.id as string,
        name: payload.name as string,
        login: (payload.login as string) || (payload.name as string) || 'admin',
      };
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Niezalogowany' }, { status: 401 });
    }

    const { threshold } = await request.json();

    if (typeof threshold !== 'number') {
      return NextResponse.json({ error: 'Nieprawidłowy progi powiadomienia' }, { status: 400 });
    }

    await prisma.user.updateMany({
      where: {
        OR: [
          { id: user.id },
          { login: user.login },
        ]
      },
      data: {
        dismissedBhpNoticeThreshold: threshold,
      }
    });

    return NextResponse.json({ success: true, dismissedThreshold: threshold });
  } catch (error: any) {
    console.error('POST /api/user-profile/bhp-dismiss Error:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
