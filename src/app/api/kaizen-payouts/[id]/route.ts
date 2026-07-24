import { NextRequest, NextResponse } from 'next/server';
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (user?.role && ['OPERATOR', 'AUDYTOR', 'AUDITOR'].includes(user.role.toUpperCase())) {
      return NextResponse.json({ error: 'Brak uprawnień do zatwierdzania wypłat' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body; // APPROVED or REJECTED

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Nieprawidłowy status (wymagany: APPROVED lub REJECTED)' }, { status: 400 });
    }

    const payout = await prisma.kaizenPayoutRequest.findUnique({
      where: { id },
    });

    if (!payout) {
      return NextResponse.json({ error: 'Nie znaleziono wniosku o wypłatę' }, { status: 404 });
    }

    const updatedPayout = await prisma.kaizenPayoutRequest.update({
      where: { id },
      data: {
        status,
        approvedBy: user?.name || 'Komisja Kaizen',
        approvedAt: new Date(),
      },
    });

    // If status === 'APPROVED', mark referenced Kaizens as paid out!
    if (status === 'APPROVED') {
      try {
        const kaizenIds: string[] = JSON.parse(payout.kaizenIds || '[]');
        if (kaizenIds.length > 0) {
          await prisma.kaizen.updateMany({
            where: { id: { in: kaizenIds } },
            data: {
              isPaidOut: true,
              paidOutAt: new Date(),
              payoutDocNum: payout.docNumber,
            },
          });
        }
      } catch (err) {
        console.error('Błąd oznaczania Kaizen jako wypłaconych:', err);
      }
    }

    return NextResponse.json(updatedPayout);
  } catch (error: any) {
    console.error('PATCH /api/kaizen-payouts/[id] Error:', error);
    return NextResponse.json({ error: 'Błąd aktualizacji statusu wypłaty' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.kaizenPayoutRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/kaizen-payouts/[id] Error:', error);
    return NextResponse.json({ error: 'Błąd usuwania wniosku o wypłatę' }, { status: 500 });
  }
}
