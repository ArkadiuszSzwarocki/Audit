import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const kaizen = await prisma.kaizen.findUnique({
      where: { id },
      include: {
        area: true,
        machine: true
      }
    });

    if (!kaizen) {
      return NextResponse.json({ error: 'Nie znaleziono zgłoszenia' }, { status: 404 });
    }

    return NextResponse.json(kaizen);
  } catch (error) {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.committeeNote !== undefined) updateData.committeeNote = body.committeeNote;
    if (body.pointsAwarded !== undefined && !isNaN(Number(body.pointsAwarded))) {
      updateData.pointsAwarded = Number(body.pointsAwarded);
    }
    if (body.pointsCategory !== undefined) updateData.pointsCategory = body.pointsCategory;
    
    const kaizen = await prisma.kaizen.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(kaizen);
  } catch (error: any) {
    console.error("PATCH /api/kaizen/[id] Error:", error);
    return NextResponse.json({ error: error?.message || 'Błąd podczas aktualizacji statusu' }, { status: 500 });
  }
}

import { checkIsAdmin } from '@/lib/auth';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
    }

    const { id } = await context.params;
    await prisma.kaizen.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd podczas usuwania wniosku' }, { status: 500 });
  }
}
