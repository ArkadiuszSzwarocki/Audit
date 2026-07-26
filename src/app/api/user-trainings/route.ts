import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthSession } from '@/lib/auth';
import { getRemainingCalendarDays } from '@/utils/bhpDateUtils';

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  try {
    // 1. Fetch all training types
    let trainingTypes = await prisma.userTrainingType.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    // Ensure default BHP training type exists
    if (trainingTypes.length === 0) {
      const defaultBhp = await prisma.userTrainingType.create({
        data: {
          name: 'Szkolenie BHP',
          description: 'Obowiązkowe szkolenie okresowe z zakresu Bezpieczeństwa i Higieny Pracy',
          isDefault: true,
        },
      });
      trainingTypes = [defaultBhp];
    }

    // 2. Access control: Only ADMIN and ZARZĄD can see all employees. Regular users see ONLY themselves.
    const userRoleUpper = String(session.role || '').toUpperCase();
    const canSeeAll = session.isAdmin || session.isZarzad || userRoleUpper === 'ZARZAD' || userRoleUpper === 'ZARZĄD';

    const users = await prisma.user.findMany({
      where: canSeeAll
        ? { NOT: { login: { in: ['MasterAdmin', 'masteradmin'] } } }
        : { id: session.id },
      select: {
        id: true,
        login: true,
        name: true,
        email: true,
        role: true,
        bhpTrainingDueDate: true,
        trainings: {
          include: {
            trainingType: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // 3. Compute manager summary for expiring/expired trainings
    let expiredCount = 0;
    let expiringSoonCount = 0;
    const expiringUsers: {
      userId: string;
      userName: string;
      userRole: string;
      trainingName: string;
      dueDate: string;
      remainingDays: number;
      isExpired: boolean;
    }[] = [];

    users.forEach((u) => {
      // Check legacy bhpTrainingDueDate if no explicit userTraining record exists for default BHP
      const hasExplicitBhp = u.trainings.some(t => t.trainingType?.isDefault || t.trainingType?.name === 'Szkolenie BHP');
      
      const allUserTrainings = [...u.trainings];
      if (!hasExplicitBhp && u.bhpTrainingDueDate) {
        const bhpType = trainingTypes.find(t => t.isDefault || t.name === 'Szkolenie BHP');
        if (bhpType) {
          allUserTrainings.push({
            id: `legacy-${u.id}`,
            userId: u.id,
            trainingTypeId: bhpType.id,
            dueDate: u.bhpTrainingDueDate,
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            trainingType: bhpType,
          } as any);
        }
      }

      allUserTrainings.forEach((ut) => {
        if (ut.dueDate) {
          const days = getRemainingCalendarDays(ut.dueDate);
          if (days <= 0) {
            expiredCount++;
            expiringUsers.push({
              userId: u.id,
              userName: u.name,
              userRole: u.role,
              trainingName: ut.trainingType.name,
              dueDate: new Date(ut.dueDate).toISOString(),
              remainingDays: days,
              isExpired: true,
            });
          } else if (days <= 30) {
            expiringSoonCount++;
            expiringUsers.push({
              userId: u.id,
              userName: u.name,
              userRole: u.role,
              trainingName: ut.trainingType.name,
              dueDate: new Date(ut.dueDate).toISOString(),
              remainingDays: days,
              isExpired: false,
            });
          }
        }
      });
    });

    return NextResponse.json({
      trainingTypes,
      users,
      summary: {
        expiredCount,
        expiringSoonCount,
        expiringUsers,
      },
    });
  } catch (error: any) {
    console.error('GET /api/user-trainings Error:', error);
    return NextResponse.json({ error: error.message || 'Błąd serwera' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  // Check authorization: ADMIN, ZARZAD, KONTROLA_JAKOSCI, BHP, or canManageUsers/canManageStructure
  const userRoleUpper = String(session.role || '').toUpperCase();
  const isAuthorized =
    session.isAdmin ||
    session.isZarzad ||
    userRoleUpper.includes('KONTROLA') ||
    userRoleUpper.includes('JAKOSC') ||
    userRoleUpper.includes('AUDYT') ||
    userRoleUpper.includes('BHP');

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Brak uprawnień do edycji dat szkoleń i badań' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, trainingTypeId, dueDate, notes } = body;

    if (!userId || !trainingTypeId) {
      return NextResponse.json({ error: 'Wymagane parametry userId i trainingTypeId' }, { status: 400 });
    }

    const parsedDueDate = dueDate ? new Date(dueDate) : null;

    // Upsert UserTraining record
    const updatedTraining = await prisma.userTraining.upsert({
      where: {
        userId_trainingTypeId: {
          userId,
          trainingTypeId,
        },
      },
      create: {
        userId,
        trainingTypeId,
        dueDate: parsedDueDate,
        notes: notes || null,
      },
      update: {
        dueDate: parsedDueDate,
        notes: notes !== undefined ? notes : undefined,
      },
      include: {
        trainingType: true,
      },
    });

    // If default BHP training type, also update user.bhpTrainingDueDate for backward compatibility
    if (updatedTraining.trainingType.isDefault || updatedTraining.trainingType.name === 'Szkolenie BHP') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          bhpTrainingDueDate: parsedDueDate,
        },
      });
    }

    return NextResponse.json(updatedTraining);
  } catch (error: any) {
    console.error('PUT /api/user-trainings Error:', error);
    return NextResponse.json({ error: error.message || 'Błąd aktualizacji szkolenia' }, { status: 500 });
  }
}
