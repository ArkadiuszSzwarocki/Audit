import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

const db = new Database('./prisma/dev.db');

// Get first user for createdBy
const user = db.prepare('SELECT id FROM User LIMIT 1').get();
if (!user) {
  console.error('No users found');
  process.exit(1);
}

// IT Help Desk user ID
const IT_HELPDESK_ID = 'e28e526c-6d52-44b6-9513-f55a05d94c1e';

const ticket = {
  id: randomUUID(),
  title: 'Test Ticket - Form Check',
  description: 'Testing new ticket management form with edit capabilities',
  type: 'PROBLEM',
  priority: 'HIGH',
  status: 'OPEN',
  createdById: user.id,
  assignedToId: IT_HELPDESK_ID,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

try {
  db.prepare(`
    INSERT INTO HelpDeskTicket (id, title, description, type, priority, status, createdById, assignedToId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ticket.id,
    ticket.title,
    ticket.description,
    ticket.type,
    ticket.priority,
    ticket.status,
    ticket.createdById,
    ticket.assignedToId,
    ticket.createdAt,
    ticket.updatedAt,
  );

  console.log('✅ Ticket created:');
  console.log(`   ID: ${ticket.id}`);
  console.log(`   Title: ${ticket.title}`);
  console.log(`   Assigned to: IT Help Desk`);
  console.log(`   Link: http://localhost:3000/helpdesk/tickets/${ticket.id}`);
} catch (error) {
  console.error('❌ Error creating ticket:', error.message);
  process.exit(1);
}

db.close();
