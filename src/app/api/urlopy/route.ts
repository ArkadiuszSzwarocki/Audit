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

    const normalizedRequests = requests.map((request) => {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      let computedDays = 0;
      const cursor = new Date(start);

      while (cursor <= end) {
        const day = cursor.getDay();
        if (day >= 1 && day <= 5) {
          computedDays += 1;
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      return {
        ...request,
        daysCount: computedDays === 0 ? 1 : computedDays,
      };
    });

    return NextResponse.json(normalizedRequests);
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

    // Walidacja kolizji — sprawdź czy użytkownik nie ma już wniosku PENDING/APPROVED w tym zakresie
    const overlappingLeave = await prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });

    if (overlappingLeave) {
      const overlapStart = new Date(overlappingLeave.startDate).toLocaleDateString('pl-PL');
      const overlapEnd = new Date(overlappingLeave.endDate).toLocaleDateString('pl-PL');
      return NextResponse.json(
        { error: `W wybranym okresie istnieje już wniosek urlopowy (${overlapStart} — ${overlapEnd})` },
        { status: 409 }
      );
    }

    // Oblicz liczbę dni roboczych (poniedziałek-piątek) w zakresie inclusive
    let daysCount = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
      const day = cursor.getDay();
      if (day >= 1 && day <= 5) {
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
      WYPOCZYNKOWY: 'WYPOCZYNKOWY',
      ON_DEMAND: 'NA_ZADANIE',
      NA_ZADANIE: 'NA_ZADANIE',
      UNPAID: 'BEZPLATNY',
      BEZPLATNY: 'BEZPLATNY',
      SICK_LEAVE: 'CHOROBOWY',
      CHOROBOWY: 'CHOROBOWY',
      MATERNITY: 'MACIERZYNSKI',
      MACIERZYNSKI: 'MACIERZYNSKI',
      PARENTAL: 'RODZICIELSKI',
      RODZICIELSKI: 'RODZICIELSKI',
      PATERNITY: 'OJCOWSKI',
      OJCOWSKI: 'OJCOWSKI',
      CHILD_CARE: 'WYCHOAWNCZY',
      WYCHOAWNCZY: 'WYCHOAWNCZY',
      CHILD_CARE_ART188: 'OPIEKA_ART188',
      OPIEKA_ART188: 'OPIEKA_ART188',
      FORCE_MAJEURE: 'SILA_WYZSZA',
      SILA_WYZSZA: 'SILA_WYZSZA',
      CARER_LEAVE: 'OPIEKUNCZY',
      OPIEKUNCZY: 'OPIEKUNCZY',
      SPECIAL: 'OKOLICZNOSCIOWY',
      OKOLICZNOSCIOWY: 'OKOLICZNOSCIOWY',
      TRAINING: 'SZKOLENIOWY',
      SZKOLENIOWY: 'SZKOLENIOWY',
      BLOOD_DONOR: 'KRWIODASTWO',
      KRWIODASTWO: 'KRWIODASTWO',
      REHABILITATION: 'REHABILITACYJNY',
      REHABILITACYJNY: 'REHABILITACYJNY',
    };
    const dbType = typeMap[type] || type || 'WYPOCZYNKOWY';

    const reqYear = start.getFullYear();

    // 1. Walidacja limitu 4 dni w roku dla "Urlopu na żądanie" (Kodeks Pracy art. 167²)
    if (dbType === 'NA_ZADANIE' || dbType === 'ON_DEMAND') {
      if (daysCount > 4) {
        return NextResponse.json(
          {
            error: `Wniosek o urlop na żądanie nie może jednorazowo przekraczać 4 dni (złożono wniosek o ${daysCount} dni). Zgodnie z art. 167² KP roczny limit wynosi 4 dni.`,
          },
          { status: 400 }
        );
      }

      const yearStart = new Date(reqYear, 0, 1);
      const yearEnd = new Date(reqYear, 11, 31, 23, 59, 59);

      const existingOnDemand = await prisma.leaveRequest.findMany({
        where: {
          userId,
          type: { in: ['NA_ZADANIE', 'ON_DEMAND'] },
          status: { in: ['PENDING', 'APPROVED'] },
          startDate: { gte: yearStart, lte: yearEnd },
        },
      });

      const usedOnDemandDays = existingOnDemand.reduce(
        (acc, r) => acc + (r.daysCount || 1),
        0
      );

      if (usedOnDemandDays + daysCount > 4) {
        const remainingOnDemand = Math.max(0, 4 - usedOnDemandDays);
        return NextResponse.json(
          {
            error: `Limit urlopu na żądanie w roku ${reqYear} wynosi maksymalnie 4 dni (art. 167² KP). Wykorzystano/złożono już: ${usedOnDemandDays} dni. Dostępny limit to jeszcze: ${remainingOnDemand} dni.`,
          },
          { status: 400 }
        );
      }
    }

    // 2. Walidacja dostępnej puli urlopowej dla urlopów wypoczynkowych / na żądanie
    if (['WYPOCZYNKOWY', 'VACATION', 'NA_ZADANIE', 'ON_DEMAND'].includes(dbType)) {
      const balance = await prisma.leaveBalance.findUnique({
        where: { userId_year: { userId, year: reqYear } },
      });

      if (balance) {
        const overdueRemaining = Math.max(0, balance.overdueDays - balance.usedOverdueDays);
        const currentRemaining = Math.max(0, balance.totalDays - balance.usedDays);
        const totalAvailable = overdueRemaining + currentRemaining;

        // Oblicz zgłoszone już wnioski w stanie PENDING
        const pendingRequests = await prisma.leaveRequest.findMany({
          where: {
            userId,
            type: { in: ['WYPOCZYNKOWY', 'VACATION', 'NA_ZADANIE', 'ON_DEMAND'] },
            status: 'PENDING',
            startDate: { gte: new Date(reqYear, 0, 1), lte: new Date(reqYear, 11, 31, 23, 59, 59) },
          },
        });

        const pendingDaysCount = pendingRequests.reduce((acc, r) => acc + (r.daysCount || 1), 0);
        const effectiveAvailable = Math.max(0, totalAvailable - pendingDaysCount);

        if (daysCount > effectiveAvailable) {
          return NextResponse.json(
            {
              error: `Przekroczono dostępną pulę urlopową. Wnioskujesz o ${daysCount} dni roboczych, a Twój pozostały dostępny limit wynosi ${effectiveAvailable} dni (w tym ${pendingDaysCount} dni oczekuje na decyzję).`,
            },
            { status: 400 }
          );
        }
      }
    }

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
