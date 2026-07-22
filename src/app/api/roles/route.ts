import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET() {
  try {
    let roles = await prisma.role.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    // Inicjalizacja domyślnych ról, jeśli baza jest pusta
    if (roles.length === 0) {
      await prisma.role.createMany({
        data: [
          {
            name: 'Administrator',
            description: 'Pełen dostęp do wszystkich funkcji systemu',
            isSystem: true,
            canCreateAudit: true,
            canCompleteAudit: true,
            canDeleteAudit: true,
            canManageStructure: true,
            canManageUsers: true,
            canManageTypes: true,
            canManageKaizen: true,
          },
          {
            name: 'Operator Produkcji',
            description: 'Dostęp do zadań produkcyjnych i zgłaszania Kaizen',
            isSystem: true,
            canCreateAudit: false,
            canCompleteAudit: false,
            canDeleteAudit: false,
            canManageStructure: false,
            canManageUsers: false,
            canManageTypes: false,
            canManageKaizen: false,
          },
          {
            name: 'Audytor',
            description: 'Przeprowadzanie i zamykanie audytów',
            isSystem: false,
            canCreateAudit: true,
            canCompleteAudit: true,
            canDeleteAudit: false,
            canManageStructure: false,
            canManageUsers: false,
            canManageTypes: false,
            canManageKaizen: true,
          }
        ]
      });

      roles = await prisma.role.findMany({
        orderBy: { createdAt: 'asc' },
        include: {
          _count: {
            select: { users: true }
          }
        }
      });
    }

    return NextResponse.json(roles);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.name?.trim()) {
      return NextResponse.json({ error: 'Nazwa roli jest wymagana' }, { status: 400 });
    }

    const newRole = await prisma.role.create({
      data: {
        name: data.name.trim(),
        description: data.description || null,
        canCreateAudit: Boolean(data.canCreateAudit),
        canCompleteAudit: Boolean(data.canCompleteAudit),
        canDeleteAudit: Boolean(data.canDeleteAudit),
        canManageStructure: Boolean(data.canManageStructure),
        canManageUsers: Boolean(data.canManageUsers),
        canManageTypes: Boolean(data.canManageTypes),
        canManageKaizen: Boolean(data.canManageKaizen),
      }
    });

    return NextResponse.json(newRole, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Rola o takiej nazwie już istnieje' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
