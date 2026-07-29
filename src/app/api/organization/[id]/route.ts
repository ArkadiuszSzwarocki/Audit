import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    if (!id) {
      return NextResponse.json({ error: 'Brak identyfikatora departamentu' }, { status: 400 });
    }

    // 1. Fetch current department with head, parent, children, users, machines
    const department = await prisma.area.findUnique({
      where: { id },
      include: {
        headUser: { select: { id: true, name: true, login: true, email: true, role: true } },
        parentArea: {
          include: {
            headUser: { select: { id: true, name: true, login: true, email: true, role: true } },
            parentArea: {
              include: {
                headUser: { select: { id: true, name: true, login: true, email: true, role: true } },
              },
            },
          },
        },
        childAreas: {
          include: {
            headUser: { select: { id: true, name: true, login: true, email: true, role: true } },
            responsibleUsers: { select: { id: true, name: true, login: true, email: true, role: true } },
            machines: { select: { id: true, name: true, description: true } },
          },
        },
        responsibleUsers: { select: { id: true, name: true, login: true, email: true, role: true } },
        machines: { select: { id: true, name: true, description: true } },
      },
    });

    if (!department) {
      return NextResponse.json({ error: 'Nie znaleziono departamentu' }, { status: 404 });
    }

    // 2. Fetch Board / Management accounts (Zarząd & Dyrekcja strictly)
    const boardUsers = await prisma.user.findMany({
      where: {
        role: { in: ['ZARZAD', 'Zarząd', 'ZARZĄD', 'BOARD', 'DIRECTOR', 'Dyrektor'] },
      },
      select: { id: true, name: true, login: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });

    // 3. Build ancestor path up to root
    const ancestors: any[] = [];
    let currentParent = department.parentArea;
    while (currentParent) {
      ancestors.unshift({
        id: currentParent.id,
        name: currentParent.name,
        description: currentParent.description,
        headUser: currentParent.headUser,
      });
      currentParent = (currentParent as any).parentArea;
    }

    return NextResponse.json({
      boardUsers,
      ancestors,
      department: {
        id: department.id,
        name: department.name,
        description: department.description,
        shiftMode: department.shiftMode ?? 3,
        parentDepartmentId: department.parentAreaId,
        parentDepartment: department.parentArea
          ? { id: department.parentArea.id, name: department.parentArea.name }
          : null,
        head: department.headUser,
        headUserId: department.headUserId,
        users: department.responsibleUsers,
        childDepartments: department.childAreas.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          shiftMode: c.shiftMode,
          head: c.headUser,
          users: c.responsibleUsers,
          machinesCount: c.machines ? c.machines.length : 0,
        })),
        machines: department.machines,
        createdAt: department.createdAt.toISOString(),
        updatedAt: department.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching department management tree:', error);
    return NextResponse.json({ error: 'Błąd serwera podczas pobierania drzewa' }, { status: 500 });
  }
}
