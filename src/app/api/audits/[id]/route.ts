import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { checkIsAdmin } from '@/lib/auth';

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
      data: { status: body.status }
    });
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
