import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('./prisma/dev.db');

// List of users and their test passwords
const users = [
  { login: 'admin', password: 'admin' },
  { login: 'helpdesk', password: 'helpdesk' },
  { login: 'AC', password: 'AC' },
  { login: 'KsybeCez', password: 'KsybeCez' },
];

console.log('Resetting passwords for test users...\n');

users.forEach(({ login, password }) => {
  const hash = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare('UPDATE User SET passwordHash = ? WHERE login = ?');
    const result = stmt.run(hash, login);
    
    if (result.changes > 0) {
      console.log(`✓ ${login}: password set to "${password}"`);
    } else {
      console.log(`✗ ${login}: user not found`);
    }
  } catch (e) {
    console.log(`✗ ${login}: error - ${e.message}`);
  }
});

console.log('\nDone!');

db.close();
