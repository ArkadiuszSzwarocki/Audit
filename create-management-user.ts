import bcrypt from 'bcryptjs';
import { prisma } from './src/config/db';

async function main() {
  const passwordHash = await bcrypt.hash('1', 10);

  const user = await prisma.user.upsert({
    where: { login: 'a' },
    update: {
      name: 'Zarząd A',
      email: 'a@example.com',
      passwordHash,
      role: 'ZARZAD',
      notifyBhp: true,
      notifyQuality: true,
      notifyFaults: true,
      notifyKaizen: true,
      notifyAudits: true,
      isKaizenCommittee: false,
    },
    create: {
      login: 'a',
      name: 'Zarząd A',
      email: 'a@example.com',
      passwordHash,
      role: 'ZARZAD',
      notifyBhp: true,
      notifyQuality: true,
      notifyFaults: true,
      notifyKaizen: true,
      notifyAudits: true,
      isKaizenCommittee: false,
    },
    select: { id: true, login: true, role: true, name: true },
  });

  console.log(JSON.stringify(user));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
