import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET() {
  try {
    const [
      kaizenTotal,
      kaizenPending,
      kaizenApproved,
      kaizenPointsResult,
      faultsTotal,
      faultsOpen,
      faultsResolved,
      faultsCritical,
      auditsTotal,
      auditsCompleted,
      auditsInProgress,
      pendingTasksCount,
      bhpTotal,
      bhpOpen,
      bhpCritical,
      bhpResolved,
      qualityTotal,
      qualityOpen,
      qualityCritical,
      qualityResolved
    ] = await Promise.all([
      prisma.kaizen.count(),
      prisma.kaizen.count({ where: { status: 'PENDING' } }),
      prisma.kaizen.count({ where: { status: 'APPROVED' } }),
      prisma.kaizen.aggregate({ _sum: { pointsAwarded: true } }),
      prisma.faultReport.count(),
      prisma.faultReport.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'HOLD'] } } }),
      prisma.faultReport.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.faultReport.count({ where: { severity: 'CRITICAL', status: { in: ['OPEN', 'IN_PROGRESS', 'HOLD'] } } }),
      prisma.audit.count(),
      prisma.audit.count({ where: { status: 'COMPLETED' } }),
      prisma.audit.count({ where: { status: { in: ['DRAFT', 'IN_PROGRESS'] } } }),
      prisma.observation.count({
        where: {
          isFixed: false,
          AND: [
            { NOT: { severity: 'POSITIVE' } },
            { NOT: { severity: { contains: 'Pozytyw' } } },
            { NOT: { severity: { contains: 'Dobra Praktyka' } } },
          ]
        }
      }),
      prisma.bhpHazardReport.count(),
      prisma.bhpHazardReport.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.bhpHazardReport.count({ where: { severity: 'CRITICAL', status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.bhpHazardReport.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.qualityReport.count(),
      prisma.qualityReport.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.qualityReport.count({ where: { severity: 'CRITICAL', status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.qualityReport.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } })
    ]);

    return NextResponse.json({
      kaizen: {
        total: kaizenTotal,
        pending: kaizenPending,
        approved: kaizenApproved,
        totalPoints: kaizenPointsResult._sum.pointsAwarded || 0,
      },
      faults: {
        total: faultsTotal,
        open: faultsOpen,
        resolved: faultsResolved,
        critical: faultsCritical,
      },
      audits: {
        total: auditsTotal,
        completed: auditsCompleted,
        inProgress: auditsInProgress,
        pendingTasks: pendingTasksCount,
      },
      bhp: {
        total: bhpTotal,
        open: bhpOpen,
        critical: bhpCritical,
        resolved: bhpResolved,
      },
      quality: {
        total: qualityTotal,
        open: qualityOpen,
        critical: qualityCritical,
        resolved: qualityResolved,
      }
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({
      kaizen: { total: 0, pending: 0, approved: 0, totalPoints: 0 },
      faults: { total: 0, open: 0, resolved: 0, critical: 0 },
      audits: { total: 0, completed: 0, inProgress: 0, pendingTasks: 0 },
      bhp: { total: 0, open: 0, critical: 0, resolved: 0 },
      quality: { total: 0, open: 0, critical: 0, resolved: 0 },
    }, { status: 500 });
  }
}
