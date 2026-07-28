import Database from 'better-sqlite3';

const db = new Database('./prisma/dev.db');

const ticket = db.prepare(`
  SELECT id, title, type, status, createdAt, updatedAt 
  FROM HelpDeskTicket 
  WHERE id = 'ec644827-8017-4e80-b9fc-d2b0a9a916cb'
`).get();

if (ticket) {
  console.log('\n✓ Ticket status:');
  console.log(`  ID: ${ticket.id}`);
  console.log(`  Title: ${ticket.title}`);
  console.log(`  Type: ${ticket.type}`);
  console.log(`  Status: ${ticket.status}`);
  console.log(`  Updated: ${ticket.updatedAt}`);
  console.log();
} else {
  console.log('Ticket not found');
}

// Check history entries
const history = db.prepare(`
  SELECT field, oldValue, newValue, changedBy, createdAt 
  FROM HelpDeskTicketHistory 
  WHERE ticketId = 'ec644827-8017-4e80-b9fc-d2b0a9a916cb'
  ORDER BY createdAt DESC
`).all();

if (history.length > 0) {
  console.log('✓ History entries:');
  history.forEach((h, idx) => {
    console.log(`  ${idx + 1}. ${h.field}: "${h.oldValue}" → "${h.newValue}"`);
  });
  console.log();
}

db.close();
