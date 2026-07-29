import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const areas = await prisma.area.findMany({
      include: {
        headUser: { select: { id: true, name: true, login: true, email: true, role: true } },
        parentArea: { select: { id: true, name: true } },
        childAreas: { select: { id: true, name: true } },
        responsibleUsers: { select: { id: true, name: true, login: true, email: true, role: true } },
      },
      orderBy: { name: 'asc' },
    });

    const departments = areas.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description || null,
      shiftMode: a.shiftMode ?? 3,
      parentDepartmentId: a.parentAreaId || null,
      parentDepartment: a.parentArea || null,
      childDepartments: a.childAreas || [],
      head: a.headUser || null,
      headUserId: a.headUserId || null,
      users: a.responsibleUsers || [],
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    return NextResponse.json(departments);
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Nie udało się pobrać departamentów' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || 'create-department';
    const payload = body.data || body;

    if (action === 'create-department' || (!body.action && payload.name)) {
      const name = String(payload.name || '').trim();
      if (!name) {
        return NextResponse.json({ error: 'Podaj nazwę departamentu' }, { status: 400 });
      }

      const newArea = await prisma.area.create({
        data: {
          name,
          description: payload.description ? String(payload.description).trim() : null,
          shiftMode: typeof payload.shiftMode === 'number' ? payload.shiftMode : 3,
          parentAreaId: payload.parentDepartmentId || payload.parentAreaId || null,
          headUserId: payload.headUserId || null,
        },
        include: {
          headUser: { select: { id: true, name: true, login: true, email: true } },
          parentArea: { select: { id: true, name: true } },
          childAreas: { select: { id: true, name: true } },
          responsibleUsers: { select: { id: true, name: true, login: true, email: true } },
        },
      });

      const department = {
        id: newArea.id,
        name: newArea.name,
        description: newArea.description || null,
        shiftMode: newArea.shiftMode ?? 3,
        parentDepartmentId: newArea.parentAreaId || null,
        parentDepartment: newArea.parentArea || null,
        childDepartments: newArea.childAreas || [],
        head: newArea.headUser || null,
        headUserId: newArea.headUserId || null,
        users: newArea.responsibleUsers || [],
        createdAt: newArea.createdAt.toISOString(),
        updatedAt: newArea.updatedAt.toISOString(),
      };

      return NextResponse.json(department, { status: 201 });
    }

    if (action === 'assign-head') {
      const departmentId = payload.departmentId;
      const userId = payload.userId;

      if (!departmentId || !userId) {
        return NextResponse.json({ error: 'Brakujące ID departamentu lub użytkownika' }, { status: 400 });
      }

      await prisma.area.update({
        where: { id: departmentId },
        data: { headUserId: userId },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          responsibleAreaId: departmentId,
        },
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'assign-employee') {
      const departmentId = payload.departmentId;
      const userId = payload.userId;

      if (!departmentId || !userId) {
        return NextResponse.json({ error: 'Brakujące ID departamentu lub użytkownika' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { responsibleAreaId: departmentId },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Nieobsługiwana akcja' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in departments route:', error);
    return NextResponse.json(
      { error: error?.message || 'Nie udało się przetworzyć żądania' },
      { status: 400 }
    );
  }
}
