import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'employee-utilization';
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    const users = await prisma.user.findMany({
      include: {
        responsibleArea: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const balances = await prisma.leaveBalance.findMany({
      where: { year },
    });

    const requests = await prisma.leaveRequest.findMany({
      where: {
        startDate: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
    });

    if (action === 'employee-utilization') {
      const data = users.map((u) => {
        const bal = balances.find((b) => b.userId === u.id);
        const total = (bal?.overdueDays || 0) + (bal?.totalDays || 26);
        const used = (bal?.usedOverdueDays || 0) + (bal?.usedDays || 0);
        const available = Math.max(0, total - used);

        return {
          id: u.id,
          employeeName: u.name,
          employeeLogin: u.login,
          departmentName: u.responsibleArea ? u.responsibleArea.name : 'Brak działu',
          totalDays: total,
          usedDays: used,
          availableDays: available,
          utilizationPercent: total > 0 ? (used / total) * 100 : 0,
        };
      });

      return NextResponse.json({ success: true, data });
    }

    if (action === 'department-summary') {
      const deptMap: Record<string, { id: string; departmentName: string; totalEmployees: number; totalDays: number; usedDays: number; availableDays: number }> = {};

      users.forEach((u) => {
        const deptName = u.responsibleArea ? u.responsibleArea.name : 'Brak działu';
        const bal = balances.find((b) => b.userId === u.id);
        const total = (bal?.overdueDays || 0) + (bal?.totalDays || 26);
        const used = (bal?.usedOverdueDays || 0) + (bal?.usedDays || 0);
        const available = Math.max(0, total - used);

        if (!deptMap[deptName]) {
          deptMap[deptName] = {
            id: u.responsibleArea?.id || 'none',
            departmentName: deptName,
            totalEmployees: 0,
            totalDays: 0,
            usedDays: 0,
            availableDays: 0,
          };
        }

        deptMap[deptName].totalEmployees += 1;
        deptMap[deptName].totalDays += total;
        deptMap[deptName].usedDays += used;
        deptMap[deptName].availableDays += available;
      });

      const data = Object.values(deptMap).map(d => {
        const avgUtil = d.totalDays > 0 ? (d.usedDays / d.totalDays) * 100 : 0;
        return {
          ...d,
          departmentId: d.id,
          employeeCount: d.totalEmployees,
          totalPoolDays: d.totalDays,
          totalUsedDays: d.usedDays,
          totalAvailableDays: d.availableDays,
          averageUtilizationPercent: avgUtil,
        };
      });

      return NextResponse.json({ success: true, data });
    }

    if (action === 'monthly-trend') {
      const months = [
        'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
        'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
      ];

      const data = months.map((monthName, index) => {
        const monthRequests = requests.filter(r => new Date(r.startDate).getMonth() === index);
        const totalDays = monthRequests.reduce((sum, r) => sum + (r.daysCount || 1), 0);
        const count = monthRequests.length;
        const avg = count > 0 ? (totalDays / count).toFixed(1) : '0';

        return {
          month: monthName,
          monthName: monthName,
          monthIndex: index + 1,
          totalRequests: count,
          leavesCount: count,
          totalDays: totalDays,
          workDaysUsed: totalDays,
          avgLeavesPerWorkDay: avg,
        };
      });

      return NextResponse.json({ success: true, data });
    }

    if (action === 'leave-types') {
      const typesMap: Record<string, number> = {};

      requests.forEach((r) => {
        const t = r.type || 'WYPOCZYNKOWY';
        typesMap[t] = (typesMap[t] || 0) + (r.daysCount || 1);
      });

      const data = Object.entries(typesMap).map(([type, days]) => {
        const reqCount = requests.filter(r => (r.type || 'WYPOCZYNKOWY') === type).length;
        const avg = reqCount > 0 ? (days / reqCount).toFixed(1) : '0';
        return {
          type,
          count: reqCount,
          requestsCount: reqCount,
          totalDays: days,
          workDays: days,
          averageDaysPerLeave: avg,
        };
      });

      return NextResponse.json({ success: true, data });
    }

    // Default fallback array
    const data = users.map((u) => ({
      id: u.id,
      employeeName: u.name,
      employeeLogin: u.login,
      departmentName: u.responsibleArea ? u.responsibleArea.name : 'Brak działu',
      totalDays: 26,
      usedDays: 0,
      availableDays: 26,
      utilizationPercent: 0,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error generating leave report:', error);
    return NextResponse.json({ error: 'Błąd podczas generowania raportu urlopowego' }, { status: 500 });
  }
}
