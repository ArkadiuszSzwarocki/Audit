import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;

    let whereClause: any = {};
    if (status) whereClause.status = status;
    if (category) whereClause.category = category;

    if (!session.isAdmin) {
      whereClause.createdById = session.id;
    }

    const bugReports = await prisma.bugReport.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, login: true, role: true }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    let unreadCount = 0;
    if (session.isAdmin) {
      unreadCount = await prisma.bugReport.count({
        where: { unreadForAdmin: true }
      });
    } else {
      unreadCount = await prisma.bugReport.count({
        where: {
          createdById: session.id,
          unreadForUser: true
        }
      });
    }

    return NextResponse.json({
      bugReports,
      unreadCount
    });
  } catch (error: any) {
    console.error('Error fetching bug reports:', error);
    return NextResponse.json({ error: error.message || 'Błąd pobierania zgłoszeń problemów' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, pageUrl, pageName, photoUrl, priority } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Tytuł oraz opis problemu są wymagane' }, { status: 400 });
    }

    const newReport = await prisma.bugReport.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category: category || 'BUG',
        pageUrl: pageUrl || null,
        pageName: pageName || null,
        photoUrl: photoUrl || null,
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        createdById: session.id,
        unreadForAdmin: true,
        unreadForUser: false,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, login: true }
        }
      }
    });

    return NextResponse.json(newReport, { status: 201 });
  } catch (error: any) {
    console.error('Error creating bug report:', error);
    return NextResponse.json({ error: error.message || 'Błąd zgłaszania problemu' }, { status: 500 });
  }
}
