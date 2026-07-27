const Database = require('better-sqlite3');

console.log('=== ROOT dev.db ===');
const db1 = new Database('dev.db');
const tables1 = db1.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables1.forEach(t => console.log(' -', t.name));
db1.close();

console.log('\n=== PRISMA/dev.db (BACKUP) ===');
const db2 = new Database('prisma/dev.db');
const tables2 = db2.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables2.forEach(t => console.log(' -', t.name));
db2.close();
