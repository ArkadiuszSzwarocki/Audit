import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { id, questionId } = await params;
    const body = await req.json();

    if (!body.questionText?.trim()) {
      return NextResponse.json({ error: 'Treść pytania jest wymagana' }, { status: 400 });
    }

    if (body.code?.trim()) {
      const existingCode = await prisma.auditTypeQuestion.findFirst({
        where: {
          auditTypeId: id,
          code: body.code.trim(),
          NOT: { id: questionId },
        },
      });
      if (existingCode) {
        return NextResponse.json(
          { error: `Pytanie o kodzie "${body.code.trim()}" już istnieje w tej formatce! Podaj unikalny kod.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.auditTypeQuestion.update({
      where: {
        id: questionId,
        auditTypeId: id,
      },
      data: {
        chapter: body.chapter ? body.chapter.trim() : 'Ogólne',
        code: body.code !== undefined ? (body.code ? body.code.trim() : null) : undefined,
        questionText: body.questionText.trim(),
        guidance: body.guidance !== undefined ? (body.guidance ? body.guidance.trim() : null) : undefined,
        isKnockOut: body.isKnockOut !== undefined ? Boolean(body.isKnockOut) : undefined,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Błąd edycji pytania' }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { id, questionId } = await params;

    await prisma.auditTypeQuestion.delete({
      where: {
        id: questionId,
        auditTypeId: id,
      },
    });

    return NextResponse.json({ success: true, message: 'Pytanie zostało usunięte' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Błąd usuwania pytania' }, { status: 400 });
  }
}
