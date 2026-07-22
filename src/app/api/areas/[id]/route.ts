import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.area.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Nie udało się usunąć rejonu' }, { status: 500 });
  }
}
