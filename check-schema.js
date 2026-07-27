const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

console.log('\n=== KAIZEN TABLE STRUCTURE ===\n');
const info = db.pragma('table_info(Kaizen)');
info.forEach(col => {
  console.log(`${col.cid}. ${col.name.padEnd(20)} (${col.type.padEnd(15)}) - PK: ${col.pk}, NOT NULL: ${col.notnull}`);
});

console.log('\n=== SAMPLE KAIZEN RECORD ===\n');
const record = db.prepare('SELECT * FROM Kaizen LIMIT 1').get();
if (record) {
  Object.entries(record).forEach(([key, value]) => {
    console.log(`${key.padEnd(20)}: ${value === null ? '(NULL)' : JSON.stringify(value).slice(0, 60)}`);
  });
}

db.close();
