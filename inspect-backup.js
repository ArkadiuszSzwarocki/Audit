import Database from 'better-sqlite3';
import fs from 'fs';

const backupPath = './backups/dev_db_2026-07-24_21-26-46.db';

if (!fs.existsSync(backupPath)) {
  console.error(`❌ Backup not found: ${backupPath}`);
  process.exit(1);
}

console.log(`📦 Inspecting backup: ${backupPath}\n`);

const db = new Database(backupPath);

try {
  // Get Kaizen records
  console.log('═══ KAIZEN IDEAS ═══');
  const kaizens = db.prepare('SELECT * FROM Kaizen ORDER BY createdAt DESC').all();
  
  if (kaizens.length === 0) {
    console.log('❌ No Kaizen records found');
  } else {
    console.log(`✅ Found ${kaizens.length} Kaizen ideas:\n`);
    kaizens.forEach((k, i) => {
      console.log(`${i + 1}. ${k.title}`);
      console.log(`   ID: ${k.id}`);
      console.log(`   Status: ${k.status}`);
      console.log(`   Author: ${k.submittedBy}`);
      console.log(`   Created: ${k.createdAt}\n`);
    });
  }

  // Get User records
  console.log('\n═══ USERS ═══');
  const users = db.prepare('SELECT id, login, email, firstName, lastName, roleId, active FROM User ORDER BY login ASC').all();
  
  if (users.length === 0) {
    console.log('❌ No User records found');
  } else {
    console.log(`✅ Found ${users.length} users:\n`);
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.login} (${u.email})`);
      console.log(`   Name: ${u.firstName} ${u.lastName}`);
      console.log(`   RoleID: ${u.roleId} | Active: ${u.active}\n`);
    });
  }

  // Get count summary
  console.log('\n═══ DATABASE SUMMARY ═══');
  const tables = [
    'Area', 'Machine', 'Audit', 'AuditType', 'Observation', 'Document',
    'KaizenPayoutRequest', 'Role', 'FaultReport', 'BhpHazardReport', 'QualityReport'
  ];
  
  tables.forEach(table => {
    try {
      const count = db.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get().cnt;
      console.log(`${table}: ${count}`);
    } catch (e) {
      console.log(`${table}: ❌ ERROR`);
    }
  });

  db.close();
  console.log('\n✅ Done');
} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}
