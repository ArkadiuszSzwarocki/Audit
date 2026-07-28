const Database = require('better-sqlite3');
const db = new Database('./prisma/dev.db');

const users = db.prepare('SELECT id, name, login, email FROM User').all();
console.log('Wszyscy użytkownicy:');
users.forEach(u => {
  console.log(`  ID: ${u.id}`);
  console.log(`  Name: ${u.name}`);
  console.log(`  Login: ${u.login}`);
  console.log(`  Email: ${u.email}`);
  console.log('---');
});

db.close();
