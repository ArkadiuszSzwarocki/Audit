import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const resolvedParams = await params;
    const bugReport = await prisma.bugReport.findUnique({
      where: { id: resolvedParams.id },
      include: {
        createdBy: {
          select: { id: true, name: true, login: true, role: true }
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, login: true, role: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!bugReport) {
      return NextResponse.json({ error: 'Nie znaleziono zgłoszenia problemu' }, { status: 404 });
    }

    // Check access permissions: user can view own report, admin can view any
    if (!session.isAdmin && bugReport.createdById !== session.id) {
      return NextResponse.json({ error: 'Brak uprawnień do podglądu tego zgłoszenia' }, { status: 403 });
    }

    // Mark unread status as read based on viewer
    if (session.isAdmin && bugReport.unreadForAdmin) {
      await prisma.bugReport.update({
        where: { id: bugReport.id },
        data: { unreadForAdmin: false }
      });
      bugReport.unreadForAdmin = false;
    }

    if (session.id === bugReport.createdById && bugReport.unreadForUser) {
      await prisma.bugReport.update({
        where: { id: bugReport.id },
        data: { unreadForUser: false }
      });
      bugReport.unreadForUser = false;
    }

    return NextResponse.json(bugReport);
  } catch (error: any) {
    console.error('Error fetching bug report detail:', error);
    return NextResponse.json({ error: error.message || 'Błąd pobierania szczegółów zgłoszenia' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { status, priority } = body;

    const existing = await prisma.bugReport.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Nie znaleziono zgłoszenia problemu' }, { status: 404 });
    }

    // Only Admin or creator can update status
    if (!session.isAdmin && existing.createdById !== session.id) {
      return NextResponse.json({ error: 'Brak uprawnień do edycji tego zgłoszenia' }, { status: 403 });
    }

    const updated = await prisma.bugReport.update({
      where: { id: resolvedParams.id },
      data: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, login: true, role: true }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating bug report:', error);
    return NextResponse.json({ error: error.message || 'Błąd aktualizacji zgłoszenia' }, { status: 500 });
  }
}
