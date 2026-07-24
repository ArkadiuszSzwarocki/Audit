import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthSession } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<any> }) {
  const session = await getAuthSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const data = await request.json();

    const existingRole = await prisma.role.findUnique({ where: { id } });
    if (!existingRole) {
      return NextResponse.json({ error: 'Rola nie istnieje' }, { status: 404 });
    }

    const isZarzadRole = existingRole.name.toUpperCase() === 'ZARZĄD' || existingRole.name.toUpperCase() === 'ZARZAD';
    if (isZarzadRole && !session.isZarzad) {
      return NextResponse.json({
        error: 'Niedozwolona operacja! Rola Zarząd posiada nadrzędną władzę i nie może być modyfikowana przez Administratora!'
      }, { status: 403 });
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name: isZarzadRole ? existingRole.name : (data.name?.trim() || existingRole.name),
        description: data.description !== undefined ? data.description : existingRole.description,
        canCreateAudit: data.canCreateAudit !== undefined ? Boolean(data.canCreateAudit) : existingRole.canCreateAudit,
        canCompleteAudit: data.canCompleteAudit !== undefined ? Boolean(data.canCompleteAudit) : existingRole.canCompleteAudit,
        canDeleteAudit: data.canDeleteAudit !== undefined ? Boolean(data.canDeleteAudit) : existingRole.canDeleteAudit,
        canManageStructure: data.canManageStructure !== undefined ? Boolean(data.canManageStructure) : existingRole.canManageStructure,
        canManageUsers: data.canManageUsers !== undefined ? Boolean(data.canManageUsers) : existingRole.canManageUsers,
        canManageTypes: data.canManageTypes !== undefined ? Boolean(data.canManageTypes) : existingRole.canManageTypes,
        canManageKaizen: data.canManageKaizen !== undefined ? Boolean(data.canManageKaizen) : existingRole.canManageKaizen,
      }
    });

    return NextResponse.json(updatedRole);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<any> }) {
  const session = await getAuthSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const role = await prisma.role.findUnique({ where: { id } });

    if (!role) {
      return NextResponse.json({ error: 'Rola nie istnieje' }, { status: 404 });
    }

    const isZarzadRole = role.name.toUpperCase() === 'ZARZĄD' || role.name.toUpperCase() === 'ZARZAD';
    if (isZarzadRole) {
      return NextResponse.json({
        error: 'Nie można usunąć nadrzędnej roli systemowej Zarząd!'
      }, { status: 403 });
    }

    if (role.isSystem) {
      return NextResponse.json({ error: 'Nie można usunąć domyślnej roli systemowej' }, { status: 400 });
    }

    // Check if role is currently assigned to any active user
    const assignedUsersCount = await prisma.user.count({
      where: {
        OR: [
          { role: role.name },
          { roleId: role.id },
        ],
      },
    });

    if (assignedUsersCount > 0) {
      return NextResponse.json({
        error: `Nie można usunąć roli "${role.name}", ponieważ jest ona obecnie przypisana do ${assignedUsersCount} użytkownika/użytkowników. Najpierw zmień rolę tych osób!`
      }, { status: 400 });
    }

    await prisma.role.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
