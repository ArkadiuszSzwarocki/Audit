import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/config/db';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-audit-app-12345');

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json();

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
      const alg = 'HS256';
      const jwt = await new jose.SignJWT({ id: user.id, name: user.name, login: user.login, role: user.role })
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);

      const cookieStore = await cookies();
      cookieStore.set('session_token', jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      // Zachowaj stare ciasteczko dla kompatybilności na wypadek gdyby było używane w Navbarze bezpośrednio
      if (user.role === 'ADMIN') {
        cookieStore.set('admin_session', 'true', {
          httpOnly: true,
          path: '/',
          maxAge: 60 * 60 * 24 * 7 // 1 week
        });
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
