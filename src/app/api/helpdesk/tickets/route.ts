import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { sendMail } from '@/lib/mailer';
import { getAuthSession } from '@/lib/auth';

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
    const newTicket = await prisma.helpDeskTicket.create({
      data: {
        title,
        description,
        type,
        priority,
        createdById: session.id,
      },
    });

    // TODO: Wysyłanie e-maila (tymczasowo wyłączone do debugowania)
    // const userEmail = session.login || 'Nieznany email';
    // let recipientEmail: string | undefined;
    // if (newTicket.type === 'PROBLEM') {
    //   recipientEmail = process.env.IT_EMAIL;
    // } else if (newTicket.type === 'PURCHASE') {
    //   recipientEmail = process.env.MANAGEMENT_EMAIL;
    // }
    // if (recipientEmail) {
    //   await sendMail({...});
    // }

    return NextResponse.json(newTicket, { status: 201 });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
