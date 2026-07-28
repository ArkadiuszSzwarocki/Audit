import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/config/db';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only admin can view config
    if (session.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin only' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let config = await prisma.helpDeskConfig.findUnique({
      where: { id: 'singleton' }
    });

    // Create default config if doesn't exist
    if (!config) {
      config = await prisma.helpDeskConfig.create({
        data: {
          id: 'singleton',
          helpDeskEmail: process.env.HELPDESK_EMAIL || 'arkadiusz.szwarocki@wp.pl',
          replyToEmail: process.env.EMAIL_FROM || 'dacklowicz@wp.pl',
          notifyOnNewTicket: true,
          notifyOnStatusChange: false,
          notifyOnAssignment: false,
          isEmailEnabled: false
        }
      });
    }

    return new Response(JSON.stringify(config), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching Help Desk config:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only admin can update config
    if (session.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin only' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const {
      helpDeskEmail,
      replyToEmail,
      notifyOnNewTicket,
      notifyOnStatusChange,
      notifyOnAssignment,
      isEmailEnabled
    } = body;

    // Validate emails
    if (helpDeskEmail && !helpDeskEmail.includes('@')) {
      return new Response(JSON.stringify({ error: 'Invalid Help Desk email' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (replyToEmail && !replyToEmail.includes('@')) {
      return new Response(JSON.stringify({ error: 'Invalid reply-to email' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let config = await prisma.helpDeskConfig.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      config = await prisma.helpDeskConfig.create({
        data: { id: 'singleton' }
      });
    }

    const updatedConfig = await prisma.helpDeskConfig.update({
      where: { id: 'singleton' },
      data: {
        ...(helpDeskEmail !== undefined && { helpDeskEmail }),
        ...(replyToEmail !== undefined && { replyToEmail }),
        ...(notifyOnNewTicket !== undefined && { notifyOnNewTicket }),
        ...(notifyOnStatusChange !== undefined && { notifyOnStatusChange }),
        ...(notifyOnAssignment !== undefined && { notifyOnAssignment }),
        ...(isEmailEnabled !== undefined && { isEmailEnabled })
      }
    });

    return new Response(JSON.stringify(updatedConfig), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating Help Desk config:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
