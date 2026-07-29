import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const userIdParam = searchParams.get('userId');
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    if (action === 'all') {
      const users = await prisma.user.findMany({
        include: {
          responsibleArea: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
      });

      const balances = [];
      for (const user of users) {
        let balance = await prisma.leaveBalance.findUnique({
          where: {
            userId_year: {
              userId: user.id,
              year: year,
            },
          },
        });

        if (!balance) {
          balance = await prisma.leaveBalance.create({
            data: {
              userId: user.id,
              year: year,
              totalDays: 26,
              usedDays: 0,
              availableDays: 26,
              overdueDays: 0,
              usedOverdueDays: 0,
            },
          });
        }

        const remainingOverdue = Math.max(0, balance.overdueDays - balance.usedOverdueDays);
        const remainingCurrent = Math.max(0, balance.totalDays - balance.usedDays);
        const totalAvailable = remainingOverdue + remainingCurrent;

        balances.push({
          id: balance.id,
          userId: user.id,
          year: balance.year,
          totalDays: balance.totalDays,
          usedDays: balance.usedDays,
          overdueDays: balance.overdueDays,
          usedOverdueDays: balance.usedOverdueDays,
          remainingOverdue: remainingOverdue,
          remainingCurrent: remainingCurrent,
          availableDays: totalAvailable,
          createdAt: balance.createdAt.toISOString(),
          updatedAt: balance.updatedAt.toISOString(),
          user: {
            id: user.id,
            name: user.name,
            login: user.login,
            email: user.email ?? undefined,
            role: user.role,
            department: user.responsibleArea
              ? { id: user.responsibleArea.id, name: user.responsibleArea.name }
              : undefined,
          },
        });
      }

      return NextResponse.json({ success: true, data: balances });
    }

    if (userIdParam) {
      const user = await prisma.user.findUnique({
        where: { id: userIdParam },
        include: { responsibleArea: { select: { id: true, name: true } } },
      });

      if (!user) {
        return NextResponse.json({ error: 'Użytkownik nie został znaleziony' }, { status: 404 });
      }

      let balance = await prisma.leaveBalance.findUnique({
        where: {
          userId_year: {
            userId: user.id,
            year: year,
          },
        },
      });

      if (!balance) {
        balance = await prisma.leaveBalance.create({
          data: {
            userId: user.id,
            year: year,
            totalDays: 26,
            usedDays: 0,
            availableDays: 26,
            overdueDays: 0,
            usedOverdueDays: 0,
          },
        });
      }

      const remainingOverdue = Math.max(0, balance.overdueDays - balance.usedOverdueDays);
      const remainingCurrent = Math.max(0, balance.totalDays - balance.usedDays);
      const totalAvailable = remainingOverdue + remainingCurrent;

      return NextResponse.json({
        success: true,
        data: {
          id: balance.id,
          userId: user.id,
          year: balance.year,
          totalDays: balance.totalDays,
          usedDays: balance.usedDays,
          overdueDays: balance.overdueDays,
          usedOverdueDays: balance.usedOverdueDays,
          remainingOverdue: remainingOverdue,
          remainingCurrent: remainingCurrent,
          availableDays: totalAvailable,
          createdAt: balance.createdAt.toISOString(),
          updatedAt: balance.updatedAt.toISOString(),
          user: {
            id: user.id,
            name: user.name,
            login: user.login,
            email: user.email ?? undefined,
            role: user.role,
            department: user.responsibleArea
              ? { id: user.responsibleArea.id, name: user.responsibleArea.name }
              : undefined,
          },
        },
      });
    }

    return NextResponse.json({ error: 'Nieprawidłowe parametry zapytania' }, { status: 400 });
  } catch (error: any) {
    console.error('Error fetching leave balances:', error);
    return NextResponse.json({ error: 'Błąd serwera podczas pobierania pul urlopowych' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, year: reqYear, adjustment, newTotalDays, overdueDays } = body;
    const year = reqYear ? parseInt(reqYear, 10) : new Date().getFullYear();

    if (!userId) {
      return NextResponse.json({ error: 'Brak identyfikatora użytkownika' }, { status: 400 });
    }

    let balance = await prisma.leaveBalance.findUnique({
      where: {
        userId_year: {
          userId: userId,
          year: year,
        },
      },
    });

    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: {
          userId: userId,
          year: year,
          totalDays: 26,
          usedDays: 0,
          availableDays: 26,
          overdueDays: 0,
          usedOverdueDays: 0,
        },
      });
    }

    if (action === 'set-overdue') {
      const num = Math.max(0, Number(overdueDays) || 0);
      const updatedBalance = await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { overdueDays: num },
      });
      return NextResponse.json({ success: true, data: updatedBalance });
    }

    if (action === 'adjust') {
      const adjNum = Number(adjustment) || 0;
      const updatedTotal = Math.max(0, balance.totalDays + adjNum);
      const updatedBalance = await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          totalDays: updatedTotal,
          availableDays: Math.max(0, updatedTotal - balance.usedDays),
        },
      });
      return NextResponse.json({ success: true, data: updatedBalance });
    }

    if (action === 'set-total') {
      const totalNum = Number(newTotalDays) || 0;
      const updatedBalance = await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          totalDays: totalNum,
          availableDays: Math.max(0, totalNum - balance.usedDays),
        },
      });
      return NextResponse.json({ success: true, data: updatedBalance });
    }

    if (action === 'reset') {
      const updatedBalance = await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          usedDays: 0,
          usedOverdueDays: 0,
          availableDays: balance.totalDays,
        },
      });
      return NextResponse.json({ success: true, data: updatedBalance });
    }

    return NextResponse.json({ error: 'Nieobsługiwana akcja' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating leave balance:', error);
    return NextResponse.json({ error: 'Błąd podczas aktualizacji salda urlopowego' }, { status: 500 });
  }
}
