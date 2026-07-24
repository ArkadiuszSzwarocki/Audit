import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import bcrypt from 'bcryptjs';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      login: true,
      name: true,
      email: true,
      role: true,
      bhpTrainingDueDate: true,
      dismissedBhpNoticeThreshold: true,
      responsibleAreaId: true,
      responsibleArea: {
        select: { id: true, name: true }
      },
      notifyBhp: true,
      notifyQuality: true,
      notifyFaults: true,
      notifyKaizen: true,
      notifyAudits: true,
      createdAt: true
    },
    orderBy: { name: 'asc' }
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
  }

  try {
    const {
      login,
      name,
      email,
      password,
      role,
      bhpTrainingDueDate,
      responsibleAreaId,
      notifyBhp,
      notifyQuality,
      notifyFaults,
      notifyKaizen,
      notifyAudits,
    } = await request.json();
    
    if (!login || !name || !password) {
      return NextResponse.json({ error: 'Wypełnij wszystkie wymagane pola' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { login } });
    if (existingUser) {
      return NextResponse.json({ error: 'Użytkownik z takim loginem już istnieje' }, { status: 400 });
    }

    const requestedRoleUpper = String(role || '').toUpperCase();
    if ((requestedRoleUpper === 'ZARZAD' || requestedRoleUpper === 'ZARZĄD') && !session.isZarzad) {
      return NextResponse.json({
        error: 'Tylko obecny członek Zarządu może tworzyć nowe konta z rolą Zarząd!'
      }, { status: 403 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        login,
        name,
        email: email?.trim() || null,
        passwordHash,
        role: role || 'OPERATOR',
        bhpTrainingDueDate: bhpTrainingDueDate ? new Date(bhpTrainingDueDate) : null,
        responsibleAreaId: responsibleAreaId || null,
        notifyBhp: Boolean(notifyBhp),
        notifyQuality: Boolean(notifyQuality),
        notifyFaults: Boolean(notifyFaults),
        notifyKaizen: Boolean(notifyKaizen),
        notifyAudits: Boolean(notifyAudits),
      },
      select: {
        id: true,
        login: true,
        name: true,
        email: true,
        role: true,
        bhpTrainingDueDate: true,
        responsibleAreaId: true,
        notifyBhp: true,
        notifyQuality: true,
        notifyFaults: true,
        notifyKaizen: true,
        notifyAudits: true
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
