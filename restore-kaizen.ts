import Database from 'better-sqlite3';

const backupDb = new Database('backups/dev_db_2026-07-24_21-26-46.db', { readonly: true });
const currentDb = new Database('dev.db');

try {
  // Get the deleted kaizen from backup
  const kaizen = backupDb.prepare(`
    SELECT id, title, description, benefits, submittedBy, areaId, machineId, photoUrl, status, createdAt, updatedAt, pointsAwarded, isPaidOut, paidOutAt, payoutDocNum
    FROM Kaizen 
    WHERE id = '29af4344-193b-4dc9-aaeb-d87507c162ee'
  `).get() as any;

  if (!kaizen) {
    console.error('❌ Nie znaleziono kaizena w backupie!');
    process.exit(1);
  }

  console.log('📋 Przywracany kaizen:');
  console.log(`   Tytuł: ${kaizen.title}`);
  console.log(`   Autor: ${kaizen.submittedBy}`);
  console.log(`   Status: ${kaizen.status}`);

  // Insert into current database
  const insert = currentDb.prepare(`
    INSERT INTO Kaizen (id, title, description, benefits, submittedBy, areaId, machineId, photoUrl, status, createdAt, updatedAt, pointsAwarded, isPaidOut, paidOutAt, payoutDocNum)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    kaizen.id,
    kaizen.title,
    kaizen.description,
    kaizen.benefits,
    kaizen.submittedBy,
    kaizen.areaId,
    kaizen.machineId,
    kaizen.photoUrl,
    kaizen.status,
    kaizen.createdAt,
    kaizen.updatedAt,
    kaizen.pointsAwarded,
    kaizen.isPaidOut,
    kaizen.paidOutAt,
    kaizen.payoutDocNum
  );

  console.log('✅ Kaizen został przywrócony do bazy danych!');

} catch (error: any) {
  console.error('❌ Błąd:', error.message);
  process.exit(1);
} finally {
  backupDb.close();
  currentDb.close();
}
