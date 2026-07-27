import { PrismaClient } from './src/generated/prisma/index.js';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';

const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    // Hash the password
    const passwordHash = await bcrypt.hash('Jarek2026', 10);
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        login: 'jarek.niegodzisz',
        name: 'Jarek Niegodzisz',
        email: 'jarek.niegodzisz@allspice.pl',
        passwordHash,
        role: 'ZARZAD',
        notifyBhp: true,
        notifyQuality: true,
        notifyFaults: true,
        notifyKaizen: true,
        notifyAudits: true,
        isKaizenCommittee: true,
      },
      select: {
        id: true,
        login: true,
        name: true,
        email: true,
        role: true,
        isKaizenCommittee: true,
      }
    });
    
    console.log('✅ Użytkownik Jarek Niegodzisz został pomyślnie utworzony!');
    console.log('📋 Dane konta:');
    console.log('  Login:', user.login);
    console.log('  Imię:', user.name);
    console.log('  Email:', user.email);
    console.log('  Rola:', user.role);
    console.log('  Hasło: Jarek2026');
    console.log('  Komisja Kaizen:', user.isKaizenCommittee ? 'Tak ✅' : 'Nie');
  } catch (error) {
    if (error.code === 'P2002') {
      console.error('❌ Błąd: Login "jarek.niegodzisz" już istnieje w bazie!');
    } else {
      console.error('❌ Błąd:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
