import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { EmailService, EmailAttachment } from '@/services/EmailService';
import { buildAuditReportEmailHtml } from '@/utils/auditReportEmailBuilder';
import path from 'path';
import fs from 'fs';

const emailService = new EmailService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const auditId = resolvedParams.id;
    const body = await request.json();

    const { recipientEmails, subject, customNote, attachPhotos = true } = body;

    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return NextResponse.json({ error: 'Podaj co najmniej jeden adres e-mail odbiorcy' }, { status: 400 });
    }

    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        area: true,
        machine: true,
        auditType: true,
        observations: {
          include: {
            assignedTo: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!audit) {
      return NextResponse.json({ error: 'Nie znaleziono audytu o podanym ID' }, { status: 404 });
    }

    // Attachments handling
    const attachments: EmailAttachment[] = [];

    if (attachPhotos) {
      audit.observations.forEach((obs, idx) => {
        if (obs.photoUrl) {
          const cleanPath = obs.photoUrl.startsWith('/') ? obs.photoUrl.slice(1) : obs.photoUrl;
          const fullPath = path.join(process.cwd(), 'public', cleanPath);

          if (fs.existsSync(fullPath)) {
            const ext = path.extname(fullPath) || '.jpg';
            attachments.push({
              filename: `Zalacznik_Usterka_${idx + 1}${ext}`,
              path: fullPath,
            });
          }
        }
      });
    }

    // Generate HTML
    const emailHtml = buildAuditReportEmailHtml({
      id: audit.id,
      title: audit.title,
      auditTypeName: audit.auditType?.name,
      createdAt: audit.createdAt,
      areaName: audit.area?.name,
      machineName: audit.machine?.name,
      customNote,
      observations: audit.observations.map(o => ({
        id: o.id,
        description: o.aiSuggestion || o.description,
        aiSuggestion: o.aiSuggestion,
        severity: o.severity,
        isFixed: o.isFixed,
        assignedToName: o.assignedTo?.name,
        dueDate: o.dueDate,
        photoUrl: o.photoUrl,
      })),
    });

    const defaultSubject = `[Raport Audytu] ${audit.title}`;
    const mailSubject = subject && subject.trim() ? subject.trim() : defaultSubject;

    const result = await emailService.sendMail({
      to: recipientEmails,
      subject: mailSubject,
      html: emailHtml,
      attachments,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      simulated: result.simulated,
    });
  } catch (error: any) {
    console.error('Błąd wysyłania raportu audytu przez e-mail:', error);
    return NextResponse.json({ error: error.message || 'Błąd wysyłania e-mail' }, { status: 500 });
  }
}
