import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/config/db';
import { getAuthSession } from '@/lib/auth';

import { checkRolePermission } from '@/lib/permissions';

/** Roles dozwolone do zarządzania strukturą organizacyjną. */
const ALLOWED_MANAGEMENT_ROLES = new Set([
  'ADMIN', 'ADMINISTRATOR', 'ZARZAD', 'ZARZĄD', 'BOARD', 'KIEROWNIK', 'MANAGER', 'DYREKTOR', 'DIRECTOR',
]);

function hasManagementAccess(role: string): boolean {
  if (ALLOWED_MANAGEMENT_ROLES.has((role || '').toUpperCase())) return true;
  return checkRolePermission(role, 'structure.create') || checkRolePermission(role, 'users.edit');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'structure';

    if (action === 'positions') {
      const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
      const positions = roles.map((r, index) => ({
        id: r.id,
        name: r.name,
        level: index + 1,
        description: r.description || undefined,
      }));
      return NextResponse.json(positions);
    }

    const areas = await prisma.area.findMany({
      include: {
        headUser: { select: { id: true, name: true, login: true, email: true, role: true } },
        parentArea: { select: { id: true, name: true } },
        childAreas: { select: { id: true, name: true } },
        responsibleUsers: { select: { id: true, name: true, login: true, email: true, role: true } },
      },
      orderBy: { name: 'asc' },
    });

    const flatDepartments = areas.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description || null,
      shiftMode: a.shiftMode ?? 3,
      parentDepartmentId: a.parentAreaId || null,
      parentDepartment: a.parentArea || null,
      childDepartments: [] as any[],
      head: a.headUser || null,
      headUserId: a.headUserId || null,
      users: a.responsibleUsers || [],
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    // Build true nested tree hierarchy
    const deptMap = new Map<string, any>();
    flatDepartments.forEach(d => deptMap.set(d.id, { ...d, childDepartments: [] }));

    const rootTree: any[] = [];
    deptMap.forEach(dept => {
      if (dept.parentDepartmentId && deptMap.has(dept.parentDepartmentId)) {
        deptMap.get(dept.parentDepartmentId).childDepartments.push(dept);
      } else {
        rootTree.push(dept);
      }
    });

    return NextResponse.json(rootTree);
  } catch (error: any) {
    console.error('Error fetching organization structure:', error);
    return NextResponse.json({ error: 'Nie udało się pobrać struktury' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    if (!hasManagementAccess(session.role)) {
      return NextResponse.json(
        { error: 'Brak uprawnień. Tylko Administrator i Zarząd mogą zarządzać strukturą organizacyjną.' },
        { status: 403 }
      );
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
        data: { responsibleAreaId: departmentId },
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'assign-employee') {
      const departmentId = payload.departmentId || payload.areaId;
      const userId = payload.userId;
      const roleName = payload.roleName || payload.positionId;
      const isHead = payload.isHead === true;

      if (!departmentId || !userId) {
        return NextResponse.json({ error: 'Brakujące ID departamentu lub użytkownika' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          responsibleAreaId: departmentId,
          ...(roleName ? { role: roleName } : {}),
        },
      });

      if (isHead) {
        await prisma.area.update({
          where: { id: departmentId },
          data: { headUserId: userId },
        });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'create-and-assign-employee') {
      const name = String(payload.name || '').trim();
      const login = String(payload.login || '').trim().toLowerCase();
      const rawPassword = String(payload.password || '123456');
      const roleName = String(payload.roleName || 'OPERATOR').trim();
      const departmentId = payload.departmentId || payload.areaId;
      const isHead = payload.isHead === true;

      if (!name || !login || !departmentId) {
        return NextResponse.json({ error: 'Podaj imię, login oraz wybierz sekcję' }, { status: 400 });
      }

      const existing = await prisma.user.findUnique({ where: { login } });
      if (existing) {
        return NextResponse.json({ error: `Pracownik o loginie "${login}" już istnieje w bazie danych` }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(rawPassword, 10);

      const newUser = await prisma.user.create({
        data: {
          name,
          login,
          passwordHash,
          role: roleName,
          responsibleAreaId: departmentId,
          email: payload.email ? String(payload.email).trim() : null,
        },
      });

      if (isHead) {
        await prisma.area.update({
          where: { id: departmentId },
          data: { headUserId: newUser.id },
        });
      }

      return NextResponse.json({ success: true, user: newUser }, { status: 201 });
    }

    if (action === 'unassign-employee') {
      const userId = payload.userId;
      if (!userId) {
        return NextResponse.json({ error: 'Brakujące ID użytkownika' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { responsibleAreaId: null },
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'delete-department') {
      const departmentId = payload.departmentId || payload.id;
      if (!departmentId) {
        return NextResponse.json({ error: 'Brakujące ID departamentu' }, { status: 400 });
      }

      const area = await prisma.area.findUnique({
        where: { id: departmentId },
        include: {
          childAreas: { select: { id: true } },
          machines: { select: { id: true } },
          responsibleUsers: { select: { id: true } },
          audits: { select: { id: true } },
          kaizens: { select: { id: true } },
          faultReports: { select: { id: true } },
          qualityReports: { select: { id: true } },
        },
      });

      if (!area) {
        return NextResponse.json({ error: 'Nie znaleziono departamentu' }, { status: 404 });
      }

      if (area.childAreas.length > 0) {
        return NextResponse.json(
          { error: 'Nie można usunąć departamentu z pod-departamentami. Usuń je najpierw.' },
          { status: 400 }
        );
      }

      // Transakcja: odłącz lub usuń wszystkie powiązane rekordy, a następnie usuń departament
      await prisma.$transaction(async (tx) => {
        // Usuń powiązane audyty (oraz kaskadowo odpowiedzi i obserwacje)
        if (area.audits.length > 0) {
          await tx.audit.deleteMany({ where: { areaId: departmentId } });
        }

        if (area.responsibleUsers.length > 0) {
          await tx.user.updateMany({
            where: { responsibleAreaId: departmentId },
            data: { responsibleAreaId: null },
          });
        }

        // Odłącz kaizeny (areaId nullable → set null)
        if (area.kaizens.length > 0) {
          await tx.kaizen.updateMany({
            where: { areaId: departmentId },
            data: { areaId: null },
          });
        }

        // Odłącz zgłoszenia usterek (areaId nullable → set null)
        if (area.faultReports.length > 0) {
          await tx.faultReport.updateMany({
            where: { areaId: departmentId },
            data: { areaId: null },
          });
        }

        // Odłącz raporty jakości (areaId nullable → set null)
        if (area.qualityReports.length > 0) {
          await tx.qualityReport.updateMany({
            where: { areaId: departmentId },
            data: { areaId: null },
          });
        }

        // Wyczyść headUserId na self-referencing Area
        await tx.area.update({
          where: { id: departmentId },
          data: { headUserId: null },
        });

        if (area.machines.length > 0) {
          const machineIds = area.machines.map((m) => m.id);
          await tx.audit.updateMany({ where: { machineId: { in: machineIds } }, data: { machineId: null } });
          await tx.kaizen.updateMany({ where: { machineId: { in: machineIds } }, data: { machineId: null } });
          await tx.faultReport.updateMany({ where: { machineId: { in: machineIds } }, data: { machineId: null } });
          await tx.qualityReport.updateMany({ where: { machineId: { in: machineIds } }, data: { machineId: null } });
          await tx.bhpHazardReport.updateMany({ where: { machineId: { in: machineIds } }, data: { machineId: null } });
          await tx.machine.deleteMany({ where: { areaId: departmentId } });
        }

        await tx.area.delete({ where: { id: departmentId } });
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'create-position') {
      const name = String(payload.name || '').trim();
      if (!name) return NextResponse.json({ error: 'Podaj nazwę stanowiska' }, { status: 400 });

      const role = await prisma.role.create({
        data: {
          name,
          description: payload.description || null,
        },
      });

      return NextResponse.json({
        id: role.id,
        name: role.name,
        level: payload.level || 1,
        description: role.description || undefined,
      }, { status: 201 });
    }

    return NextResponse.json({ error: 'Nieobsługiwana akcja' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in organization route:', error);
    return NextResponse.json(
      { error: error?.message || 'Nie udało się przetworzyć żądania' },
      { status: 400 }
    );
  }
}
