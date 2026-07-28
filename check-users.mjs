import Database from 'better-sqlite3';

const db = new Database('./prisma/dev.db');

const users = db.prepare('SELECT id, name, login FROM User').all();

console.log('\n✓ Users in database:');
users.forEach(u => {
  console.log(`  - ${u.name} (${u.login}) - ID: ${u.id}`);
});
console.log();

db.close();
