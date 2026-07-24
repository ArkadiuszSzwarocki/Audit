import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest, { params }: { params: Promise<any> }) {
  const session = await getAuthSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      email,
      role,
      bhpTrainingDueDate,
      newPassword,
      responsibleAreaId,
      notifyBhp,
      notifyQuality,
      notifyFaults,
      notifyKaizen,
      notifyAudits,
    } = body;

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

    const updateData: any = {
      name: name !== undefined ? name : targetUser.name,
      email: email !== undefined ? (email?.trim() || null) : targetUser.email,
      role: role !== undefined ? role : targetUser.role,
      bhpTrainingDueDate: bhpTrainingDueDate !== undefined ? (bhpTrainingDueDate ? new Date(bhpTrainingDueDate) : null) : targetUser.bhpTrainingDueDate,
      responsibleAreaId: responsibleAreaId !== undefined ? (responsibleAreaId || null) : targetUser.responsibleAreaId,
      notifyBhp: notifyBhp !== undefined ? Boolean(notifyBhp) : targetUser.notifyBhp,
      notifyQuality: notifyQuality !== undefined ? Boolean(notifyQuality) : targetUser.notifyQuality,
      notifyFaults: notifyFaults !== undefined ? Boolean(notifyFaults) : targetUser.notifyFaults,
      notifyKaizen: notifyKaizen !== undefined ? Boolean(notifyKaizen) : targetUser.notifyKaizen,
      notifyAudits: notifyAudits !== undefined ? Boolean(notifyAudits) : targetUser.notifyAudits,
    };

    if (newPassword && String(newPassword).trim().length > 0) {
      if (String(newPassword).trim().length < 4) {
        return NextResponse.json({ error: 'Hasło musi mieć co najmniej 4 znaki' }, { status: 400 });
      }
      updateData.passwordHash = await bcrypt.hash(String(newPassword).trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        login: true,
        name: true,
        email: true,
        role: true,
        bhpTrainingDueDate: true,
        responsibleAreaId: true,
        responsibleArea: { select: { id: true, name: true } },
        notifyBhp: true,
        notifyQuality: true,
        notifyFaults: true,
        notifyKaizen: true,
        notifyAudits: true,
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Nie udało się zaktualizować użytkownika' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<any> }) {
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
