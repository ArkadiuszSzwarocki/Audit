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

    // Ensure 'Zarząd' system role exists
    const hasZarzad = roles.some(r => r.name.toUpperCase() === 'ZARZĄD' || r.name.toUpperCase() === 'ZARZAD');
    if (!hasZarzad) {
      await prisma.role.create({
        data: {
          name: 'Zarząd',
          description: '👑 Nadrzędna dyrekcja i zarząd zakładu. Posiada najwyższe uprawnienia i prawo zarządzania kontami Administratorów.',
          isSystem: true,
          canCreateAudit: true,
          canCompleteAudit: true,
          canDeleteAudit: true,
          canManageStructure: true,
          canManageUsers: true,
          canManageTypes: true,
          canManageKaizen: true,
        }
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

    // Ensure 'Komisja Kaizen' system role exists
    const hasKomisja = roles.some(r => r.name.toUpperCase() === 'KOMISJA KAIZEN' || r.name.toUpperCase() === 'KAIZEN_COMMITTEE');
    if (!hasKomisja) {
      await prisma.role.create({
        data: {
          name: 'Komisja Kaizen',
          description: '💡 Członek Komisji Kaizen — ocena, weryfikacja, zatwierdzanie/odrzucanie i cofanie wniosków oraz zatwierdzanie/cofanie wypłat Kaizen',
          isSystem: true,
          canCreateAudit: false,
          canCompleteAudit: false,
          canDeleteAudit: false,
          canManageStructure: false,
          canManageUsers: false,
          canManageTypes: false,
          canManageKaizen: true,
        }
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

    // Inicjalizacja pozostałych domyślnych ról, jeśli baza jest pusta
    if (roles.length <= 1) {
      const defaultRoles = [
        {
          name: 'Administrator',
          description: 'Zarządzanie systemem audytów, użytkownikami i strukturą',
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
          name: 'Komisja Kaizen',
          description: '💡 Członek Komisji Kaizen — ocena, weryfikacja, zatwierdzanie/odrzucanie i cofanie wniosków oraz zatwierdzanie/cofanie wypłat Kaizen',
          isSystem: true,
          canCreateAudit: false,
          canCompleteAudit: false,
          canDeleteAudit: false,
          canManageStructure: false,
          canManageUsers: false,
          canManageTypes: false,
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
          name: 'Kontrola Jakości',
          description: 'Przeprowadzanie audytów oraz kontrola jakości na produkcji',
          isSystem: false,
          canCreateAudit: true,
          canCompleteAudit: true,
          canDeleteAudit: false,
          canManageStructure: false,
          canManageUsers: false,
          canManageTypes: false,
          canManageKaizen: true,
        }
      ];

      for (const dr of defaultRoles) {
        const exists = roles.some(r => r.name.toLowerCase() === dr.name.toLowerCase());
        if (!exists) {
          await prisma.role.create({ data: dr });
        }
      }

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
