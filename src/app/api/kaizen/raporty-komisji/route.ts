import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/config/db';
import { verifyJwtToken } from '@/lib/auth';

async function getAuthSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (sessionToken) {
    const payload = await verifyJwtToken(sessionToken);
    if (payload) {
      return {
        id: payload.id as string,
        name: payload.name as string,
        role: (payload.role as string) || 'OPERATOR',
      };
    }
  }
  return null;
}

// Calculate reward based on points according to tariff
function calculateRewardFromPoints(points: number): number {
  if (points === 0) return 0;
  if (points >= 1 && points <= 5) return 10;
  if (points >= 6 && points <= 10) return 50;
  if (points >= 11 && points <= 15) return 100;
  if (points >= 16 && points <= 20) return 150;
  if (points > 20) return 150 + (Math.floor((points - 20) / 5) * 50); // Additional 50 zł per 5 points above 20
  return 0;
}

export async function GET() {
  try {
    const user = await getAuthSession();
    const userRoleUpper = String(user?.role || '').toUpperCase();
    
    // Only commission members, board, and admin can access
    const isAllowed = userRoleUpper === 'ADMIN' || 
                      userRoleUpper === 'ADMINISTRATOR' || 
                      userRoleUpper === 'ZARZAD' || 
                      userRoleUpper === 'ZARZĄD' || 
                      userRoleUpper === 'KOMISJA KAIZEN' || 
                      userRoleUpper === 'KOMISJA_KAIZEN' || 
                      userRoleUpper === 'KAIZEN_COMMITTEE';

    if (!user || !isAllowed) {
      return NextResponse.json({ error: 'Brak uprawnień do przeglądania raportów' }, { status: 403 });
    }

    // Get all approved kaizens
    const approvedKaizens = await prisma.kaizen.findMany({
      where: { status: 'APPROVED' },
      select: { 
        id: true, 
        title: true, 
        pointsAwarded: true, 
        submittedBy: true, 
        isPaidOut: true,
        paidOutAt: true,
        payoutDocNum: true,
        createdAt: true,
      },
    });

    // Get all payout requests
    const payouts = await prisma.kaizenPayoutRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Calculate summary per employee from BOTH approved kaizens and payouts
    const employeeSummary = new Map<string, {
      userName: string;
      userLogin: string;
      totalPoints: number;
      totalAmount: number;
      pendingAmount: number;
      approvedAmount: number;
      rejectedAmount: number;
      unpaidPoints: number;
      unpaidRewardAmount: number;
      payoutCount: number;
      approvedPayoutCount: number;
      pendingPayoutCount: number;
      rejectedPayoutCount: number;
      lastPayoutDate?: string;
      bankAccount?: string | null;
    }>();

    // First: Process approved kaizens to calculate unpaid balance
    approvedKaizens.forEach((kaizen) => {
      const key = kaizen.submittedBy;
      const existing = employeeSummary.get(key) || {
        userName: kaizen.submittedBy,
        userLogin: kaizen.submittedBy.substring(0, 2).toUpperCase(),
        totalPoints: 0,
        totalAmount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        rejectedAmount: 0,
        unpaidPoints: 0,
        unpaidRewardAmount: 0,
        payoutCount: 0,
        approvedPayoutCount: 0,
        pendingPayoutCount: 0,
        rejectedPayoutCount: 0,
        lastPayoutDate: undefined,
        bankAccount: undefined,
      };

      existing.totalPoints += kaizen.pointsAwarded || 0;

      // If not yet paid out, add to unpaid points and calculate reward
      if (!kaizen.isPaidOut) {
        existing.unpaidPoints += kaizen.pointsAwarded || 0;
        const reward = calculateRewardFromPoints(kaizen.pointsAwarded || 0);
        existing.unpaidRewardAmount += reward;
        existing.pendingAmount += reward;
      } else {
        // If already paid out via payout request, it will be counted in payout section
        const reward = calculateRewardFromPoints(kaizen.pointsAwarded || 0);
        existing.approvedAmount += reward;
        existing.approvedPayoutCount += 1;
      }

      employeeSummary.set(key, existing);
    });

    // Second: Process payouts to override/update employee summaries
    payouts.forEach((payout) => {
      const key = payout.userName;
      const existing = employeeSummary.get(key) || {
        userName: payout.userName,
        userLogin: payout.userLogin || payout.userName,
        totalPoints: 0,
        totalAmount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        rejectedAmount: 0,
        unpaidPoints: 0,
        unpaidRewardAmount: 0,
        payoutCount: 0,
        approvedPayoutCount: 0,
        pendingPayoutCount: 0,
        rejectedPayoutCount: 0,
        lastPayoutDate: undefined,
        bankAccount: payout.bankAccount,
      };

      existing.payoutCount += 1;
      existing.totalAmount += payout.totalAmount || 0;
      existing.totalPoints += payout.totalPoints || 0;
      existing.lastPayoutDate = payout.createdAt.toISOString();

      if (payout.status === 'APPROVED') {
        existing.approvedPayoutCount += 1;
        existing.approvedAmount += payout.totalAmount || 0;
      } else if (payout.status === 'PENDING') {
        existing.pendingPayoutCount += 1;
        existing.pendingAmount += payout.totalAmount || 0;
      } else if (payout.status === 'REJECTED') {
        existing.rejectedPayoutCount += 1;
        existing.rejectedAmount += payout.totalAmount || 0;
      }

      employeeSummary.set(key, existing);
    });

    // Calculate totals
    const totalApprovedKaizenReward = approvedKaizens
      .filter(k => k.isPaidOut)
      .reduce((sum, k) => sum + calculateRewardFromPoints(k.pointsAwarded || 0), 0);

    const totalUnpaidKaizenReward = approvedKaizens
      .filter(k => !k.isPaidOut)
      .reduce((sum, k) => sum + calculateRewardFromPoints(k.pointsAwarded || 0), 0);

    const summary = {
      totalEmployees: employeeSummary.size,
      totalPayoutRequests: payouts.length,
      totalApprovedKaizens: approvedKaizens.length,
      totalApprovedAmount: payouts
        .filter(p => p.status === 'APPROVED')
        .reduce((sum, p) => sum + (p.totalAmount || 0), 0),
      totalApprovedFromKaizens: totalApprovedKaizenReward,
      totalPendingAmount: payouts
        .filter(p => p.status === 'PENDING')
        .reduce((sum, p) => sum + (p.totalAmount || 0), 0),
      totalUnpaidKaizenAmount: totalUnpaidKaizenReward,
      totalRejectedAmount: payouts
        .filter(p => p.status === 'REJECTED')
        .reduce((sum, p) => sum + (p.totalAmount || 0), 0),
      employees: Array.from(employeeSummary.values()).sort(
        (a, b) => (b.approvedAmount + b.pendingAmount) - (a.approvedAmount + a.pendingAmount)
      ),
      payoutHistory: payouts,
      approvedKaizens: approvedKaizens,
    };

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('GET /api/kaizen/raporty-komisji Error:', error);
    return NextResponse.json({ error: 'Błąd pobierania raportu' }, { status: 500 });
  }
}
