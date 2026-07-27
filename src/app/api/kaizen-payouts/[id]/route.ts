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
    const userRoleUpper = String(user?.role || '').toUpperCase();
    const isAllowed = userRoleUpper === 'ADMIN' || userRoleUpper === 'ADMINISTRATOR' || userRoleUpper === 'ZARZAD' || userRoleUpper === 'ZARZĄD' || userRoleUpper === 'KOMISJA KAIZEN' || userRoleUpper === 'KOMISJA_KAIZEN' || userRoleUpper === 'KAIZEN_COMMITTEE';

    if (!user || !isAllowed) {
      return NextResponse.json({ error: 'Brak uprawnień do zatwierdzania / cofania wypłat' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body; // APPROVED, REJECTED, or PENDING

    if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Nieprawidłowy status (wymagany: APPROVED, REJECTED lub PENDING)' }, { status: 400 });
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
        approvedBy: status === 'PENDING' ? null : (user?.name || 'Komisja Kaizen'),
        approvedAt: status === 'PENDING' ? null : new Date(),
      },
    });

    // Handle Kaizen items isPaidOut state update
    try {
      const kaizenIds: string[] = JSON.parse(payout.kaizenIds || '[]');
      if (kaizenIds.length > 0) {
        if (status === 'APPROVED') {
          await prisma.kaizen.updateMany({
            where: { id: { in: kaizenIds } },
            data: {
              isPaidOut: true,
              paidOutAt: new Date(),
              payoutDocNum: payout.docNumber,
            },
          });
        } else {
          // If status is PENDING or REJECTED, revoke paid out state
          await prisma.kaizen.updateMany({
            where: { id: { in: kaizenIds } },
            data: {
              isPaidOut: false,
              paidOutAt: null,
              payoutDocNum: null,
            },
          });
        }
      }
    } catch (err) {
      console.error('Błąd aktualizacji stanu rozliczenia wniosków Kaizen:', err);
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
    const user = await getSessionUser();
    const userRoleUpper = String(user?.role || '').toUpperCase();
    const isAllowed = userRoleUpper === 'ADMIN' || userRoleUpper === 'ADMINISTRATOR' || userRoleUpper === 'ZARZAD' || userRoleUpper === 'ZARZĄD' || userRoleUpper === 'KOMISJA KAIZEN' || userRoleUpper === 'KOMISJA_KAIZEN' || userRoleUpper === 'KAIZEN_COMMITTEE';

    if (!user || !isAllowed) {
      return NextResponse.json({ error: 'Brak uprawnień do usuwania wniosków o wypłatę' }, { status: 403 });
    }

    const { id } = await params;

    const payout = await prisma.kaizenPayoutRequest.findUnique({
      where: { id },
    });

    if (!payout) {
      return NextResponse.json({ error: 'Nie znaleziono wniosku o wypłatę' }, { status: 404 });
    }

    // If payout was APPROVED, revert the Kaizen items paid out state
    if (payout.status === 'APPROVED') {
      try {
        const kaizenIds: string[] = JSON.parse(payout.kaizenIds || '[]');
        if (kaizenIds.length > 0) {
          await prisma.kaizen.updateMany({
            where: { id: { in: kaizenIds } },
            data: {
              isPaidOut: false,
              paidOutAt: null,
              payoutDocNum: null,
            },
          });
        }
      } catch (err) {
        console.error('Błąd wycofywania stanu rozliczenia Kaizen:', err);
      }
    }

    await prisma.kaizenPayoutRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: `Wniosek o wypłatę ${payout.docNumber} został usunięty` });
  } catch (error: any) {
    console.error('DELETE /api/kaizen-payouts/[id] Error:', error);
    return NextResponse.json({ error: error?.message || 'Błąd usuwania wniosku o wypłatę' }, { status: 500 });
  }
}
