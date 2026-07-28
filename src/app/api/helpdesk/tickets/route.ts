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
    const currentRoleUpper = String(currentDbUser?.role || '').toUpperCase();
    const isManagementUser = session.isAdmin || session.isZarzad || currentRoleUpper === 'ADMIN' || currentRoleUpper === 'ZARZAD' || currentRoleUpper === 'ZARZĄD' || currentRoleUpper === 'DIRECTOR' || currentRoleUpper === 'MANAGER';

    // Dla zarządu i administratorów pokazuj wszystkie tickety, bo muszą zatwierdzać i nadzorować workflow.
    // Dla pozostałych użytkowników pokazuj tylko te stworzone przez nich lub przydzielone do nich.
    const tickets = await prisma.helpDeskTicket.findMany({
      where: isManagementUser ? {} : {
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

    // Dla PURCHASE ticketów wyślij powiadomienie do Zarządu
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

    // Send Help Desk notification email if enabled
    try {
      const config = await prisma.helpDeskConfig.findUnique({
        where: { id: 'singleton' }
      });

      if (config?.isEmailEnabled && config?.notifyOnNewTicket && config?.helpDeskEmail) {
        console.log(`Sending Help Desk notification for new ticket ${newTicket.id} to ${config.helpDeskEmail}`);
        
        await sendHelpDeskNotification(
          newTicket.id,
          newTicket.title,
          'NEW_TICKET',
          config.helpDeskEmail,
          {
            description: newTicket.description,
            createdBy: newTicket.createdBy?.name || 'Nieznany użytkownik',
            type: newTicket.type,
            priority: newTicket.priority
          }
        );
      }
    } catch (emailError) {
      // Log email error but don't fail the ticket creation
      console.error('Error sending Help Desk notification:', emailError);
    }

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
