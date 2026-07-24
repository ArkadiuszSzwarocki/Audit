import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET(req: NextRequest) {
  try {
    const [faults, bhp, quality, tasks, kaizens] = await Promise.all([
      prisma.faultReport.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, status: true, dueDate: true, createdAt: true, updatedAt: true, reportedBy: true },
      }),
      prisma.bhpHazardReport.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, status: true, dueDate: true, createdAt: true, updatedAt: true, reportedBy: true },
      }),
      prisma.qualityReport.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, status: true, dueDate: true, createdAt: true, updatedAt: true, reportedBy: true },
      }),
      prisma.observation.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, description: true, aiSuggestion: true, isFixed: true, dueDate: true, createdAt: true, updatedAt: true },
      }),
      prisma.kaizen.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, status: true, createdAt: true, updatedAt: true, submittedBy: true },
      }),
    ]);

    const items: Array<{
      id: string;
      module: 'FAULT' | 'BHP' | 'QUALITY' | 'TASK' | 'KAIZEN';
      moduleLabel: string;
      title: string;
      status?: string;
      dueDate?: Date | null;
      createdAt: Date;
      updatedAt: Date;
      url: string;
    }> = [];

    faults.forEach((f) => {
      items.push({
        id: f.id,
        module: 'FAULT',
        moduleLabel: 'Usterka / Awaria',
        title: f.title,
        status: f.status,
        dueDate: f.dueDate,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        url: '/usterki',
      });
    });

    bhp.forEach((b) => {
      items.push({
        id: b.id,
        module: 'BHP',
        moduleLabel: 'Zagrożenie BHP',
        title: b.title,
        status: b.status,
        dueDate: b.dueDate,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        url: '/bhp',
      });
    });

    quality.forEach((q) => {
      items.push({
        id: q.id,
        module: 'QUALITY',
        moduleLabel: 'Niezgodność Jakościowa',
        title: q.title,
        status: q.status,
        dueDate: q.dueDate,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        url: '/jakosc',
      });
    });

    tasks.forEach((t) => {
      items.push({
        id: t.id,
        module: 'TASK',
        moduleLabel: 'Zadanie Produkcyjne',
        title: t.aiSuggestion || t.description,
        status: t.isFixed ? 'RESOLVED' : 'OPEN',
        dueDate: t.dueDate,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        url: '/zadania',
      });
    });

    kaizens.forEach((k) => {
      items.push({
        id: k.id,
        module: 'KAIZEN',
        moduleLabel: 'Pomysł Kaizen',
        title: k.title,
        status: k.status,
        createdAt: k.createdAt,
        updatedAt: k.updatedAt,
        url: '/kaizen',
      });
    });

    // Sort all by updatedAt descending
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      items: items.slice(0, 15),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
