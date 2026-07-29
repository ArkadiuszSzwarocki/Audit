import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { sendHelpDeskNotification, sendApprovedNotificationToHelpDesk, sendChatMessageNotification } from '@/lib/mailer';
import { getAuthSession } from '@/lib/auth';
import { verifyTicketToken } from '@/lib/ticket-token';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Check if token is provided (from email link)
    const token = req.nextUrl.searchParams.get('token');
    const hasValidToken = token ? verifyTicketToken(token, id) : false;

    // If no valid token, require authentication
    if (!hasValidToken) {
      const session = await getAuthSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized - Valid token or login required' }, { status: 401 });
      }

      console.log('GET /api/helpdesk/tickets/[id] - Session:', {
        id: session.id,
        name: session.name,
        role: session.role,
      });

      const ticket = await prisma.helpDeskTicket.findUnique({
        where: { id },
        include: {
          createdBy: { select: { id: true, name: true, login: true, email: true } },
          approvedBy: { select: { id: true, name: true, login: true } },
          assignedTo: { select: { id: true, name: true, login: true, email: true } },
          assignedBy: { select: { id: true, name: true, login: true } },
          history: {
            include: {
              user: { select: { id: true, name: true, login: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      // Check permissions
      const currentUser = await prisma.user.findUnique({
        where: { id: session.id },
        select: { role: true },
      });
      const currentRole = String(currentUser?.role || session.role || '').toUpperCase();
      const isAdmin = currentRole === 'ADMIN' || currentRole === 'DIRECTOR' || currentRole === 'MANAGER' || currentRole === 'ZARZAD' || currentRole === 'ZARZĄD';
      const isIT = currentRole === 'IT' || currentRole === 'IT HELP DESK' || currentRole === 'HELPDESK';
      if (ticket.createdById !== session.id && !isAdmin && !isIT) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json(ticket);
    }

    // If valid token, allow access without authentication
    const ticket = await prisma.helpDeskTicket.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, login: true, email: true } },
        approvedBy: { select: { id: true, name: true, login: true } },
        assignedTo: { select: { id: true, name: true, login: true, email: true } },
        assignedBy: { select: { id: true, name: true, login: true } },
        history: {
          include: {
            user: { select: { id: true, name: true, login: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error: any) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Check if token is provided (from email link)
    const token = req.nextUrl.searchParams.get('token');
    const hasValidToken = token ? verifyTicketToken(token, id) : false;

    // Get session for logging and user verification
    const session = hasValidToken ? null : await getAuthSession();
    
    if (!hasValidToken && !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Note: Session user may not exist in User table for dev/testing
    // We'll check once and reuse the result for history creation
    let canCreateHistory = false;
    if (session) {
      const userExists = await prisma.user.findUnique({
        where: { id: session.id },
        select: { id: true }
      });
      canCreateHistory = !!userExists;
      
      if (!userExists) {
        console.log(`Session user ${session.id} not in database - history entries will be skipped`);
      }
      
      console.log('PATCH /api/helpdesk/tickets/[id] - Session:', {
        id: session.id,
        name: session.name,
        role: session.role,
        canCreateHistory,
      });
    } else {
      console.log('PATCH /api/helpdesk/tickets/[id] - Token-based access');
    }

    const {
      status,
      estimatedDueDate,
      resolutionNotes,
      assignedToId,
      readByHelpDesk,
      realizationStartedAt,
      realizedAt,
      message,
      currentUserId,
    } = await req.json();

    // Pobierz ticket aby sprawdzić czy należy do użytkownika
    const ticket = await prisma.helpDeskTicket.findUnique({
      where: { id },
      include: { createdBy: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Sprawdź czy użytkownik jest właścicielem ticketu lub adminem
    // Token-based access allows approval, session-based requires ownership or admin or IT assigned
    let isStatusChangeBlocked = false;
    let isDateBlocked = false;
    if (session) {
      // Fetch current user role from database (JWT may be stale)
      const currentUser = await prisma.user.findUnique({
        where: { id: session.id },
        select: { role: true },
      });
      
      const currentRole = String(currentUser?.role || session.role || '').toUpperCase();
      const isAdmin = currentRole === 'ADMIN' || currentRole === 'DIRECTOR' || currentRole === 'MANAGER' || currentRole === 'ZARZAD' || currentRole === 'ZARZĄD';
      const isIT = currentRole === 'IT' || currentRole === 'IT HELP DESK' || currentRole === 'HELPDESK';
      const requiresManagementApproval = ticket.type === 'PURCHASE' && ticket.status === 'PENDING_APPROVAL' && ticket.isApprovedByManager !== true;
      isDateBlocked = isIT && !isAdmin && requiresManagementApproval;
      isStatusChangeBlocked = isDateBlocked && status !== undefined && status !== ticket.status;
      
      console.log('PATCH PERMISSION CHECK:', {
        sessionId: session.id,
        sessionRole: session.role,
        currentRole,
        ticketCreatedById: ticket.createdById,
        ticketAssignedToId: ticket.assignedToId,
        isAdmin,
        isIT,
        requiresManagementApproval,
        isDateBlocked,
        hasPermission: (ticket.createdById === session.id || isAdmin || isIT),
      });
      
      if (status === 'PENDING_APPROVAL' && ticket.status !== 'PENDING_APPROVAL') {
        return NextResponse.json({ error: 'Nie można przywrócić statusu Oczekuje po zmianie na inny status.' }, { status: 400 });
      }

      if (isIT && !isAdmin && status === 'APPROVED') {
        return NextResponse.json({ error: 'Status "Zatwierdzono" może być nadany wyłącznie przez Zarząd.' }, { status: 403 });
      }

      if (ticket.createdById !== session.id && !isAdmin && !isIT) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Zablokuj edycję i dodawanie wiadomości na czacie jeśli zgłoszenie jest zamknięte (status CLOSED)
    if (ticket.status === 'CLOSED' && (status !== undefined || estimatedDueDate !== undefined || realizationStartedAt !== undefined || realizedAt !== undefined || (message !== undefined && String(message).trim()))) {
      return NextResponse.json(
        { error: 'Zgłoszenie zostało zamknięte. Edycja pól oraz czat są zablokowane.' },
        { status: 400 }
      );
    }

    // Przygotuj dane do aktualizacji i historię
    const updateData: any = {};
    const historyEntries = [];
    const actorUserId = session?.id || (typeof currentUserId === 'string' && currentUserId.trim()
      ? currentUserId
      : undefined);

    if (status !== undefined && status !== ticket.status && !isStatusChangeBlocked) {
      const isApprovalAction = status === 'APPROVED' || status === 'REJECTED';
      const finalDueDate = estimatedDueDate !== undefined
        ? (estimatedDueDate ? new Date(estimatedDueDate) : null)
        : ticket.estimatedDueDate;

      if (!finalDueDate && !isApprovalAction) {
        return NextResponse.json(
          { error: 'Podanie terminu realizacji jest wymagane przy zmianie statusu zgłoszenia.' },
          { status: 400 }
        );
      }

      updateData.status = status;
      if (status === 'APPROVED' || status === 'REJECTED') {
        updateData.isApprovedByManager = (status === 'APPROVED');
        updateData.approvedById = session?.id || actorUserId || null;
        updateData.approvalDate = new Date();
      }
      if (canCreateHistory) {
        historyEntries.push({
          ticketId: id,
          changedBy: actorUserId || session!.id,
          field: 'status',
          oldValue: ticket.status,
          newValue: status,
        });
      }

      // Automatyczne przypisanie daty rozpoczęcia realizacji dla statusu OPEN lub IN_PROGRESS, jeśli nie została jeszcze ustawiona
      if ((status === 'OPEN' || status === 'IN_PROGRESS') && !ticket.realizationStartedAt && realizationStartedAt === undefined && !isDateBlocked) {
        const autoStartDate = new Date();
        updateData.realizationStartedAt = autoStartDate;
        if (canCreateHistory) {
          historyEntries.push({
            ticketId: id,
            changedBy: actorUserId || session!.id,
            field: 'realizationStartedAt',
            oldValue: null,
            newValue: autoStartDate.toISOString(),
          });
        }
      }
    }

    if (estimatedDueDate !== undefined && !isDateBlocked) {
      const newDate = estimatedDueDate ? new Date(estimatedDueDate) : null;
      if (newDate?.toISOString() !== ticket.estimatedDueDate?.toISOString()) {
        updateData.estimatedDueDate = newDate;
        if (canCreateHistory) {
          historyEntries.push({
            ticketId: id,
            changedBy: actorUserId || session!.id,
            field: 'estimatedDueDate',
            oldValue: ticket.estimatedDueDate?.toISOString() || null,
            newValue: newDate?.toISOString() || null,
          });
        }
      }
    }

    if (resolutionNotes !== undefined && resolutionNotes !== ticket.resolutionNotes) {
      updateData.resolutionNotes = resolutionNotes;
      if (canCreateHistory) {
        historyEntries.push({
          ticketId: id,
          changedBy: actorUserId || session!.id,
          field: 'resolutionNotes',
          oldValue: ticket.resolutionNotes || null,
          newValue: resolutionNotes || null,
        });
      }
    }

    if (message !== undefined && String(message).trim()) {
      const trimmedMessage = String(message).trim();
      if (canCreateHistory) {
        historyEntries.push({
          ticketId: id,
          changedBy: actorUserId || session!.id,
          field: 'message',
          oldValue: null,
          newValue: trimmedMessage,
        });
      }
    }

    // Track assignment changes
    if (assignedToId !== undefined && assignedToId !== ticket.assignedToId) {
      updateData.assignedToId = assignedToId || null;
      if (assignedToId) {
        updateData.assignedById = session?.id;
        updateData.assignedAt = new Date();
      }
      if (canCreateHistory) {
        historyEntries.push({
          ticketId: id,
          changedBy: actorUserId || session!.id,
          field: 'assignedTo',
          oldValue: ticket.assignedToId || null,
          newValue: assignedToId || null,
        });
      }
    }

    // Track read status changes
    if (readByHelpDesk !== undefined && readByHelpDesk !== ticket.readByHelpDesk) {
      updateData.readByHelpDesk = readByHelpDesk;
      if (readByHelpDesk) {
        updateData.readByHelpDeskAt = new Date();
      }
      if (canCreateHistory) {
        historyEntries.push({
          ticketId: id,
          changedBy: actorUserId || session!.id,
          field: 'readByHelpDesk',
          oldValue: String(ticket.readByHelpDesk),
          newValue: String(readByHelpDesk),
        });
      }
    }

    // Track realization start
    if (realizationStartedAt !== undefined && !isDateBlocked) {
      const newStartDate = realizationStartedAt ? new Date(realizationStartedAt) : null;
      if (newStartDate?.toISOString() !== ticket.realizationStartedAt?.toISOString()) {
        updateData.realizationStartedAt = newStartDate;
        if (canCreateHistory) {
          historyEntries.push({
            ticketId: id,
            changedBy: actorUserId || session!.id,
            field: 'realizationStartedAt',
            oldValue: ticket.realizationStartedAt?.toISOString() || null,
            newValue: newStartDate?.toISOString() || null,
          });
        }
      }
    }

    // Track realization end
    if (realizedAt !== undefined && !isDateBlocked) {
      const newRealizedDate = realizedAt ? new Date(realizedAt) : null;
      if (newRealizedDate?.toISOString() !== ticket.realizedAt?.toISOString()) {
        updateData.realizedAt = newRealizedDate;
        if (canCreateHistory) {
          historyEntries.push({
            ticketId: id,
            changedBy: actorUserId || session!.id,
            field: 'realizedAt',
            oldValue: ticket.realizedAt?.toISOString() || null,
            newValue: newRealizedDate?.toISOString() || null,
          });
        }
      }
    }

    // Jeśli status zmienia się na CLOSED, automatycznie przypisz datę zakończenia realizacji (realizedAt) oraz closedAt
    if (status === 'CLOSED' && ticket.status !== 'CLOSED') {
      const now = new Date();
      updateData.closedAt = now;

      if (!ticket.realizedAt && !updateData.realizedAt) {
        updateData.realizedAt = now;
        if (canCreateHistory) {
          historyEntries.push({
            ticketId: id,
            changedBy: actorUserId || session!.id,
            field: 'realizedAt',
            oldValue: null,
            newValue: now.toISOString(),
          });
        }
      }
    }

    // Aktualizuj ticket i dodaj do historii w jednej transakcji
    const updatedTicket = await prisma.helpDeskTicket.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true } },
      },
    });

    // Dodaj wpisy do historii
    if (historyEntries.length > 0) {
      try {
        console.log('Creating history entries:', JSON.stringify(historyEntries, null, 2));
        await prisma.helpDeskTicketHistory.createMany({
          data: historyEntries,
        });
      } catch (historyError) {
        console.error('Error creating history entries:', historyError);
        // Don't fail the ticket update if history fails
      }
    }

    const refreshedTicket = await prisma.helpDeskTicket.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true } },
        history: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const ticketToReturn = refreshedTicket || updatedTicket;

    // Send email notifications asynchronously in the background so HTTP response returns instantly
    (async () => {
      // Send email notification for chat message if message was posted
      if (message !== undefined && String(message).trim()) {
        try {
          const trimmedMessage = String(message).trim();
          const senderUser = session?.id
            ? await prisma.user.findUnique({ where: { id: session.id }, select: { name: true } })
            : null;
          const senderName = senderUser?.name || 'Użytkownik';

          await sendChatMessageNotification(
            id,
            ticketToReturn.title,
            senderName,
            trimmedMessage,
            ticketToReturn,
            session?.id || actorUserId
          );
        } catch (chatEmailErr) {
          console.error('Error sending chat message email notification:', chatEmailErr);
        }
      }

      // Send Help Desk notification email if enabled
      try {
        const config = await prisma.helpDeskConfig.findUnique({
          where: { id: 'singleton' }
        });

        if (config?.isEmailEnabled && config?.helpDeskEmail) {
          // Send notification for status change
          if (status !== undefined && status !== ticket.status && config.notifyOnStatusChange) {
            console.log(`Sending status change notification for ticket ${id}`);
            await sendHelpDeskNotification(
              id,
              updatedTicket.title,
              'STATUS_CHANGE',
              config.helpDeskEmail,
              {
                oldStatus: ticket.status,
                newStatus: status
              }
            );
          }

          // Wysłanie powiadomienia do Help Desk gdy Zarząd zatwierdzi PURCHASE ticket
          if (ticket.type === 'PURCHASE' && status === 'APPROVED' && ticket.status === 'PENDING_APPROVAL') {
            console.log(`Sending approval notification to Help Desk for PURCHASE ticket ${id}`);
            try {
              await sendApprovedNotificationToHelpDesk(
                id,
                updatedTicket.title,
                updatedTicket.description,
                updatedTicket.createdBy?.name || 'Nieznany użytkownik',
                session?.name || 'Zarząd (email approval)'
              );
            } catch (emailError) {
              console.error('Error sending approval notification to Help Desk:', emailError);
            }
          }

          // Send notification for assignment
          if (assignedToId !== undefined && assignedToId !== ticket.assignedToId && config.notifyOnAssignment) {
            console.log(`Sending assignment notification for ticket ${id}`);
            const assignedUser = assignedToId ? await prisma.user.findUnique({
              where: { id: assignedToId },
              select: { name: true }
            }) : null;

            await sendHelpDeskNotification(
              id,
              updatedTicket.title,
              'ASSIGNMENT',
              config.helpDeskEmail,
              {
                assignedBy: session?.name || 'Administrator',
                assignedTo: assignedUser?.name || 'Nieznany'
              }
            );
          }
        }
      } catch (emailError) {
        console.error('Error sending Help Desk notification:', emailError);
      }
    })().catch(err => console.error('Background email notification error:', err));

    return NextResponse.json(ticketToReturn);
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    const ticket = await prisma.helpDeskTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Only admin or creator can delete
    const isAdmin = session.role === 'ADMIN' || session.role === 'DIRECTOR';
    if (ticket.createdById !== session.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete associated history entries first
    await prisma.helpDeskTicketHistory.deleteMany({
      where: { ticketId: id },
    });

    // Delete the ticket
    await prisma.helpDeskTicket.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Ticket deleted' });
  } catch (error: any) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}
