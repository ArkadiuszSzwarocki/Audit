import Database from 'better-sqlite3';

const db = new Database('./prisma/dev.db');

// Delete old ticket
db.prepare('DELETE FROM HelpDeskTicketHistory WHERE ticketId = ?').run('7e48260b-978e-4ab6-b604-f7374e6aefa5');
db.prepare('DELETE FROM HelpDeskTicket WHERE id = ?').run('7e48260b-978e-4ab6-b604-f7374e6aefa5');

console.log('✓ Old ticket deleted');

// Create new one
const { randomUUID } = await import('crypto');

const user = db.prepare('SELECT id FROM User LIMIT 1').get();
const IT_HELPDESK_ID = 'e28e526c-6d52-44b6-9513-f55a05d94c1e';

const ticket = {
  id: randomUUID(),
  title: 'Zakup drukarki sieciowej dla działu IT',
  description: 'Potrzebna nowa drukarka laserowa sieciowa do druku dokumentów. Budżet: 5000 zł',
  type: 'PURCHASE',
  priority: 'HIGH',
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

console.log('✅ New PURCHASE Ticket created:');
console.log(`   ID: ${ticket.id}`);
console.log(`   Link: http://localhost:3000/helpdesk/tickets/${ticket.id}`);

db.close();
