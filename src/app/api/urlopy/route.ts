import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

/**
 * GET /api/urlopy — pobiera wnioski urlopowe
 * Query params: userId (opcjonalnie), status (opcjonalnie)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: { id: true, login: true, name: true, role: true },
        },
        approver: {
          select: { id: true, login: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);
  } catch (error: unknown) {
    console.error('GET /api/urlopy error:', error);
    return NextResponse.json(
      { error: 'Błąd pobierania wniosków urlopowych' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/urlopy — tworzy nowy wniosek urlopowy
 * Body: { userId, startDate, endDate, type, reason?, managerId? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, startDate, endDate, type, reason, managerId } = body;

    if (!userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'userId, startDate i endDate są wymagane' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: 'Nie znaleziono użytkownika' },
        { status: 404 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Nieprawidłowy format daty' },
        { status: 400 }
      );
    }

    if (end < start) {
      return NextResponse.json(
        { error: 'Data końcowa nie może być wcześniejsza niż data początkowa' },
        { status: 400 }
      );
    }

    // Oblicz liczbę dni roboczych (Mon-Fri)
    let daysCount = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
      const day = cursor.getDay();
      if (day !== 0 && day !== 6) {
        daysCount += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    if (daysCount === 0) {
      daysCount = 1;
    }

    // Mapuj typ urlopu z UI na typ bazy danych
    const typeMap: Record<string, string> = {
      VACATION: 'WYPOCZYNKOWY',
      SICK_LEAVE: 'CHOROBOWY',
      ON_DEMAND: 'NA_ZADANIE',
      UNPAID: 'BEZPLATNY',
      SPECIAL: 'SPECJALNY',
    };
    const dbType = typeMap[type] || type || 'WYPOCZYNKOWY';

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        startDate: start,
        endDate: end,
        daysCount,
        type: dbType,
        reason: reason || null,
        approverId: managerId || null,
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, login: true, name: true },
        },
        approver: {
          select: { id: true, login: true, name: true },
        },
      },
    });

    return NextResponse.json(leaveRequest, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/urlopy error:', error);
    return NextResponse.json(
      { error: 'Błąd przy tworzeniu wniosku urlopowego' },
      { status: 500 }
    );
  }
}
