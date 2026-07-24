import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET() {
  try {
    const pendingKaizenCount = await prisma.kaizen.count({
      where: { status: 'PENDING' }
    });

    const pendingTasksCount = await prisma.observation.count({
      where: {
        isFixed: false,
        AND: [
          { NOT: { severity: 'POSITIVE' } },
          { NOT: { severity: { contains: 'Pozytyw' } } },
          { NOT: { severity: { contains: 'Dobra Praktyka' } } },
        ]
      }
    });

    const openFaultReportsCount = await prisma.faultReport.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS', 'HOLD'] } }
    });

    const openBhpHazardsCount = await prisma.bhpHazardReport.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
    });

    const openQualityReportsCount = await prisma.qualityReport.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
    });

    return NextResponse.json({
      pendingKaizens: pendingKaizenCount,
      pendingTasks: pendingTasksCount,
      openFaultReports: openFaultReportsCount,
      openBhpHazards: openBhpHazardsCount,
      openQualityReports: openQualityReportsCount,
    });
  } catch (error: any) {
    return NextResponse.json({ pendingKaizens: 0, pendingTasks: 0, openFaultReports: 0, openBhpHazards: 0, openQualityReports: 0 });
  }
}
