import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { ensureIfsAuditTypeWithQuestions } from '@/utils/seedIfsQuestions';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        auditType: true,
        answers: {
          include: { question: true },
        },
      },
    });

    if (!audit) {
      return NextResponse.json({ error: 'Audyt nie istnieje' }, { status: 404 });
    }

    // Auto-seed IFS questions if type is IFS
    if (audit.auditType && audit.auditType.name.toLowerCase().includes('ifs')) {
      await ensureIfsAuditTypeWithQuestions();
    }

    let questions: any[] = [];
    if (audit.auditTypeId) {
      questions = await prisma.auditTypeQuestion.findMany({
        where: { auditTypeId: audit.auditTypeId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
    }

    // Map existing answers to questions
    const answerMap = new Map(audit.answers.map(a => [a.questionId, a]));

    const checklist = questions.map(q => {
      const existingAnswer = answerMap.get(q.id);
      return {
        questionId: q.id,
        chapter: q.chapter,
        code: q.code,
        questionText: q.questionText,
        guidance: q.guidance,
        isKnockOut: q.isKnockOut,
        status: existingAnswer?.status || 'PENDING',
        severity: existingAnswer?.severity || null,
        comment: existingAnswer?.comment || '',
        photoUrl: existingAnswer?.photoUrl || null,
        answerId: existingAnswer?.id || null,
      };
    });

    return NextResponse.json({
      auditId: audit.id,
      auditTitle: audit.title,
      auditTypeName: audit.auditType?.name || 'Standardowy',
      checklist,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: auditId } = await params;
    const body = await req.json();

    const { questionId, status, comment, photoUrl, severity } = body;

    if (!questionId || !status) {
      return NextResponse.json({ error: 'Brak questionId lub statusu' }, { status: 400 });
    }

    const targetAudit = await prisma.audit.findUnique({ where: { id: auditId } });
    if (targetAudit?.status === 'COMPLETED') {
      const adminCookie = req.cookies.get('admin_session')?.value;
      const userRoleHeader = req.headers.get('x-user-role');
      const isAdmin = adminCookie === 'true' || userRoleHeader === 'ADMIN';
      if (!isAdmin) {
        return NextResponse.json({ error: 'Audyt jest zamknięty. Tylko Administrator posiada uprawnienia do jego edycji.' }, { status: 403 });
      }
    }

    const chosenSeverity = status === 'NOK' ? (severity || '🔴 Krytyczna Niezgodność') : null;

    // Upsert answer
    const answer = await prisma.auditQuestionAnswer.upsert({
      where: {
        auditId_questionId: { auditId, questionId },
      },
      update: {
        status,
        severity: chosenSeverity,
        comment: comment ?? null,
        photoUrl: photoUrl ?? null,
      },
      create: {
        auditId,
        questionId,
        status,
        severity: chosenSeverity,
        comment: comment ?? null,
        photoUrl: photoUrl ?? null,
      },
      include: { question: true },
    });

    let isAuditCompletedDueToKO = false;

    // If NOK (Niezgodne), auto-create or sync Observation task so it appears in Zadania Produkcji!
    if (status === 'NOK') {
      const q = answer.question;
      const chosenSeverity = severity || (q.isKnockOut ? '🔴 IFS KO (Knock-Out)' : '🔴 Krytyczna Niezgodność');
      const isKO = chosenSeverity.includes('KO') || chosenSeverity.includes('Knock-Out') || q.isKnockOut;

      const desc = `[${isKO ? '🔴 NARUSZENIE KO' : 'Niezgodność'} ${q.code || ''}] ${q.questionText}${comment ? ` - Uwaga: ${comment}` : ''}`;

      // Check if observation for this question already created
      const existingObs = await prisma.observation.findFirst({
        where: {
          auditId,
          description: { contains: q.questionText },
        },
      });

      if (!existingObs) {
        await prisma.observation.create({
          data: {
            auditId,
            description: desc,
            severity: chosenSeverity,
            photoUrl: photoUrl ?? null,
            aiSuggestion: q.guidance ? `Wymóg IFS KO: ${q.guidance}` : null,
          },
        });
      } else {
        await prisma.observation.update({
          where: { id: existingObs.id },
          data: {
            severity: chosenSeverity,
            description: desc,
            photoUrl: photoUrl ?? existingObs.photoUrl,
          },
        });
      }

      // If it is a Knock-Out (KO) failure, automatically mark audit as COMPLETED (Oblany / Negatywny)
      if (isKO) {
        await prisma.audit.update({
          where: { id: auditId },
          data: { status: 'COMPLETED' },
        });
        isAuditCompletedDueToKO = true;
      }
    }

    return NextResponse.json({
      ...answer,
      isAuditCompletedDueToKO,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
