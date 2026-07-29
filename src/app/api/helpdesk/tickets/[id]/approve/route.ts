import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { sendManagementDecisionNotification } from '@/lib/mailer';
import { getAuthSession } from '@/lib/auth';
import { verifyTicketToken } from '@/lib/ticket-token';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    const token = req.nextUrl.searchParams.get('token');
    const hasValidToken = token ? verifyTicketToken(token, id) : false;
    const session = await getAuthSession();

    if (!session && !hasValidToken) {
      return NextResponse.json({ error: 'Brak autoryzacji (wymagany token lub zalogowanie)' }, { status: 401 });
    }

    const currentUser = session?.id
      ? await prisma.user.findUnique({
          where: { id: session.id },
          select: { id: true, name: true, role: true },
        })
      : null;

    const currentRoleUpper = String(currentUser?.role || session?.role || '').toUpperCase();
    const isAllowed =
      hasValidToken ||
      ['ADMIN', 'DIRECTOR', 'MANAGER', 'ZARZAD', 'ZARZĄD', 'IT', 'IT HELP DESK', 'HELPDESK'].includes(currentRoleUpper);

    if (!isAllowed) {
      return NextResponse.json({ error: 'Brak uprawnień do zatwierdzenia tego zgłoszenia.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { approved, managerComment } = body;

    if (typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Nieprawidłowa wartość decyzji.' }, { status: 400 });
    }

    const ticket = await prisma.helpDeskTicket.findUnique({
      where: { id },
      include: { createdBy: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Nie znaleziono zgłoszenia.' }, { status: 404 });
    }

    const actorUserId = currentUser?.id || session?.id || ticket.createdById;
    const actorName = currentUser?.name || session?.name || 'Zarząd';

    const decisionLabel = approved ? 'zatwierdzone' : 'odrzucone';
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
        changedBy: actorUserId,
        field: 'status',
        oldValue: ticket.status,
        newValue: approved ? 'APPROVED' : 'REJECTED',
      });
    }

    historyEntries.push({
      ticketId: id,
      changedBy: actorUserId,
      field: 'approval',
      oldValue:
        ticket.isApprovedByManager === true
          ? 'Zatwierdzono wcześniej'
          : ticket.isApprovedByManager === false
          ? 'Odrzucono wcześniej'
          : 'Oczekuje na akceptację zarządu',
      newValue: `${actionLabel} ${actorName}${managerComment ? ` – ${managerComment}` : ''}`,
    });

    const updatedTicket = await prisma.$transaction(async (tx) => {
      const updated = await tx.helpDeskTicket.update({
        where: { id },
        data: {
          status: approved ? 'APPROVED' : 'REJECTED',
          isApprovedByManager: approved,
          approvedById: actorUserId,
          managerComment: managerComment || null,
          approvalDate: new Date(),
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          history: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (historyEntries.length > 0) {
        await tx.helpDeskTicketHistory.createMany({ data: historyEntries });
      }

      return updated;
    });

    // Send decision notification email asynchronously in the background
    (async () => {
      const recipientEmails: string[] = [];
      if (ticket.createdBy?.email) {
        recipientEmails.push(ticket.createdBy.email);
      }

      const helpDeskUser = await prisma.user.findUnique({
        where: { login: 'helpdesk' },
        select: { email: true }
      });
      if (helpDeskUser?.email && !recipientEmails.includes(helpDeskUser.email)) {
        recipientEmails.push(helpDeskUser.email);
      }

      if (recipientEmails.length > 0) {
        await sendManagementDecisionNotification({
          recipientEmail: recipientEmails,
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          description: ticket.description,
          createdBy: ticket.createdBy?.name || 'Pracownik',
          approvedBy: actorName,
          approved,
          managerComment,
        });
      }
    })().catch(err => console.error('Error sending decision email:', err));

    return NextResponse.json(updatedTicket);
  } catch (error: any) {
    console.error('Error in approve route:', error);
    return NextResponse.json(
      { error: error?.message || 'Wystąpił błąd podczas zapisywania decyzji.' },
      { status: 500 }
    );
  }
}
