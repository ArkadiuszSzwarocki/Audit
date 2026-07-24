import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthSession } from '@/lib/auth';

const DEFAULT_CATEGORIES = [
  {
    name: '🛡️ Kryterium 1: Wpływ na Bezpieczeństwo i Jakość (w tym Jakość Żywności)',
    description: '0 pkt - Brak wpływu | 1 pkt - Estetyka/5S | 3 pkt - Usprawnienie procesów/zmniejszenie ryzyka | 5 pkt - Eliminacja krytycznego ryzyka/ciała obcego',
    minPoints: 0,
    maxPoints: 5,
    icon: '🛡️',
    color: 'purple',
  },
  {
    name: '⛑️ Kryterium 2: Wpływ na BHP i Ergonomię',
    description: '0 pkt - Brak wpływu | 1 pkt - Komfort pracy | 3 pkt - Wyraźna poprawa ergonomii | 5 pkt - Eliminacja zagrożenia wypadkiem/chorobą',
    minPoints: 0,
    maxPoints: 5,
    icon: '⛑️',
    color: 'red',
  },
  {
    name: '⚡ Kryterium 3: Efektywność, Oszczędność i Redukcja Marnotrawstwa (Muda)',
    description: '0 pkt - Brak oszczędności | 1 pkt - Drobne oszczędności materiałowe | 3 pkt - Skrócenie przezbrojenia/automatyzacja | 5 pkt - Duża redukcja kosztów/wydajność',
    minPoints: 0,
    maxPoints: 5,
    icon: '⚡',
    color: 'emerald',
  },
  {
    name: '🛠️ Kryterium 4: Łatwość i Koszt Wdrożenia',
    description: '0 pkt - Bardzo drogie/zewnętrzne | 1 pkt - Czas i zakupy | 3 pkt - Niskie koszty/wewnętrzne UR | 5 pkt - Bezkosztowe od ręki',
    minPoints: 0,
    maxPoints: 5,
    icon: '🛠️',
    color: 'blue',
  },
];

export async function GET() {
  try {
    let categories = await prisma.kaizenScoringCategory.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Auto-seed default categories if database is empty
    if (categories.length === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await prisma.kaizenScoringCategory.create({ data: cat });
      }
      categories = await prisma.kaizenScoringCategory.findMany({
        orderBy: { createdAt: 'asc' },
      });
    }

    let goal = await prisma.kaizenGoal.findFirst();
    if (!goal) {
      goal = await prisma.kaizenGoal.create({
        data: {
          title: 'Miesięczny Cel Kaizen Zespołu',
          targetPoints: 500,
          period: 'MONTHLY',
          rewardInfo: 'Wyróżnienie Pomysłodawcy Miesiąca i premia zespołowa',
        },
      });
    }

    return NextResponse.json({ categories, goal });
  } catch (error) {
    console.error('GET /api/kaizen-scoring error:', error);
    return NextResponse.json({ error: 'Błąd pobierania punktacji Kaizen' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Niezalogowany — brak uprawnień' }, { status: 401 });
    }

    const body = await request.json();
    const { action, category, goal } = body;

    if (action === 'save_category') {
      if (category.id) {
        const updated = await prisma.kaizenScoringCategory.update({
          where: { id: category.id },
          data: {
            name: category.name,
            description: category.description,
            minPoints: Number(category.minPoints) || 0,
            maxPoints: Number(category.maxPoints) || 10,
            icon: category.icon || '⚡',
            color: category.color || 'amber',
          },
        });
        return NextResponse.json({ category: updated });
      } else {
        const created = await prisma.kaizenScoringCategory.create({
          data: {
            name: category.name,
            description: category.description,
            minPoints: Number(category.minPoints) || 0,
            maxPoints: Number(category.maxPoints) || 10,
            icon: category.icon || '⚡',
            color: category.color || 'amber',
          },
        });
        return NextResponse.json({ category: created });
      }
    }

    if (action === 'toggle_scoring') {
      const existingGoal = await prisma.kaizenGoal.findFirst();
      const nextState = Boolean(body.isScoringEnabled);
      if (existingGoal) {
        const updatedGoal = await prisma.kaizenGoal.update({
          where: { id: existingGoal.id },
          data: { isScoringEnabled: nextState },
        });
        return NextResponse.json({ goal: updatedGoal });
      } else {
        const createdGoal = await prisma.kaizenGoal.create({
          data: {
            title: 'Miesięczny Cel Kaizen Zespołu',
            targetPoints: 500,
            period: 'MONTHLY',
            isScoringEnabled: nextState,
          },
        });
        return NextResponse.json({ goal: createdGoal });
      }
    }

    if (action === 'save_goal') {
      const existingGoal = await prisma.kaizenGoal.findFirst();
      if (existingGoal) {
        const updatedGoal = await prisma.kaizenGoal.update({
          where: { id: existingGoal.id },
          data: {
            title: goal.title,
            targetPoints: Number(goal.targetPoints) || 500,
            period: goal.period || 'MONTHLY',
            rewardInfo: goal.rewardInfo,
            isScoringEnabled: typeof goal.isScoringEnabled === 'boolean' ? goal.isScoringEnabled : existingGoal.isScoringEnabled,
          },
        });
        return NextResponse.json({ goal: updatedGoal });
      } else {
        const createdGoal = await prisma.kaizenGoal.create({
          data: {
            title: goal.title,
            targetPoints: Number(goal.targetPoints) || 500,
            period: goal.period || 'MONTHLY',
            rewardInfo: goal.rewardInfo,
            isScoringEnabled: Boolean(goal.isScoringEnabled),
          },
        });
        return NextResponse.json({ goal: createdGoal });
      }
    }

    return NextResponse.json({ error: 'Nieprawidłowa akcja' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/kaizen-scoring error:', error);
    return NextResponse.json({ error: error.message || 'Błąd zapisu' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Niezalogowany — brak uprawnień' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Brak ID kategorii' }, { status: 400 });
    }

    await prisma.kaizenScoringCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/kaizen-scoring error:', error);
    return NextResponse.json({ error: error.message || 'Błąd usuwania' }, { status: 500 });
  }
}
