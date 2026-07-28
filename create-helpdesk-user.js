const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');

const db = new Database('./prisma/dev.db');

// Get admin's password hash to use as default
const admin = db.prepare('SELECT passwordHash FROM User WHERE login = ?').get('admin');

const itHelpDeskUser = {
  id: randomUUID(),
  name: 'IT Help Desk',
  login: 'helpdesk',
  email: 'helpdesk@company.pl',
  passwordHash: admin.passwordHash, // Same hash as admin
  roleId: 'd958ffdb-22c0-46b7-9824-2cd54a7a8845', // Administrator role
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

try {
  db.prepare(`
    INSERT INTO User (id, name, login, email, passwordHash, roleId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    itHelpDeskUser.id,
    itHelpDeskUser.name,
    itHelpDeskUser.login,
    itHelpDeskUser.email,
    itHelpDeskUser.passwordHash,
    itHelpDeskUser.roleId,
    itHelpDeskUser.createdAt,
    itHelpDeskUser.updatedAt,
  );

  console.log('✅ IT Help Desk user created:');
  console.log(`   ID: ${itHelpDeskUser.id}`);
  console.log(`   Name: ${itHelpDeskUser.name}`);
  console.log(`   Login: ${itHelpDeskUser.login}`);
  console.log(`   Email: ${itHelpDeskUser.email}`);
} catch (error) {
  if (error.message.includes('UNIQUE constraint failed')) {
    console.log('ℹ️  User helpdesk already exists');
    const existing = db.prepare('SELECT id FROM User WHERE login = ?').get('helpdesk');
    console.log(`   ID: ${existing.id}`);
  } else {
    console.error('❌ Error:', error.message);
  }
}

db.close();
