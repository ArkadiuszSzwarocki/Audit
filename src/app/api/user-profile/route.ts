import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/config/db';
import { verifyJwtToken } from '@/lib/auth';

async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (sessionToken) {
    const payload = await verifyJwtToken(sessionToken);
    if (payload) {
      return {
        id: payload.id as string,
        name: payload.name as string,
        login: (payload.login as string) || (payload.name as string) || 'admin',
        role: (payload.role as string) || 'OPERATOR',
      };
    }
  }

  const isAdmin = cookieStore.get('admin_session')?.value === 'true';
  if (isAdmin) {
    return { id: 'admin-fallback', name: 'Administrator', login: 'admin', role: 'ADMIN' };
  }

  return null;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Niezalogowany' }, { status: 401 });
    }

    // 1. Count pending assigned tasks (Observation assigned to user.id or user.name)
    const assignedTasksCount = await prisma.observation.count({
      where: {
        isFixed: false,
        OR: [
          { assignedToId: user.id },
          { assignedTo: { name: user.name } },
          { assignedTo: { login: user.login } },
        ],
      },
    });

    // 2. Count assigned / reported open fault reports
    const assignedFaultsCount = await prisma.faultReport.count({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        OR: [
          { assignedToId: user.id },
          { reportedBy: user.name },
          { assignedTo: { login: user.login } },
        ],
      },
    });

    // 3. Count submitted Kaizens & sum earned points with flexible case-insensitive submitter matching
    const allUserKaizens = await prisma.kaizen.findMany({
      select: {
        id: true,
        title: true,
        submittedBy: true,
        status: true,
        pointsAwarded: true,
        isPaidOut: true,
      },
    });

    const cleanName = (user.name || '').trim().toLowerCase();
    const cleanLogin = (user.login || '').trim().toLowerCase();

    const userKaizens = allUserKaizens.filter(k => {
      const sb = (k.submittedBy || '').trim().toLowerCase();
      if (!sb) return false;
      return (
        sb === cleanName ||
        sb === cleanLogin ||
        (cleanName.length > 2 && sb.includes(cleanName)) ||
        (cleanName.length > 2 && cleanName.includes(sb)) ||
        (cleanLogin.length > 2 && sb.includes(cleanLogin)) ||
        (cleanLogin.length > 2 && cleanLogin.includes(sb))
      );
    });

    const getKaizenRewardAmount = (pts: number) => {
      if (!pts || pts <= 0) return 0;
      if (pts <= 5) return 10;
      if (pts <= 10) return 50;
      if (pts <= 15) return 100;
      return 150;
    };

    const submittedKaizensCount = userKaizens.length;
    const approvedKaizens = userKaizens.filter(k => k.status === 'APPROVED');
    const approvedKaizensCount = approvedKaizens.length;
    const userPoints = approvedKaizens.reduce((sum, k) => sum + (k.pointsAwarded || 0), 0);

    // Unpaid (claimable) vs Paid Out
    const unpaidKaizens = approvedKaizens.filter(k => !k.isPaidOut);
    const unpaidKaizensCount = unpaidKaizens.length;
    const unpaidPoints = unpaidKaizens.reduce((sum, k) => sum + (k.pointsAwarded || 0), 0);
    const estimatedCashReward = unpaidKaizens.reduce((sum, k) => sum + getKaizenRewardAmount(k.pointsAwarded || 0), 0);

    const paidOutKaizens = approvedKaizens.filter(k => k.isPaidOut);
    const paidOutCashReward = paidOutKaizens.reduce((sum, k) => sum + getKaizenRewardAmount(k.pointsAwarded || 0), 0);

    // Determine rank title
    let rankTitle = '🌱 Początkujący Innowator';
    if (userPoints >= 300) {
      rankTitle = '🏆 Mistrz Kaizen & Lean';
    } else if (userPoints >= 150) {
      rankTitle = '🥇 Złoty Udoskonalacz';
    } else if (userPoints >= 50) {
      rankTitle = '🥈 Srebrny Udoskonalacz';
    } else if (userPoints > 0) {
      rankTitle = '🥉 Brązowy Udoskonalacz';
    }

    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: user.id },
          { login: user.login },
        ]
      },
      select: {
        bhpTrainingDueDate: true,
        dismissedBhpNoticeThreshold: true,
        trainings: {
          include: {
            trainingType: true,
          },
        },
      }
    });

    return NextResponse.json({
      user,
      assignedTasksCount,
      assignedFaultsCount,
      submittedKaizensCount,
      approvedKaizensCount,
      unpaidKaizensCount,
      userPoints,
      unpaidPoints,
      estimatedCashReward,
      paidOutCashReward,
      rankTitle,
      bhpTrainingDueDate: dbUser?.bhpTrainingDueDate || null,
      dismissedBhpNoticeThreshold: dbUser?.dismissedBhpNoticeThreshold ?? null,
      trainings: dbUser?.trainings || [],
    });
  } catch (error: any) {
    console.error('GET /api/user-profile Error:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Niezalogowany' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Wypełnij obecne i nowe hasło' }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'Nowe hasło musi mieć co najmniej 4 znaki' }, { status: 400 });
    }

    // Find DB user record
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: sessionUser.id },
          { login: sessionUser.login },
        ],
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Nie znaleziono konta użytkownika w bazie' }, { status: 404 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Obecne hasło jest nieprawidłowe' }, { status: 400 });
    }

    // Hash new password and update
    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true, message: 'Hasło zostało pomyślnie zmienione!' });
  } catch (error: any) {
    console.error('POST /api/user-profile change password error:', error);
    return NextResponse.json({ error: error?.message || 'Błąd zmiany hasła' }, { status: 500 });
  }
}
