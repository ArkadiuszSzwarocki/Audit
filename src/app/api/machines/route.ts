import { NextResponse } from 'next/server';
import { MachineService } from '@/services/MachineService';
import { getAuthSession } from '@/lib/auth';

/** Roles dozwolone do zarządzania strukturą (rejony, maszyny, departamenty). */
const ALLOWED_MANAGEMENT_ROLES = new Set([
  'ADMIN', 'ADMINISTRATOR', 'ZARZAD', 'ZARZĄD', 'BOARD',
]);

function hasManagementAccess(role: string): boolean {
  return ALLOWED_MANAGEMENT_ROLES.has(role.toUpperCase());
}

const machineService = new MachineService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const areaId = searchParams.get('areaId');
    
    let machines;
    if (areaId) {
      machines = await machineService.getMachinesByArea(areaId);
    } else {
      machines = await machineService.getAllMachines();
    }
    
    return NextResponse.json(machines);
  } catch (error) {
    return NextResponse.json({ error: 'Nie udało się pobrać maszyn' }, { status: 500 });
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
        { error: 'Brak uprawnień. Tylko Administrator i Zarząd mogą dodawać maszyny.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const machine = await machineService.createMachine({
      name: body.name,
      description: body.description,
      areaId: body.areaId,
    });
    return NextResponse.json(machine, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
