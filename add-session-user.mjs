import Database from 'better-sqlite3';

const db = new Database('./prisma/dev.db');

// Get or create admin role
const adminRole = db.prepare('SELECT id FROM Role WHERE name = ?').get('Administrator');

// Add missing session user to database with Administrator role
const newUser = {
  id: '1325db19-3483-4d7b-ae41-3e319e1e08ef',
  name: 'Session Admin',
  login: 'session_admin',
  email: 'sessionadmin@company.pl',
  roleId: adminRole?.id || null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

db.prepare(`
  INSERT OR IGNORE INTO User (id, name, login, email, roleId, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  newUser.id,
  newUser.name,
  newUser.login,
  newUser.email,
  newUser.roleId,
  newUser.createdAt,
  newUser.updatedAt,
);

console.log('✓ User 1325db19-3483-4d7b-ae41-3e319e1e08ef added to database');

db.close();
