import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { sendHelpDeskNotification, sendApprovalRequestToManagement } from '@/lib/mailer';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentDbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { role: true }
    });
    const currentRoleUpper = String(currentDbUser?.role || session.role || '').toUpperCase();
    const canSeeAllTickets = session.isAdmin || session.isZarzad || ['ADMIN', 'ZARZAD', 'ZARZĄD', 'DIRECTOR', 'MANAGER', 'IT', 'IT HELP DESK', 'HELPDESK'].includes(currentRoleUpper);

    // Dla zarządu, administratorów oraz pracowników zespołu Help Desk pokazuj wszystkie tickety.
    // Dla zwykłych użytkowników pokazuj tylko te stworzone przez nich lub przydzielone do nich.
    const tickets = await prisma.helpDeskTicket.findMany({
      where: canSeeAllTickets ? {} : {
        OR: [
          { createdById: session.id },
          { assignedToId: session.id }
        ]
      },
      include: {
        createdBy: { select: { id: true, name: true, login: true, email: true } },
        approvedBy: { select: { id: true, name: true, login: true } },
        assignedTo: { select: { id: true, name: true, login: true, email: true } },
        assignedBy: { select: { id: true, name: true, login: true } },
        history: {
          include: { user: { select: { id: true, name: true, login: true, email: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tickets);
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  console.log('DEBUG - Help Desk API - Session:', session);
  if (!session) {
    console.log('DEBUG - Help Desk API - No session, returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, type, priority } = await req.json();

    if (!title || !description || !type || !priority) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('DEBUG - Help Desk API - Creating ticket with createdById:', session.id);
    
    // Dla ticketów PURCHASE ustaw status PENDING_APPROVAL
    const ticketStatus = type === 'PURCHASE' ? 'PENDING_APPROVAL' : 'OPEN';
    
    const newTicket = await prisma.helpDeskTicket.create({
      data: {
        title,
        description,
        type,
        priority,
        status: ticketStatus,
        createdById: session.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, login: true, email: true } },
        approvedBy: { select: { id: true, name: true, login: true } },
        assignedTo: { select: { id: true, name: true, login: true, email: true } },
        assignedBy: { select: { id: true, name: true, login: true } },
        history: {
          include: { user: { select: { id: true, name: true, login: true, email: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Wysyłka powiadomień e-mail w tle (non-blocking) dla natychmiastowej odpowiedzi API
    (async () => {
      // Dla PURCHASE ticketów wyślij powiadomienie o zatwierdzenie do Zarządu
      if (type === 'PURCHASE') {
        try {
          console.log(`Sending approval request to management for PURCHASE ticket ${newTicket.id}`);
          await sendApprovalRequestToManagement(
            newTicket.id,
            newTicket.title,
            newTicket.description,
            newTicket.createdBy?.name || 'Nieznany użytkownik',
            { priority, createdAt: new Date().toLocaleString('pl-PL') }
          );
        } catch (emailError) {
          console.error('Error sending approval request to management:', emailError);
        }
      }

      // Wyślij e-mail z formularzem nowego zgłoszenia do zespołu Help Desk oraz zgłaszającego
      try {
        const config = await prisma.helpDeskConfig.findUnique({
          where: { id: 'singleton' }
        });

        const recipients: string[] = [];
        if (config?.isEmailEnabled && config?.notifyOnNewTicket && config?.helpDeskEmail) {
          recipients.push(config.helpDeskEmail);
        }
        if (newTicket.createdBy?.email && !recipients.includes(newTicket.createdBy.email)) {
          recipients.push(newTicket.createdBy.email);
        }

        if (recipients.length > 0) {
          console.log(`Sending new ticket form email notification for ${newTicket.id} to:`, recipients);
          await sendHelpDeskNotification(
            newTicket.id,
            newTicket.title,
            'NEW_TICKET',
            recipients,
            {
              description: newTicket.description,
              createdBy: newTicket.createdBy?.name || 'Nieznany użytkownik',
              type: newTicket.type,
              priority: newTicket.priority
            }
          );
        }
      } catch (emailError) {
        console.error('Error sending Help Desk notification:', emailError);
      }
    })().catch(err => console.error('Background ticket creation email error:', err));

    return NextResponse.json(newTicket, { status: 201 });
  } catch (error: any) {
    console.error('Error creating ticket:', error.message);
    console.error('Error details:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
