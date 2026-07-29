import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/config/db';
import { verifyJwtToken } from '@/lib/auth';

const ALLOWED_MANAGEMENT_ROLES = new Set([
  'ADMIN',
  'ADMINISTRATOR',
  'MASTER ADMIN',
  'MASTER_ADMIN',
  'SUPERADMIN',
  'ZARZAD',
  'ZARZĄD',
  'BOARD',
  'DIRECTOR',
  'DYREKTOR',
  'KIEROWNIK',
  'MANAGER',
  'BRYGADZISTA',
  'LEADER',
]);

async function getSessionUser(req: NextRequest) {
  const cookieStore = await cookies();

  // 1. JWT session_token cookie
  const sessionToken = cookieStore.get('session_token')?.value;
  if (sessionToken) {
    const payload = await verifyJwtToken(sessionToken);
    if (payload && payload.id) {
      return {
        id: payload.id as string,
        name: payload.name as string,
        login: (payload.login as string) || 'user',
        role: (payload.role as string) || 'OPERATOR',
      };
    }
  }

  // 2. admin_session cookie
  const isAdmin = cookieStore.get('admin_session')?.value === 'true';
  if (isAdmin) {
    return { id: 'admin-fallback', name: 'Administrator', login: 'admin', role: 'ADMIN' };
  }

  // 3. user_id cookie
  const userIdCookie = cookieStore.get('user_id')?.value || cookieStore.get('userId')?.value;
  if (userIdCookie) {
    return { id: userIdCookie, name: 'User', login: 'user', role: 'OPERATOR' };
  }

  // 4. Headers
  const userIdHeader = req.headers.get('x-user-id');
  const roleHeader = req.headers.get('x-user-role');
  if (userIdHeader) {
    return { id: userIdHeader, name: 'User', login: 'user', role: roleHeader || 'OPERATOR' };
  }

  // 5. Query param userId (as fallback)
  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get('userId') || searchParams.get('approverId');
  if (userIdParam) {
    return { id: userIdParam, name: 'User', login: 'user', role: 'OPERATOR' };
  }

  return null;
}

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Niezalogowany' }, { status: 401 });
    }

    const rawParams = await context.params;
    const id = rawParams?.id;

    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json({ error: 'Brak ID wniosku' }, { status: 400 });
    }

    const body = await req.json();
    const { status, approverNote } = body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Nieznany status' }, { status: 400 });
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, role: true },
        },
      },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Wniosek nie istnieje' }, { status: 404 });
    }

    // Weryfikacja roli w bazie danych
    let userRole = sessionUser.role.toUpperCase().trim();
    if (sessionUser.id !== 'admin-fallback') {
      const dbUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { role: true },
      });
      if (dbUser) userRole = dbUser.role.toUpperCase().trim();
    }

    const isManagementOrBoard = sessionUser.id === 'admin-fallback' || ALLOWED_MANAGEMENT_ROLES.has(userRole);
    const isDirectApprover = leaveRequest.approverId === sessionUser.id;

    if (!isManagementOrBoard && !isDirectApprover) {
      return NextResponse.json(
        { error: 'Brak uprawnień przełożonego, zarządu lub administratora do modyfikacji tego wniosku' },
        { status: 403 }
      );
    }

    const start = new Date(leaveRequest.startDate);
    const end = new Date(leaveRequest.endDate);
    const year = start.getFullYear();

    // Obliczenie dni roboczych
    let workingDaysCount = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
      const day = cursor.getDay();
      if (day >= 1 && day <= 5) {
        workingDaysCount += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    if (workingDaysCount === 0) workingDaysCount = 1;

    const previousStatus = leaveRequest.status;

    await prisma.$transaction(async (tx) => {
      // 1. Zmiana statusu wniosku
      await tx.leaveRequest.update({
        where: { id },
        data: {
          status,
          approverId: sessionUser.id !== 'admin-fallback' ? sessionUser.id : null,
          approvedAt: status === 'APPROVED' ? new Date() : null,
          reason: approverNote ? `[Uwaga przełożonego: ${approverNote}] ${leaveRequest.reason || ''}` : leaveRequest.reason,
        },
      });

      // 2. Jeśli wniosek staje się APPROVED (z PENDING lub REJECTED) -> odejmij dni z puli
      if (status === 'APPROVED' && previousStatus !== 'APPROVED') {
        let balance = await tx.leaveBalance.findUnique({
          where: { userId_year: { userId: leaveRequest.userId, year } },
        });

        if (!balance) {
          balance = await tx.leaveBalance.create({
            data: {
              userId: leaveRequest.userId,
              year,
              totalDays: 26,
              usedDays: 0,
              availableDays: 26,
              overdueDays: 0,
              usedOverdueDays: 0,
            },
          });
        }

        const newUsedDays = balance.usedDays + workingDaysCount;
        const remainingOverdue = Math.max(0, balance.overdueDays - balance.usedOverdueDays);
        const remainingCurrent = Math.max(0, balance.totalDays - newUsedDays);
        const newAvailableDays = remainingOverdue + remainingCurrent;

        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            usedDays: newUsedDays,
            availableDays: newAvailableDays,
          },
        });
      }

      // 3. Jeśli wniosek zostaje wycofany z APPROVED na REJECTED lub PENDING -> zwróć dni do puli
      if (previousStatus === 'APPROVED' && status !== 'APPROVED') {
        const balance = await tx.leaveBalance.findUnique({
          where: { userId_year: { userId: leaveRequest.userId, year } },
        });

        if (balance) {
          const newUsedDays = Math.max(0, balance.usedDays - workingDaysCount);
          const remainingOverdue = Math.max(0, balance.overdueDays - balance.usedOverdueDays);
          const remainingCurrent = Math.max(0, balance.totalDays - newUsedDays);
          const newAvailableDays = remainingOverdue + remainingCurrent;

          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: {
              usedDays: newUsedDays,
              availableDays: newAvailableDays,
            },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: status === 'APPROVED'
        ? 'Wniosek został zatwierdzony, a dni zostały odjęte z puli urlopowej.'
        : status === 'REJECTED'
        ? 'Wniosek został odrzucony.'
        : 'Zmieniono status wniosku.',
    });
  } catch (error: any) {
    console.error('PATCH /api/urlopy/[id]/status error:', error);
    return NextResponse.json(
      { error: error.message || 'Błąd modyfikacji statusu wniosku' },
      { status: 500 }
    );
  }
}
