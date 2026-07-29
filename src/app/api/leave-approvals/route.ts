import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status') || 'PENDING';

    const requests = await prisma.leaveRequest.findMany({
      where: statusParam === 'ALL' ? {} : { status: statusParam },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            login: true,
            email: true,
            role: true,
            responsibleArea: { select: { id: true, name: true } },
          },
        },
        approver: {
          select: { id: true, name: true, login: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    console.error('Error fetching leave approvals:', error);
    return NextResponse.json({ error: 'Błąd podczas pobierania wniosków urlopowych' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, action, reason, approverId } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Brakujące parametry wniosku' }, { status: 400 });
    }

    const leaveReq = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!leaveReq) {
      return NextResponse.json({ error: 'Wniosek nie został znaleziony' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      const updatedReq = await prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          approverId: approverId || undefined,
          approverNote: reason || undefined,
          approvedAt: new Date(),
        },
      });

      // Update used days in LeaveBalance for the start date's year
      const year = leaveReq.startDate.getFullYear();
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          userId_year: {
            userId: leaveReq.userId,
            year: year,
          },
        },
      });

      if (balance) {
        const daysToDeduct = leaveReq.daysCount;
        const currentRemainingOverdue = Math.max(0, balance.overdueDays - balance.usedOverdueDays);

        // 1. Deduct first from overdue (urlop zaległy 2025)
        const deductFromOverdue = Math.min(daysToDeduct, currentRemainingOverdue);
        const remainingToDeduct = daysToDeduct - deductFromOverdue;

        const newUsedOverdue = balance.usedOverdueDays + deductFromOverdue;
        const newUsedCurrent = balance.usedDays + remainingToDeduct;

        const remainingOverdueAfter = Math.max(0, balance.overdueDays - newUsedOverdue);
        const remainingCurrentAfter = Math.max(0, balance.totalDays - newUsedCurrent);
        const newAvailable = remainingOverdueAfter + remainingCurrentAfter;

        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            usedOverdueDays: newUsedOverdue,
            usedDays: newUsedCurrent,
            availableDays: newAvailable,
          },
        });
      }

      return NextResponse.json({ success: true, data: updatedReq });
    }

    if (action === 'REJECT') {
      const updatedReq = await prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          approverId: approverId || undefined,
          approverNote: reason || undefined,
          approvedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, data: updatedReq });
    }

    return NextResponse.json({ error: 'Nieobsługiwana akcja' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing leave approval:', error);
    return NextResponse.json({ error: 'Błąd podczas przetwarzania wniosku' }, { status: 500 });
  }
}
