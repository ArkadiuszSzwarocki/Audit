import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { checkIsAdmin } from '@/lib/auth';

const DEFAULT_CATEGORIES = [
  {
    name: '⚡ Oszczędność Czasu / Wydajność',
    description: 'Skrócenie czasu trwania czynności, zamiana długiego procesu w krótki lub przezbrojenie stanowiska.',
    minPoints: 10,
    maxPoints: 100,
    icon: '⚡',
    color: 'amber',
  },
  {
    name: '💰 Realne Oszczędności Finansowe',
    description: 'Redukcja strat surowcowych, energii, komponentów lub bezpośrenich kosztów eksploatacji.',
    minPoints: 20,
    maxPoints: 150,
    icon: '💰',
    color: 'emerald',
  },
  {
    name: '🧹 Ergonomia & 5S (Organizacja)',
    description: 'Uporządkowanie stanowiska pracy, lepsze oznakowanie, łatwiejszy i bezpieczniejszy dostęp do narzędzi.',
    minPoints: 5,
    maxPoints: 30,
    icon: '🧹',
    color: 'blue',
  },
  {
    name: '🛡️ Bezpieczeństwo & HACCP (Jakość)',
    description: 'Eliminacja ryzyka wypadku, skażenia krzyżowego, spełnienie wymogów sanitarnych i jakościowych.',
    minPoints: 15,
    maxPoints: 60,
    icon: '🛡️',
    color: 'purple',
  },
  {
    name: '💡 Inne Udoskonalenie Procesowe',
    description: 'Pozostałe drobne innowacje i ulepszenia codziennej pracy.',
    minPoints: 5,
    maxPoints: 25,
    icon: '💡',
    color: 'amber',
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
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Brak uprawnień administratora' }, { status: 403 });
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
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Brak uprawnień administratora' }, { status: 403 });
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
