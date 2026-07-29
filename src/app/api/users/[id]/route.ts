import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthSession } from '@/lib/auth';
import { checkRolePermission } from '@/lib/permissions';
import { UserRepository } from '@/repositories/UserRepository';
import bcrypt from 'bcryptjs';

const userRepository = new UserRepository();

async function checkIsMasterAdmin(session: any): Promise<boolean> {
  if (!session) return false;
  if (session.isAdmin) return true;
  const loginLower = String(session.login || '').toLowerCase();
  const nameLower = String(session.name || '').toLowerCase();
  if (loginLower === 'masteradmin' || nameLower.includes('masteradmin') || loginLower.includes('master')) return true;

  if (session.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { login: true, name: true, role: true }
    });
    const dbLoginLower = String(dbUser?.login || '').toLowerCase();
    const dbNameLower = String(dbUser?.name || '').toLowerCase();
    const dbRoleUpper = String(dbUser?.role || '').toUpperCase();
    if (dbLoginLower === 'masteradmin' || dbNameLower.includes('masteradmin') || dbRoleUpper === 'ADMIN') return true;
  }
  return false;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<any> }) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  const isAllowedToEdit = session.isAdmin || checkRolePermission(session.role, 'users.edit') || checkRolePermission(session.role, 'users.reset_password');
  if (!isAllowedToEdit) {
    return NextResponse.json({ error: 'Brak uprawnień do edycji użytkowników. Sprawdź ustawienia w macierzy uprawnień.' }, { status: 403 });
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
      isKaizenCommittee,
    } = body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Użytkownik nie istnieje' }, { status: 404 });
    }

    if (String(targetUser.login || '').toLowerCase() === 'masteradmin') {
      return NextResponse.json({ error: 'Niedozwolona operacja! Ukryte konto systemowe MasterAdmin nie może być modyfikowane.' }, { status: 403 });
    }

    const isMasterAdmin = await checkIsMasterAdmin(session);
    const isAllowedToModifyZarzad = session.isZarzad || isMasterAdmin;

    const targetRoleUpper = String(targetUser.role || '').toUpperCase();
    const isTargetZarzad = targetRoleUpper === 'ZARZAD' || targetRoleUpper === 'ZARZĄD' || targetRoleUpper === 'BOARD';

    // Rule 1: Non-Zarząd non-MasterAdmin CANNOT modify a Zarząd user
    if (isTargetZarzad && !isAllowedToModifyZarzad) {
      return NextResponse.json({
        error: 'Niedozwolona operacja! Rola Zarząd posiada nadrzędną władzę – tylko obecny członek Zarządu lub Master Admin może edytować pracowników Zarządu!'
      }, { status: 403 });
    }

    // Rule 2: Only Zarząd or MasterAdmin can assign Zarząd role
    if (role) {
      const newRoleUpper = String(role).toUpperCase();
      const isAssigningZarzad = newRoleUpper === 'ZARZAD' || newRoleUpper === 'ZARZĄD' || newRoleUpper === 'BOARD';
      if (isAssigningZarzad && !isAllowedToModifyZarzad) {
        return NextResponse.json({
          error: 'Niedozwolona operacja! Tylko użytkownik z rolą Zarząd lub Master Admin może nadawać rolę Zarząd!'
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
      isKaizenCommittee: isKaizenCommittee !== undefined ? Boolean(isKaizenCommittee) : targetUser.isKaizenCommittee,
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
        isKaizenCommittee: true,
        createdAt: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<any> }) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  const isAllowedToDelete = session.isAdmin || checkRolePermission(session.role, 'users.delete');
  if (!isAllowedToDelete) {
    return NextResponse.json({ error: 'Brak uprawnień do usuwania użytkowników' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Użytkownik nie istnieje' }, { status: 404 });
    }

    if (String(targetUser.login || '').toLowerCase() === 'masteradmin') {
      return NextResponse.json({ error: 'Niedozwolona operacja! Ukryte konto systemowe MasterAdmin nie może być usunięte.' }, { status: 403 });
    }

    const isMasterAdmin = await checkIsMasterAdmin(session);
    const isAllowedToModifyZarzad = session.isZarzad || isMasterAdmin;

    const targetRoleUpper = String(targetUser.role || '').toUpperCase();
    if ((targetRoleUpper === 'ZARZAD' || targetRoleUpper === 'ZARZĄD' || targetRoleUpper === 'BOARD') && !isAllowedToModifyZarzad) {
      return NextResponse.json({ error: 'Niedozwolona operacja! Tylko Zarząd lub Master Admin może usuwać konta Zarządu!' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: 'Użytkownik usunięty' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user', details: error.message }, { status: 500 });
  }
}
