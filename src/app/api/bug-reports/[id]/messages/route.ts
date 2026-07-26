import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthSession } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { message, attachmentUrl } = body;

    if (!message?.trim() && !attachmentUrl) {
      return NextResponse.json({ error: 'Treść wiadomości lub załącznik jest wymagany' }, { status: 400 });
    }

    const bugReport = await prisma.bugReport.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!bugReport) {
      return NextResponse.json({ error: 'Nie znaleziono zgłoszenia problemu' }, { status: 404 });
    }

    // Check access
    if (!session.isAdmin && bugReport.createdById !== session.id) {
      return NextResponse.json({ error: 'Brak uprawnień do prowadzenia tej dyskusji' }, { status: 403 });
    }

    // Create the message
    const newMessage = await prisma.bugReportMessage.create({
      data: {
        bugReportId: bugReport.id,
        senderId: session.id,
        message: message?.trim() || '',
        attachmentUrl: attachmentUrl || null,
      },
      include: {
        sender: {
          select: { id: true, name: true, login: true, role: true }
        }
      }
    });

    // Update unread flag and updatedAt timestamp on the bug report
    // If Admin replied -> set unreadForUser = true (only that user gets notified!)
    // If User replied -> set unreadForAdmin = true
    const isSenderAdmin = session.isAdmin;
    const isSenderOwner = session.id === bugReport.createdById;

    await prisma.bugReport.update({
      where: { id: bugReport.id },
      data: {
        updatedAt: new Date(),
        ...(isSenderAdmin ? { unreadForUser: true, unreadForAdmin: false } : {}),
        ...(isSenderOwner && !isSenderAdmin ? { unreadForAdmin: true, unreadForUser: false } : {}),
      }
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    console.error('Error posting bug report message:', error);
    return NextResponse.json({ error: error.message || 'Błąd wysyłania wiadomości' }, { status: 500 });
  }
}
