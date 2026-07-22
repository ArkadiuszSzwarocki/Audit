import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();

    const existingRole = await prisma.role.findUnique({ where: { id } });
    if (!existingRole) {
      return NextResponse.json({ error: 'Rola nie istnieje' }, { status: 404 });
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name: data.name?.trim() || existingRole.name,
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const role = await prisma.role.findUnique({ where: { id } });

    if (!role) {
      return NextResponse.json({ error: 'Rola nie istnieje' }, { status: 404 });
    }

    if (role.isSystem) {
      return NextResponse.json({ error: 'Nie można usunąć domyślnej roli systemowej' }, { status: 400 });
    }

    await prisma.role.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
