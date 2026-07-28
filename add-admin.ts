import { prisma } from './src/config/db';
import bcrypt from 'bcryptjs';

async function main() {
  try {
    const passwordHash = await bcrypt.hash('AdminPassword2026', 10);
    
    const user = await prisma.user.create({
      data: {
        login: 'admin',
        name: 'Administrator',
        email: 'admin@allspice.pl',
        passwordHash,
        role: 'ADMIN',
        notifyBhp: true,
        notifyQuality: true,
        notifyFaults: true,
        notifyKaizen: true,
        notifyAudits: true,
      },
    });
    
    console.log('✅ Administrator created!');
    console.log('ID:', user.id);
    console.log('Login:', user.login);
    console.log('Password: AdminPassword2026');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
