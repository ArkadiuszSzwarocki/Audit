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
        { error: 'Brak uprawnień. Tylko Administrator i Zarząd mogą edytować maszyny.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (body.areaId) {
      const area = await prisma.area.findUnique({ where: { id: body.areaId } });
      if (area && area.name.toLowerCase().includes('magazyn')) {
        return NextResponse.json(
          { error: 'Magazyny nie mogą posiadać przypisanych maszyn.' },
          { status: 400 }
        );
      }
    }

    const updatedMachine = await prisma.machine.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
        ...(body.description !== undefined ? { description: body.description ? String(body.description).trim() : null } : {}),
        ...(body.shortCode !== undefined ? { shortCode: body.shortCode ? String(body.shortCode).trim() : null } : {}),
        ...(body.areaId !== undefined ? { areaId: body.areaId } : {}),
      },
      include: { area: true },
    });

    return NextResponse.json(updatedMachine);
  } catch (error: any) {
    console.error('PATCH /api/machines/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Nie udało się zaktualizować maszyny' },
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
        { error: 'Brak uprawnień. Tylko Administrator i Zarząd mogą usuwać maszyny.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const machine = await prisma.machine.findUnique({ where: { id } });
    if (!machine) {
      return NextResponse.json({ error: 'Nie znaleziono maszyny' }, { status: 404 });
    }

    // Transakcja: odłącz maszyny od wszystkich powiązanych rekordów (odpinamy FK), potem usuwamy maszynę
    await prisma.$transaction(async (tx) => {
      // Odłącz audyty
      await tx.audit.updateMany({
        where: { machineId: id },
        data: { machineId: null },
      });

      // Odłącz kaizeny
      await tx.kaizen.updateMany({
        where: { machineId: id },
        data: { machineId: null },
      });

      // Odłącz zgłoszenia usterek
      await tx.faultReport.updateMany({
        where: { machineId: id },
        data: { machineId: null },
      });

      // Odłącz raporty jakości
      await tx.qualityReport.updateMany({
        where: { machineId: id },
        data: { machineId: null },
      });

      // Odłącz raporty zagrożeń BHP
      await tx.bhpHazardReport.updateMany({
        where: { machineId: id },
        data: { machineId: null },
      });

      // Usuń samą maszynę
      await tx.machine.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/machines/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Nie udało się usunąć maszyny' },
      { status: 500 }
    );
  }
}
