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
  title: 'Zakup nowego monitora do biura',
  description: 'Potrzebujemy 3 nowe monitory Dell 24" dla stanowiska A1, A2 i A3. Budżet: 3000 zł',
  type: 'PURCHASE',
  priority: 'HIGH',
  status: 'PENDING_APPROVAL',
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

  console.log('✅ PURCHASE Ticket created:');
  console.log(`   ID: ${ticket.id}`);
  console.log(`   Title: ${ticket.title}`);
  console.log(`   Type: 🛒 PURCHASE`);
  console.log(`   Status: ${ticket.status} (waiting for management approval)`);
  console.log(`   Assigned to: IT Help Desk`);
  console.log(`   Link: http://localhost:3000/helpdesk/tickets/${ticket.id}`);
} catch (error) {
  console.error('❌ Error creating ticket:', error.message);
  process.exit(1);
}

db.close();
