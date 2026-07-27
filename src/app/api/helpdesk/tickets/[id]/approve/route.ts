import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { sendMail } from '@/lib/mailer';
import { getAuth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuth(req);
  // Sprawdzenie, czy użytkownik ma uprawnienia zarządu (np. na podstawie roli)
  if (!user || user.role !== 'ADMIN') { // Załóżmy, że zarząd ma rolę ADMIN
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  const updatedTicket = await prisma.helpDeskTicket.update({
    where: { id },
    data: {
      status: approved ? 'APPROVED' : 'REJECTED',
      isApprovedByManager: approved,
      approvedById: user.id,
      managerComment,
      approvalDate: new Date(),
    },
  });

  // Wyślij e-mail do pracownika z decyzją
  if (ticket.createdBy.email) {
    await sendMail({
      to: ticket.createdBy.email,
      subject: `Twoje zapotrzebowanie #${ticket.id} zostało ${approved ? 'zaakceptowane' : 'odrzucone'}`,
      html: `
        <h1>Twoje zapotrzebowanie "${ticket.title}" zostało rozpatrzone.</h1>
        <p><strong>Decyzja:</strong> ${approved ? '✅ Zaakceptowane' : '❌ Odrzucone'}</p>
        ${managerComment ? `<p><strong>Komentarz zarządu:</strong> ${managerComment}</p>` : ''}
      `,
      text: `Twoje zapotrzebowanie "${ticket.title}" zostało ${approved ? 'zaakceptowane' : 'odrzucone'}.`,
    });
  }

  return NextResponse.json(updatedTicket);
}
