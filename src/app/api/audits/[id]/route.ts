import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { checkIsAdmin } from '@/lib/auth';
import { EmailService } from '@/services/EmailService';
import { buildAuditCompletionEmailHtml } from '@/utils/auditCompletionEmailBuilder';

const emailService = new EmailService();

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        area: true,
        machine: true,
        observations: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!audit) {
      return NextResponse.json({ error: 'Nie znaleziono audytu' }, { status: 404 });
    }

    return NextResponse.json(audit);
  } catch (error) {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const audit = await prisma.audit.update({
      where: { id },
      data: { status: body.status },
      include: {
        area: true,
        auditType: true,
        observations: true
      }
    });

    // Gdy audyt jest finalizowany (status = COMPLETED), wysłać powiadomienie
    if (body.status === 'COMPLETED') {
      try {
        // Pobierz użytkowników którzy chcą powiadomienia o audytach
        const recipients = await prisma.user.findMany({
          where: { notifyAudits: true }
        });

        if (recipients.length > 0) {
          // Oblicz wynik audytu
          const total = await prisma.auditQuestionAnswer.count({
            where: { auditId: id, status: { not: 'PENDING' } }
          });
          const okCount = await prisma.auditQuestionAnswer.count({
            where: { auditId: id, status: 'OK' }
          });
          const percentage = total > 0 ? Math.round((okCount / total) * 100) : 0;

          // Zbierz e-maile do wysłania
          const recipientEmails = recipients
            .map(u => u.email)
            .filter((email): email is string => Boolean(email));

          if (recipientEmails.length > 0) {
            // Buduj treść powiadomienia
            const emailHtml = buildAuditCompletionEmailHtml({
              id: audit.id,
              title: audit.title,
              areaName: audit.area?.name || 'Nieznana hala',
              auditTypeName: audit.auditType?.name || 'Standardowy',
              percentage,
              completedAt: new Date().toLocaleString('pl-PL'),
            });

            // Wyślij e-mail
            await emailService.sendMail({
              to: recipientEmails,
              subject: `[Audyt Zakończony] ${audit.title} - Hala: ${audit.area?.name || 'N/A'} - Wynik: ${percentage}%`,
              html: emailHtml,
            });
          }
        }
      } catch (emailErr) {
        console.error('Błąd wysyłania powiadomienia o zakończeniu audytu:', emailErr);
        // Nie przerwaj procesu jeśli wysłanie e-maila się nie powiedzie
      }
    }

    return NextResponse.json(audit);
  } catch (error) {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
    }

    const { id } = await context.params;
    await prisma.audit.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd podczas usuwania audytu' }, { status: 500 });
  }
}
