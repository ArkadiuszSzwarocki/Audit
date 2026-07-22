import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { ensureIfsAuditTypeWithQuestions } from '@/utils/seedIfsQuestions';
import { ensure5SAndHaccpAuditTypes } from '@/utils/seedDefaultAuditTypes';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Trigger seed if this is an IFS, 5S or HACCP audit type and has no questions yet
    const type = await prisma.auditType.findUnique({ where: { id } });
    if (type) {
      const nameLower = type.name.toLowerCase();
      if (nameLower.includes('ifs')) {
        await ensureIfsAuditTypeWithQuestions();
      } else if (nameLower.includes('5s') || nameLower.includes('haccp') || nameLower.includes('haccap')) {
        await ensure5SAndHaccpAuditTypes();
      }
    }

    const questions = await prisma.auditTypeQuestion.findMany({
      where: { auditTypeId: id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(questions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.questionText?.trim()) {
      return NextResponse.json({ error: 'Treść pytania jest wymagana' }, { status: 400 });
    }

    if (body.code?.trim()) {
      const existingCode = await prisma.auditTypeQuestion.findFirst({
        where: {
          auditTypeId: id,
          code: body.code.trim(),
        },
      });
      if (existingCode) {
        return NextResponse.json(
          { error: `Pytanie o kodzie "${body.code.trim()}" już istnieje w tej formatce! Podaj unikalny kod.` },
          { status: 400 }
        );
      }
    }

    // Determine max sortOrder
    const lastQ = await prisma.auditTypeQuestion.findFirst({
      where: { auditTypeId: id },
      orderBy: { sortOrder: 'desc' },
    });
    const nextSort = (lastQ?.sortOrder ?? 0) + 10;

    const question = await prisma.auditTypeQuestion.create({
      data: {
        auditTypeId: id,
        chapter: body.chapter || 'Ogólne',
        code: body.code || null,
        questionText: body.questionText.trim(),
        guidance: body.guidance || null,
        isKnockOut: Boolean(body.isKnockOut),
        sortOrder: body.sortOrder ?? nextSort,
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
