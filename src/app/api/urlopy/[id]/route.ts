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

/**
 * DELETE /api/urlopy/[id] — usuwa wniosek urlopowy (Kierownicy, Managerowie, Zarząd, Admini oraz Przełożeni).
 * Jeśli wniosek był zatwierdzony (APPROVED), zwraca dni do puli urlopowej użytkownika.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Niezalogowany' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Brak ID wniosku' }, { status: 400 });
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
      return NextResponse.json(
        { error: 'Nie znaleziono wniosku urlopowego' },
        { status: 404 }
      );
    }

    // Pobierz aktualną rolę z bazy danych
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
    const isSelf = leaveRequest.userId === sessionUser.id;

    if (!isManagementOrBoard && !isDirectApprover && !isSelf) {
      return NextResponse.json(
        { error: 'Brak uprawnień przełożonego, zarządu lub administratora do usunięcia tego wniosku' },
        { status: 403 }
      );
    }

    const start = new Date(leaveRequest.startDate);
    const end = new Date(leaveRequest.endDate);
    const year = start.getFullYear();

    // Obliczanie dni roboczych
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

    // Transakcja: jeśli wniosek był APPROVED, zwróć dni do puli i usuń wniosek
    let restoredDays = 0;
    await prisma.$transaction(async (tx) => {
      if (leaveRequest.status === 'APPROVED') {
        const balance = await tx.leaveBalance.findUnique({
          where: {
            userId_year: {
              userId: leaveRequest.userId,
              year,
            },
          },
        });

        if (balance) {
          const updatedUsedDays = Math.max(0, balance.usedDays - workingDaysCount);
          const remainingOverdue = Math.max(0, balance.overdueDays - balance.usedOverdueDays);
          const remainingCurrent = Math.max(0, balance.totalDays - updatedUsedDays);
          const updatedAvailableDays = remainingOverdue + remainingCurrent;

          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: {
              usedDays: updatedUsedDays,
              availableDays: updatedAvailableDays,
            },
          });
          restoredDays = workingDaysCount;
        }
      }

      await tx.leaveRequest.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: leaveRequest.status === 'APPROVED'
        ? `Usunięto zatwierdzony wniosek urlopowy. ${restoredDays} dni powróciło do puli urlopowej.`
        : 'Wniosek urlopowy został usunięty.',
      restoredDays,
    });
  } catch (error: any) {
    console.error('DELETE /api/urlopy/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Błąd podczas usuwania wniosku urlopowego' },
      { status: 500 }
    );
  }
}
