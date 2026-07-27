import { PrismaClient } from './src/generated/prisma';
import * as fs from 'fs';

// Backup database path
const backupDb = './backups/dev_db_2026-07-24_21-26-46.db';

if (!fs.existsSync(backupDb)) {
  console.error(`❌ Backup nie znaleziony: ${backupDb}`);
  process.exit(1);
}

console.log(`📦 Czytam backup: ${backupDb}\n`);

// Create Prisma client pointing to backup database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${backupDb}`,
    },
  },
});

try {
  // Get Kaizen records
  console.log('═══ KAIZEN IDEAS ═══');
  const kaizens = await prisma.kaizen.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { login: true, firstName: true, lastName: true } } },
  });

  if (kaizens.length === 0) {
    console.log('❌ Brak wniosków Kaizen w backup\n');
  } else {
    console.log(`✅ Znaleziono ${kaizens.length} wniosków Kaizen:\n`);
    kaizens.forEach((k, i) => {
      console.log(`${i + 1}. "${k.title}"`);
      console.log(`   ID: ${k.id}`);
      console.log(`   Status: ${k.status}`);
      console.log(`   Autor: ${k.user?.login || 'N/A'}`);
      console.log(`   Created: ${k.createdAt}\n`);
    });
  }

  // Get User records
  console.log('\n═══ UŻYTKOWNICY ═══');
  const users = await prisma.user.findMany({
    orderBy: { login: 'asc' },
    select: {
      id: true,
      login: true,
      email: true,
      firstName: true,
      lastName: true,
      roleId: true,
      active: true,
    },
  });

  if (users.length === 0) {
    console.log('❌ Brak użytkowników w backup\n');
  } else {
    console.log(`✅ Znaleziono ${users.length} użytkowników:\n`);
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.login} (${u.email})`);
      console.log(`   Nazwa: ${u.firstName} ${u.lastName}`);
      console.log(`   RoleID: ${u.roleId} | Aktywny: ${u.active}\n`);
    });
  }

  // Summary
  console.log('\n═══ STATYSTYKA ═══');
  const areas = await prisma.area.count();
  const machines = await prisma.machine.count();
  const audits = await prisma.audit.count();
  const observations = await prisma.observation.count();
  const documents = await prisma.document.count();
  const faultReports = await prisma.faultReport.count();
  const bhpReports = await prisma.bhpHazardReport.count();
  const roles = await prisma.role.count();

  console.log(`Użytkownicy: ${users.length}`);
  console.log(`Role: ${roles}`);
  console.log(`Obszary: ${areas}`);
  console.log(`Maszyny: ${machines}`);
  console.log(`Audyty: ${audits}`);
  console.log(`Obserwacje: ${observations}`);
  console.log(`Kaizen: ${kaizens.length}`);
  console.log(`Dokumenty: ${documents}`);
  console.log(`Usterki: ${faultReports}`);
  console.log(`Raporty BHP: ${bhpReports}`);

  console.log('\n✅ Gotowe');
} catch (error) {
  console.error('❌ Błąd:', error.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
