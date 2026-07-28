#!/usr/bin/env node

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

const db = new Database('prisma/dev.db');

try {
  console.log('🌱 Seeding test kaizens...');

  // Get first user
  const user = db.prepare('SELECT id FROM User LIMIT 1').get();
  if (!user) {
    console.error('❌ Brak użytkownika w bazie!');
    process.exit(1);
  }

  // Get first area
  const area = db.prepare('SELECT id FROM Area LIMIT 1').get();
  if (!area) {
    console.error('❌ Brak obszaru w bazie!');
    process.exit(1);
  }

  const now = new Date().toISOString();
  
  // Create 5 test kaizens
  const testKaizens = [
    {
      id: randomUUID(),
      title: 'Optymalizacja procesu kalibracji',
      description: 'Automatyzacja procesu kalibracji maszyn CNC',
      benefits: 'Oszczędność 2 godzin dziennie na każdej maszynie',
      submittedBy: user.id,
      status: 'APPROVED',
      pointsAwarded: 100,
      isPaidOut: 0,
      areaId: area.id,
      createdAt: now,
      updatedAt: now
    },
    {
      id: randomUUID(),
      title: 'Nowa organizacja magazynu',
      description: 'Reorganizacja layoutu magazynu',
      benefits: 'Zmniejszenie czasu wyszukiwania materiałów o 30%',
      submittedBy: user.id,
      status: 'PENDING',
      pointsAwarded: 0,
      isPaidOut: 0,
      areaId: area.id,
      createdAt: now,
      updatedAt: now
    },
    {
      id: randomUUID(),
      title: 'Zmiana procedury kontroli jakości',
      description: 'Wdrożenie nowej procedury kontroli',
      benefits: 'Zmniejszenie wad z 2% do 0.5%',
      submittedBy: user.id,
      status: 'APPROVED',
      pointsAwarded: 150,
      isPaidOut: 1,
      paidOutAt: now,
      payoutDocNum: 'PAY-001',
      areaId: area.id,
      createdAt: now,
      updatedAt: now
    },
    {
      id: randomUUID(),
      title: 'Automatyzacja raportowania',
      description: 'Stworzenie skryptu do automatycznym raportowaniu',
      benefits: 'Oszczędność 5 godzin tygodniowo',
      submittedBy: user.id,
      status: 'REJECTED',
      pointsAwarded: 0,
      isPaidOut: 0,
      areaId: area.id,
      committeeNote: 'Wymaga dodatkowych testów',
      createdAt: now,
      updatedAt: now
    },
    {
      id: randomUUID(),
      title: 'Zmiana dostawcy materiałów',
      description: 'Umowa z nowym dostawcą o lepszych warunkach',
      benefits: 'Redukcja kosztów o 15%',
      submittedBy: user.id,
      status: 'APPROVED',
      pointsAwarded: 200,
      isPaidOut: 0,
      areaId: area.id,
      createdAt: now,
      updatedAt: now
    }
  ];

  const insert = db.prepare(`
    INSERT INTO Kaizen (id, title, description, benefits, submittedBy, status, pointsAwarded, isPaidOut, paidOutAt, payoutDocNum, areaId, committeeNote, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const kaizen of testKaizens) {
    insert.run(
      kaizen.id,
      kaizen.title,
      kaizen.description,
      kaizen.benefits,
      kaizen.submittedBy,
      kaizen.status,
      kaizen.pointsAwarded,
      kaizen.isPaidOut,
      kaizen.paidOutAt || null,
      kaizen.payoutDocNum || null,
      kaizen.areaId,
      kaizen.committeeNote || null,
      kaizen.createdAt,
      kaizen.updatedAt
    );
    console.log(`✅ Dodano: "${kaizen.title}"`);
  }

  console.log('\n✅ Seeding zakończony! Dodano 5 testowych kaizenów.');

} catch (error) {
  console.error('❌ Błąd:', error);
  process.exit(1);
} finally {
  db.close();
}
