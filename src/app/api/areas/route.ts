import { NextResponse } from 'next/server';
import { AreaService } from '@/services/AreaService';
import { getAuthSession } from '@/lib/auth';
import { checkRolePermission } from '@/lib/permissions';

/** Roles dozwolone do zarządzania strukturą (rejony, maszyny, departamenty). */
const ALLOWED_MANAGEMENT_ROLES = new Set([
  'ADMIN', 'ADMINISTRATOR', 'ZARZAD', 'ZARZĄD', 'BOARD', 'KIEROWNIK', 'MANAGER', 'DYREKTOR', 'DIRECTOR',
]);

function hasManagementAccess(role: string): boolean {
  if (ALLOWED_MANAGEMENT_ROLES.has((role || '').toUpperCase())) return true;
  return checkRolePermission(role, 'structure.create');
}

const areaService = new AreaService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const withMachines = searchParams.get('withMachines') === 'true';
    const areas = await areaService.getAllAreas({ includeMachines: withMachines });
    return NextResponse.json(areas);
  } catch (error) {
    return NextResponse.json({ error: 'Nie udało się pobrać rejonów' }, { status: 500 });
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
        { error: 'Brak uprawnień. Operatorzy posiadają dostęp wyłącznie do podglądu.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const area = await areaService.createArea({ name: body.name, description: body.description });
    return NextResponse.json(area, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
