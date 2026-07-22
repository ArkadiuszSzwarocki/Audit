import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { cookies } from 'next/headers';
import * as jose from 'jose';

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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkIsAdmin()) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Nie udało się usunąć użytkownika' }, { status: 500 });
  }
}
