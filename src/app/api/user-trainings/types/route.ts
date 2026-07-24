import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  const userRoleUpper = String(session.role || '').toUpperCase();
  const isAuthorized =
    session.isAdmin ||
    session.isZarzad ||
    userRoleUpper.includes('KONTROLA') ||
    userRoleUpper.includes('JAKOSC') ||
    userRoleUpper.includes('AUDYT') ||
    userRoleUpper.includes('BHP');

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Brak uprawnień do dodawania typów szkoleń' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Podaj nazwę szkolenia lub badania' }, { status: 400 });
    }

    const cleanName = name.trim();

    const existing = await prisma.userTrainingType.findUnique({
      where: { name: cleanName },
    });

    if (existing) {
      return NextResponse.json({ error: `Kolumna "${cleanName}" już istnieje w systemie!` }, { status: 400 });
    }

    const newType = await prisma.userTrainingType.create({
      data: {
        name: cleanName,
        description: description ? description.trim() : null,
        isDefault: false,
      },
    });

    return NextResponse.json(newType, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/user-trainings/types Error:', error);
    return NextResponse.json({ error: error.message || 'Błąd dodawania typu szkolenia' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }

  const userRoleUpper = String(session.role || '').toUpperCase();
  const isAuthorized =
    session.isAdmin ||
    session.isZarzad ||
    userRoleUpper.includes('KONTROLA') ||
    userRoleUpper.includes('JAKOSC') ||
    userRoleUpper.includes('AUDYT') ||
    userRoleUpper.includes('BHP');

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Brak uprawnień do usuwania typów szkoleń' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Brak ID typu szkolenia' }, { status: 400 });
    }

    const targetType = await prisma.userTrainingType.findUnique({ where: { id } });
    if (!targetType) {
      return NextResponse.json({ error: 'Typ szkolenia nie istnieje' }, { status: 404 });
    }

    if (targetType.isDefault || targetType.name === 'Szkolenie BHP') {
      return NextResponse.json({ error: 'Szkolenie BHP jest domyślnym szkoleniem systemowym i nie może zostać usunięte' }, { status: 400 });
    }

    await prisma.userTrainingType.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `Usunięto kolumnę "${targetType.name}"` });
  } catch (error: any) {
    console.error('DELETE /api/user-trainings/types Error:', error);
    return NextResponse.json({ error: error.message || 'Błąd usuwania typu szkolenia' }, { status: 500 });
  }
}
