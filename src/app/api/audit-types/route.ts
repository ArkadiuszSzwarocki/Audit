import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { ensureIfsAuditTypeWithQuestions } from '@/utils/seedIfsQuestions';
import { ensure5SAndHaccpAuditTypes } from '@/utils/seedDefaultAuditTypes';

export async function GET() {
  try {
    await ensureIfsAuditTypeWithQuestions();
    await ensure5SAndHaccpAuditTypes();

    const auditTypes = await prisma.auditType.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(auditTypes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const auditType = await prisma.auditType.create({
      data: {
        name: data.name,
        description: data.description
      }
    });
    return NextResponse.json(auditType, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
