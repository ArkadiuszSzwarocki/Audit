import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    console.log('🌱 Rozpoczynam seed\'owanie bazy...');

    // 1. Utwórz użytkowników testowych
    const admin = await prisma.user.upsert({
      where: { login: 'admin' },
      update: {},
      create: {
        login: 'admin',
        email: 'admin@audit.pl',
        name: 'Administrator',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'ADMIN',
      },
    });

    const manager = await prisma.user.upsert({
      where: { login: 'kierownik' },
      update: {},
      create: {
        login: 'kierownik',
        email: 'kierownik@audit.pl',
        name: 'Kierownik',
        passwordHash: await bcrypt.hash('kierownik123', 10),
        role: 'MANAGER',
      },
    });

    const operator = await prisma.user.upsert({
      where: { login: 'operator' },
      update: {},
      create: {
        login: 'operator',
        email: 'operator@audit.pl',
        name: 'Operator',
        passwordHash: await bcrypt.hash('operator123', 10),
        role: 'OPERATOR',
      },
    });

    console.log('✅ Użytkownicy utworzeni:');
    console.log('  Admin:', admin.login);
    console.log('  Manager:', manager.login);
    console.log('  Operator:', operator.login);

    return NextResponse.json({
      success: true,
      message: 'Seed\'owanie ukończone',
      users: [
        { login: admin.login, password: 'admin123', role: 'ADMIN' },
        { login: manager.login, password: 'kierownik123', role: 'MANAGER' },
        { login: operator.login, password: 'operator123', role: 'USER' },
      ],
    });
  } catch (error: any) {
    console.error('❌ Błąd seed\'owania:', error);
    return NextResponse.json({
      error: error.message,
    }, { status: 500 });
  }
}
