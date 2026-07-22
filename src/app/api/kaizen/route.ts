import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET() {
  try {
    const kaizens = await prisma.kaizen.findMany({
      include: {
        area: true,
        machine: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(kaizens);
  } catch (error) {
    console.error("GET /api/kaizen Error:", error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const kaizen = await prisma.kaizen.create({
      data: {
        title: body.title,
        description: body.description,
        benefits: body.benefits,
        submittedBy: body.submittedBy,
        areaId: body.areaId,
        machineId: body.machineId,
        photoUrl: body.photoUrl,
      }
    });
    return NextResponse.json(kaizen);
  } catch (error) {
    console.error("POST /api/kaizen Error:", error);
    return NextResponse.json({ error: 'Nie udało się zapisać pomysłu' }, { status: 500 });
  }
}
