import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthSession } from '@/lib/auth';
import { getRemainingCalendarDays } from '@/utils/bhpDateUtils';

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        login: true,
        name: true,
        email: true,
        role: true,
        bhpTrainingDueDate: true,
        trainings: {
          include: {
            trainingType: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Użytkownik nie istnieje' }, { status: 404 });
    }

    const allTypes = await prisma.userTrainingType.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    const userTrainingsMapped = allTypes.map((type) => {
      const assigned = user.trainings.find((t) => t.trainingTypeId === type.id);
      let dueDate = assigned?.dueDate;

      // Fallback for default BHP
      if (!dueDate && (type.isDefault || type.name === 'Szkolenie BHP') && user.bhpTrainingDueDate) {
        dueDate = user.bhpTrainingDueDate;
      }

      const remainingDays = dueDate ? getRemainingCalendarDays(dueDate) : null;
      let status: 'EXPIRED' | 'URGENT' | 'VALID' | 'NOT_SET' = 'NOT_SET';

      if (dueDate && remainingDays !== null) {
        if (remainingDays <= 0) {
          status = 'EXPIRED';
        } else if (remainingDays <= 30) {
          status = 'URGENT';
        } else {
          status = 'VALID';
        }
      }

      return {
        typeId: type.id,
        typeName: type.name,
        typeDescription: type.description,
        isDefault: type.isDefault,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        remainingDays,
        status,
      };
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        login: user.login,
        role: user.role,
      },
      trainings: userTrainingsMapped,
    });
  } catch (error: any) {
    console.error('GET /api/user-profile/trainings Error:', error);
    return NextResponse.json({ error: error.message || 'Błąd serwera' }, { status: 500 });
  }
}
