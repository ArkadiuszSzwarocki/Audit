import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const backupDb = './backups/dev_db_2026-07-24_21-26-46.db';

if (!fs.existsSync(backupDb)) {
  console.error(`❌ Backup nie znaleziony: ${backupDb}`);
  process.exit(1);
}

console.log(`📦 Czytam backup: ${backupDb}\n`);

try {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(backupDb);
  const db = new SQL.Database(fileBuffer);

  // Get Kaizen records
  console.log('═══ KAIZEN IDEAS ═══');
  const kaizenResult = db.exec(
    `SELECT id, title, status, submittedBy, createdAt FROM Kaizen ORDER BY createdAt DESC`
  );

  if (kaizenResult.length === 0 || kaizenResult[0].values.length === 0) {
    console.log('❌ Brak wniosków Kaizen w backup\n');
  } else {
    const kaizens = kaizenResult[0].values;
    console.log(`✅ Znaleziono ${kaizens.length} wniosków Kaizen:\n`);
    kaizens.forEach((k, i) => {
      console.log(`${i + 1}. "${k[1]}"`);
      console.log(`   ID: ${k[0]}`);
      console.log(`   Status: ${k[2]}`);
      console.log(`   Autor: ${k[3]}`);
      console.log(`   Created: ${k[4]}\n`);
    });
  }

  // Get User records - check what columns exist
  console.log('\n═══ UŻYTKOWNICY ═══');
  const userResult = db.exec(
    `PRAGMA table_info(User)`
  );
  
  // Get actual user data
  const usersDataResult = db.exec(
    `SELECT * FROM User ORDER BY login ASC LIMIT 10`
  );

  if (usersDataResult.length === 0 || usersDataResult[0].values.length === 0) {
    console.log('❌ Brak użytkowników w backup\n');
  } else {
    const users = usersDataResult[0].values;
    const columns = usersDataResult[0].columns;
    console.log(`✅ Znaleziono ${users.length} użytkowników:\n`);
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u[columns.indexOf('login')]} (${u[columns.indexOf('email')]})`);
      if (columns.includes('fullName')) {
        console.log(`   Nazwa: ${u[columns.indexOf('fullName')]}`);
      }
      console.log(`   Active: ${u[columns.indexOf('active')]}\n`);
    });
  }

  // Summary
  console.log('\n═══ STATYSTYKA ═══');
  const tables = ['Area', 'Machine', 'Audit', 'Observation', 'Document', 'FaultReport', 'BhpHazardReport', 'Role', 'Kaizen', 'User'];
  
  tables.forEach(table => {
    const result = db.exec(`SELECT COUNT(*) as cnt FROM ${table}`);
    const count = result[0]?.values[0]?.[0] || 0;
    console.log(`${table}: ${count}`);
  });

  console.log('\n✅ Gotowe');
  db.close();
} catch (error) {
  console.error('❌ Błąd:', error.message);
  process.exit(1);
}
