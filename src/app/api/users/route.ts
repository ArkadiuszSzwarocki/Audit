import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-audit-app-12345');

async function checkIsAdmin() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  if (!sessionToken) return false;
  try {
    const { payload } = await jose.jwtVerify(sessionToken, JWT_SECRET);
    return payload.role === 'ADMIN';
  } catch {
    return false;
  }
}

export async function GET() {
  if (!await checkIsAdmin()) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, login: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  if (!await checkIsAdmin()) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
  }

  try {
    const { login, name, password, role } = await request.json();
    
    if (!login || !name || !password) {
      return NextResponse.json({ error: 'Wypełnij wszystkie wymagane pola' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { login } });
    if (existingUser) {
      return NextResponse.json({ error: 'Użytkownik z takim loginem już istnieje' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        login,
        name,
        passwordHash,
        role: role || 'OPERATOR'
      },
      select: { id: true, login: true, name: true, role: true }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
