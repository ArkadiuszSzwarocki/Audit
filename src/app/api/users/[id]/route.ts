import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthSession } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, role, bhpTrainingDueDate } = body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Użytkownik nie istnieje' }, { status: 404 });
    }

    const targetRoleUpper = String(targetUser.role || '').toUpperCase();
    const isTargetZarzad = targetRoleUpper === 'ZARZAD' || targetRoleUpper === 'ZARZĄD' || targetRoleUpper === 'BOARD';

    // Rule 1: Non-Zarząd user CANNOT modify a Zarząd user
    if (isTargetZarzad && !session.isZarzad) {
      return NextResponse.json({
        error: 'Niedozwolona operacja! Rola Zarząd posiada nadrzędną władzę – Administrator nie może edytować ani modyfikować pracowników Zarządu!'
      }, { status: 403 });
    }

    // Rule 2: Only Zarząd can assign Zarząd role to anyone
    if (role) {
      const newRoleUpper = String(role).toUpperCase();
      const isAssigningZarzad = newRoleUpper === 'ZARZAD' || newRoleUpper === 'ZARZĄD' || newRoleUpper === 'BOARD';
      if (isAssigningZarzad && !session.isZarzad) {
        return NextResponse.json({
          error: 'Niedozwolona operacja! Tylko użytkownik posiadający rolę Zarząd może nadawać uprawnienia roli Zarząd!'
        }, { status: 403 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name !== undefined ? name : targetUser.name,
        email: email !== undefined ? (email?.trim() || null) : targetUser.email,
        role: role !== undefined ? role : targetUser.role,
        bhpTrainingDueDate: bhpTrainingDueDate !== undefined ? (bhpTrainingDueDate ? new Date(bhpTrainingDueDate) : null) : targetUser.bhpTrainingDueDate,
      },
      select: { id: true, login: true, name: true, email: true, role: true, bhpTrainingDueDate: true }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Nie udało się zaktualizować użytkownika' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Fetch target user to be deleted
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Użytkownik nie istnieje' }, { status: 404 });
    }

    const targetRoleUpper = String(targetUser.role || '').toUpperCase();
    const isTargetZarzad = targetRoleUpper === 'ZARZAD' || targetRoleUpper === 'ZARZĄD' || targetRoleUpper === 'BOARD';

    // Core Protection Rule:
    // Zarząd has supreme authority and can delete ADMIN users.
    // Regular ADMIN CANNOT delete Zarząd users!
    if (isTargetZarzad && !session.isZarzad) {
      return NextResponse.json({
        error: 'Niedozwolona operacja! Rola Zarząd posiada nadrzędną władzę w zakładzie – Administrator nie może usuwać kont Zarządu!'
      }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: `Usunięto użytkownika ${targetUser.name}` });
  } catch (error: any) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json({ error: error?.message || 'Nie udało się usunąć użytkownika' }, { status: 500 });
  }
}
