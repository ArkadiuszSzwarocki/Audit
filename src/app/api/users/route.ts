import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import bcrypt from 'bcryptjs';
import { getAuthSession } from '@/lib/auth';
import { checkRolePermission } from '@/lib/permissions';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const isAllowedToView = session.isAdmin || checkRolePermission(session.role, 'users.view');
    if (!isAllowedToView) {
      return NextResponse.json({ error: 'Brak uprawnień do przeglądania użytkowników' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: {
        NOT: {
          login: { in: ['MasterAdmin', 'masteradmin'] }
        }
      },
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
        isKaizenCommittee: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  const isAllowedToCreate = session.isAdmin || checkRolePermission(session.role, 'users.create');
  if (!isAllowedToCreate) {
    return NextResponse.json({ error: 'Brak uprawnień do dodawania użytkowników. Sprawdź ustawienia w macierzy uprawnień.' }, { status: 403 });
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
      isKaizenCommittee,
    } = await request.json();
    
    if (!login || !name || !password) {
      return NextResponse.json({ error: 'Wypełnij wszystkie wymagane pola' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { login } });
    if (existingUser) {
      return NextResponse.json({ error: 'Użytkownik z takim loginem już istnieje' }, { status: 400 });
    }

    const requestedRoleUpper = String(role || '').toUpperCase();
    const currentDbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { role: true }
    });
    const currentDbRoleUpper = String(currentDbUser?.role || '').toUpperCase();
    const isMasterAdmin = currentDbRoleUpper === 'ADMIN' && String(session.name || session.login || '').toUpperCase().includes('MASTERADMIN');
    const isAllowedToCreateBoardUser = session.isZarzad || isMasterAdmin || currentDbRoleUpper === 'ZARZAD' || currentDbRoleUpper === 'ZARZĄD';

    if ((requestedRoleUpper === 'ZARZAD' || requestedRoleUpper === 'ZARZĄD') && !isAllowedToCreateBoardUser) {
      return NextResponse.json({
        error: 'Tylko obecny członek Zarządu lub Master Admin może tworzyć nowe konta z rolą Zarząd!'
      }, { status: 403 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        login: login.trim(),
        name: name.trim(),
        email: email ? email.trim() : null,
        passwordHash,
        role: role || 'OPERATOR',
        bhpTrainingDueDate: bhpTrainingDueDate ? new Date(bhpTrainingDueDate) : null,
        responsibleAreaId: responsibleAreaId || null,
        notifyBhp: Boolean(notifyBhp),
        notifyQuality: Boolean(notifyQuality),
        notifyFaults: Boolean(notifyFaults),
        notifyKaizen: Boolean(notifyKaizen),
        notifyAudits: Boolean(notifyAudits),
        isKaizenCommittee: Boolean(isKaizenCommittee),
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
        notifyAudits: true,
        isKaizenCommittee: true,
        createdAt: true
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Błąd podczas tworzenia użytkownika', details: error.message },
      { status: 500 }
    );
  }
}
