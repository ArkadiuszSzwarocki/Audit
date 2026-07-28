const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

console.log('--- Ticket details ---');
try {
  const ticket = db.prepare("SELECT * FROM HelpDeskTicket WHERE id = 'c8a48b29-daf9-4710-b1ba-d1ef61a55708'").get();
  console.log(ticket);
} catch (e) {
  console.error(e);
}

console.log('--- Ticket History entries ---');
try {
  const history = db.prepare("SELECT * FROM HelpDeskTicketHistory WHERE ticketId = 'c8a48b29-daf9-4710-b1ba-d1ef61a55708'").all();
  console.log(history);
} catch (e) {
  console.error(e);
}

console.log('--- Zarząd / High level roles ---');
try {
  const roles = db.prepare("SELECT id, name FROM Role").all();
  console.log('Roles in system:', roles);
  
  const users = db.prepare("SELECT id, email, name, roleId, role FROM User").all();
  console.log('All Users:', users);
} catch (e) {
  console.error(e);
}