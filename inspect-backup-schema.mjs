import Database from 'better-sqlite3';

const db = new Database('./backups/dev_db_2026-07-24_21-26-46.db');

console.log('\n📊 STRUKTURA TABEL W BACKUP:');

// Get all table names
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  ORDER BY name
`).all();

tables.forEach(row => {
  console.log(`\n${row.name}:`);
  
  const cols = db.prepare(`PRAGMA table_info(${row.name})`).all();
  cols.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}`);
  });
});

// Check Kaizen specifically
console.log('\n\n🔍 KAIZEN RECORDS:');
try {
  const kaizen = db.prepare('SELECT COUNT(*) as cnt FROM Kaizen').get();
  console.log(`Total: ${kaizen.cnt}`);
  
  if (kaizen.cnt > 0) {
    const records = db.prepare('SELECT id, title, status FROM Kaizen LIMIT 5').all();
    records.forEach((r, i) => {
      console.log(`${i+1}. "${r.title}" (${r.status})`);
    });
  }
} catch (err) {
  console.log(`❌ Error: ${err.message}`);
}

db.close();
process.exit(0);
