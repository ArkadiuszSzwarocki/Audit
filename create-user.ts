import { prisma } from './src/config/db';
import bcrypt from 'bcryptjs';

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
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('❌ Błąd: Login "jarek.niegodzisz" już istnieje w bazie!');
    } else {
      console.error('❌ Błąd:', error.message);
    }
    process.exit(1);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
