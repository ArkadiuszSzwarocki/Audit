import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { sendMail } from '@/lib/mailer';
import { getAuth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuth(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, role: true },
  });

  const currentRoleUpper = String(currentUser?.role || user.role || '').toUpperCase();
  const isManagement = currentRoleUpper === 'ADMIN' || currentRoleUpper === 'DIRECTOR' || currentRoleUpper === 'MANAGER' || currentRoleUpper === 'ZARZAD' || currentRoleUpper === 'ZARZĄD';

  if (!isManagement) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = params;
  const { approved, managerComment } = await req.json();

  const ticket = await prisma.helpDeskTicket.findUnique({
    where: { id },
    include: { createdBy: true },
  });

  if (!ticket || ticket.type !== 'PURCHASE') {
    return NextResponse.json({ error: 'Ticket not found or not a purchase request' }, { status: 404 });
  }

  const decisionLabel = approved ? 'zatwierdzono' : 'odrzucono';
  const actionLabel = approved ? 'Zatwierdzono przez' : 'Odrzucono przez';
  const historyEntries = [] as Array<{
    ticketId: string;
    changedBy: string;
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }>;

  if (ticket.status !== (approved ? 'APPROVED' : 'REJECTED')) {
    historyEntries.push({
      ticketId: id,
      changedBy: currentUser?.id || user.id,
      field: 'status',
      oldValue: ticket.status,
      newValue: approved ? 'APPROVED' : 'REJECTED',
    });
  }

  historyEntries.push({
    ticketId: id,
    changedBy: currentUser?.id || user.id,
    field: 'approval',
    oldValue: ticket.isApprovedByManager === true
      ? 'Zatwierdzono wcześniej'
      : ticket.isApprovedByManager === false
        ? 'Odrzucono wcześniej'
        : 'Oczekuje na akceptację zarządu',
    newValue: `${actionLabel} ${currentUser?.name || user.name}${managerComment ? ` – ${managerComment}` : ''}`,
  });

  const updatedTicket = await prisma.$transaction(async (tx) => {
    const updated = await tx.helpDeskTicket.update({
      where: { id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        isApprovedByManager: approved,
        approvedById: user.id,
        managerComment,
        approvalDate: new Date(),
      },
    });

    if (historyEntries.length > 0) {
      await tx.helpDeskTicketHistory.createMany({ data: historyEntries });
    }

    return updated;
  });

  // Wyślij e-mail do pracownika z decyzją
  if (ticket.createdBy.email) {
    await sendMail({
      to: ticket.createdBy.email,
      subject: `Twoje zapotrzebowanie #${ticket.id} zostało ${decisionLabel}`,
      html: `
        <h1>Twoje zapotrzebowanie "${ticket.title}" zostało rozpatrzone.</h1>
        <p><strong>Decyzja:</strong> ${approved ? '✅ Zaakceptowane' : '❌ Odrzucone'}</p>
        ${managerComment ? `<p><strong>Komentarz zarządu:</strong> ${managerComment}</p>` : ''}
      `,
      text: `Twoje zapotrzebowanie "${ticket.title}" zostało ${decisionLabel}.`,
    });
  }

  return NextResponse.json(updatedTicket);
}
