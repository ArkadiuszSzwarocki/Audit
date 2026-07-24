import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/config/db';
import { verifyJwtToken } from '@/lib/auth';

async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (sessionToken) {
    const payload = await verifyJwtToken(sessionToken);
    if (payload) {
      return {
        id: payload.id as string,
        name: payload.name as string,
        login: (payload.login as string) || (payload.name as string) || 'admin',
        role: (payload.role as string) || 'OPERATOR',
      };
    }
  }
  return null;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (user?.role && ['OPERATOR', 'AUDYTOR', 'AUDITOR'].includes(user.role.toUpperCase())) {
      return NextResponse.json({ error: 'Brak uprawnień do przeglądania listy wypłat' }, { status: 403 });
    }

    const payouts = await prisma.kaizenPayoutRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(payouts);
  } catch (error: any) {
    console.error('GET /api/kaizen-payouts Error:', error);
    return NextResponse.json({ error: 'Błąd pobierania wniosków wypłat' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json();
    const { docNumber, bankAccount, kaizenIds, totalPoints, totalAmount, rewardType, notes } = body;

    if (!docNumber || !Array.isArray(kaizenIds) || kaizenIds.length === 0) {
      return NextResponse.json({ error: 'Nieprawidłowe dane wniosku o wypłatę' }, { status: 400 });
    }

    // Fetch titles of selected Kaizens
    const kaizens = await prisma.kaizen.findMany({
      where: { id: { in: kaizenIds } },
      select: { id: true, title: true, pointsAwarded: true, isPaidOut: true },
    });

    // Check if any Kaizen is already paid out
    const alreadyPaid = kaizens.filter(k => k.isPaidOut);
    if (alreadyPaid.length > 0) {
      return NextResponse.json(
        { error: `Niektóre z wybranych wniosków zostały już rozliczone (${alreadyPaid.map(k => k.title).join(', ')})` },
        { status: 400 }
      );
    }

    const kaizenTitlesStr = kaizens.map(k => k.title).join(' | ');

    const newPayout = await prisma.kaizenPayoutRequest.create({
      data: {
        docNumber,
        userName: user?.name || 'Pracownik',
        userLogin: user?.login || user?.name || 'user',
        bankAccount: bankAccount ? bankAccount.trim() : '',
        kaizenIds: JSON.stringify(kaizenIds),
        kaizenTitles: kaizenTitlesStr,
        totalPoints: totalPoints || 0,
        totalAmount: totalAmount || 0,
        rewardType: rewardType || 'Premia finansowa z programu Kaizen',
        notes: notes ? notes.trim() : '',
        status: 'PENDING',
      },
    });

    return NextResponse.json(newPayout, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/kaizen-payouts Error:', error);
    return NextResponse.json({ error: 'Błąd rejestracji wniosku o wypłatę' }, { status: 500 });
  }
}
