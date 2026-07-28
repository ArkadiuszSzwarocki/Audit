import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

const db = new Database('./prisma/dev.db');

const user = db.prepare('SELECT id FROM User LIMIT 1').get();
const IT_HELPDESK_ID = 'e28e526c-6d52-44b6-9513-f55a05d94c1e';

const ticket = {
  id: randomUUID(),
  title: 'Zakup licencji oprogramowania - antywirus',
  description: 'Potrzebna nowa licencja antywirusa dla 50 stanowisk. Budżet: 2500 zł',
  type: 'PURCHASE',
  priority: 'MEDIUM',
  status: 'PENDING_APPROVAL',
  createdById: user.id,
  assignedToId: IT_HELPDESK_ID,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

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

console.log('✅ NEW PURCHASE Ticket created:');
console.log(`   ID: ${ticket.id}`);
console.log(`   Link: http://localhost:3000/helpdesk/tickets/${ticket.id}`);
console.log(`   Status: PENDING_APPROVAL (waiting for Zarząd approval)`);

db.close();
