import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthSession } from '@/lib/auth';

/** Roles dozwolone do zarządzania strukturą (rejony, maszyny, departamenty). */
const ALLOWED_MANAGEMENT_ROLES = new Set([
  'ADMIN', 'ADMINISTRATOR', 'ZARZAD', 'ZARZĄD', 'BOARD',
]);

function hasManagementAccess(role: string): boolean {
  return ALLOWED_MANAGEMENT_ROLES.has(role.toUpperCase());
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    if (!hasManagementAccess(session.role)) {
      return NextResponse.json(
        { error: 'Brak uprawnień. Tylko Administrator i Zarząd mogą edytować rejony.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const updatedArea = await prisma.area.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
        ...(body.description !== undefined ? { description: body.description ? String(body.description).trim() : null } : {}),
        ...(body.shortCode !== undefined ? { shortCode: body.shortCode ? String(body.shortCode).trim() : null } : {}),
      },
    });

    return NextResponse.json(updatedArea);
  } catch (error: any) {
    console.error('PATCH /api/areas/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Nie udało się zaktualizować rejonu' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    if (!hasManagementAccess(session.role)) {
      return NextResponse.json(
        { error: 'Brak uprawnień. Tylko Administrator i Zarząd mogą usuwać rejony.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Sprawdź czy rejon istnieje i jakie ma powiązania
    const area = await prisma.area.findUnique({
      where: { id },
      include: {
        machines: { select: { id: true } },
        childAreas: { select: { id: true } },
        responsibleUsers: { select: { id: true } },
        audits: { select: { id: true } },
        kaizens: { select: { id: true } },
        faultReports: { select: { id: true } },
        qualityReports: { select: { id: true } },
      },
    });

    if (!area) {
      return NextResponse.json({ error: 'Nie znaleziono rejonu' }, { status: 404 });
    }

    // Blokuj usuwanie jeśli ma pod-rejony
    if (area.childAreas.length > 0) {
      return NextResponse.json(
        { error: 'Nie można usunąć rejonu, który ma pod-rejony. Usuń najpierw pod-rejony.' },
        { status: 400 }
      );
    }

    // Transakcja: odłącz lub usuń wszystkie powiązane rekordy, a następnie usuń rejon
    await prisma.$transaction(async (tx) => {
      // Usuń powiązane audyty (oraz automatycznie kaskadowo odpowiadające im odpowiedzi i obserwacje)
      if (area.audits.length > 0) {
        await tx.audit.deleteMany({ where: { areaId: id } });
      }

      // Odłącz użytkowników przypisanych do rejonu
      if (area.responsibleUsers.length > 0) {
        await tx.user.updateMany({
          where: { responsibleAreaId: id },
          data: { responsibleAreaId: null },
        });
      }

      // Odłącz kaizeny (areaId nullable → set null)
      if (area.kaizens.length > 0) {
        await tx.kaizen.updateMany({
          where: { areaId: id },
          data: { areaId: null },
        });
      }

      // Odłącz zgłoszenia usterek (areaId nullable → set null)
      if (area.faultReports.length > 0) {
        await tx.faultReport.updateMany({
          where: { areaId: id },
          data: { areaId: null },
        });
      }

      // Odłącz raporty jakości (areaId nullable → set null)
      if (area.qualityReports.length > 0) {
        await tx.qualityReport.updateMany({
          where: { areaId: id },
          data: { areaId: null },
        });
      }

      // Wyczyść headUserId na self-referencing Area
      await tx.area.update({
        where: { id },
        data: { headUserId: null },
      });

      // Usuń maszyny przypisane do rejonu (odpinając wpierw ich ID od powiązanych rekordów)
      if (area.machines.length > 0) {
        const machineIds = area.machines.map((m) => m.id);
        await tx.audit.updateMany({ where: { machineId: { in: machineIds } }, data: { machineId: null } });
        await tx.kaizen.updateMany({ where: { machineId: { in: machineIds } }, data: { machineId: null } });
        await tx.faultReport.updateMany({ where: { machineId: { in: machineIds } }, data: { machineId: null } });
        await tx.qualityReport.updateMany({ where: { machineId: { in: machineIds } }, data: { machineId: null } });
        await tx.bhpHazardReport.updateMany({ where: { machineId: { in: machineIds } }, data: { machineId: null } });
        await tx.machine.deleteMany({ where: { areaId: id } });
      }

      // Usuń sam rejon
      await tx.area.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/areas/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Nie udało się usunąć rejonu' },
      { status: 500 }
    );
  }
}
