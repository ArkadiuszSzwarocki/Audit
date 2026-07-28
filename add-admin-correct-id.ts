import { prisma } from './src/config/db';
import bcrypt from 'bcryptjs';

async function main() {
  try {
    const user = await prisma.user.create({
      data: {
        id: '1325db19-3483-4d7b-ae41-3e319e1e08ef',
        login: 'admin',
        name: 'Administrator',
        email: 'admin@allspice.pl',
        passwordHash: '$2a$10$xxx', // dummy hash, not used
        role: 'ADMIN',
        notifyBhp: false,
        notifyQuality: false,
        notifyFaults: false,
        notifyKaizen: false,
        notifyAudits: false,
      },
    });
    
    console.log('✅ Administrator with correct ID added!');
    console.log('ID:', user.id);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
