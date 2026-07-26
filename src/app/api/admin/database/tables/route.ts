import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') || 'audit';

    let data: any[] = [];
    let count = 0;

    switch (table) {
      case 'audit':
        data = await prisma.audit.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { area: true, machine: true, auditType: true, observations: true }
        });
        count = await prisma.audit.count();
        break;
      case 'observation':
        data = await prisma.observation.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { audit: true, assignedTo: true, extensions: true }
        });
        count = await prisma.observation.count();
        break;
      case 'extension':
        data = await prisma.observationExtension.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { observation: true }
        });
        count = await prisma.observationExtension.count();
        break;
      case 'user':
        data = await prisma.user.findMany({
          take: 50,
          where: { NOT: { login: { in: ['MasterAdmin', 'masteradmin'] } } },
          orderBy: { createdAt: 'desc' },
          select: { id: true, login: true, name: true, role: true, createdAt: true }
        });
        count = await prisma.user.count({
          where: { NOT: { login: { in: ['MasterAdmin', 'masteradmin'] } } }
        });
        break;
      case 'area':
        data = await prisma.area.findMany({
          take: 50,
          include: { machines: true }
        });
        count = await prisma.area.count();
        break;
      case 'auditType':
        data = await prisma.auditType.findMany({
          take: 50
        });
        count = await prisma.auditType.count();
        break;
      case 'kaizen':
        data = await prisma.kaizen.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' }
        });
        count = await prisma.kaizen.count();
        break;
      default:
        return NextResponse.json({ error: 'Nieznana tabela' }, { status: 400 });
    }

    return NextResponse.json({ table, count, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
