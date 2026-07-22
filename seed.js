const Database = require('better-sqlite3');
const db = new Database('dev.db');

// Areas
const stmtArea = db.prepare('INSERT INTO Area (id, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)');
const halaAId = 'area-1';
const magazynId = 'area-2';
const halaBId = 'area-3';
const now = new Date().toISOString();

try {
  stmtArea.run(halaAId, 'Hala Produkcyjna A', 'Główna hala produkcyjna', now, now);
  stmtArea.run(magazynId, 'Magazyn Surowców', 'Magazyn komponentów wlotowych', now, now);
  stmtArea.run(halaBId, 'Hala Produkcyjna B', 'Hala obróbki', now, now);
} catch(e) {
  console.log("Areas might already exist.");
}

// Machines
const stmtMachine = db.prepare('INSERT INTO Machine (id, name, areaId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)');

try {
  stmtMachine.run('m1', 'Mieszalnik 1', halaAId, now, now);
  stmtMachine.run('m2', 'Mieszalnik 2', halaAId, now, now);
  stmtMachine.run('m3', 'Linia Pakująca', halaAId, now, now);
  
  stmtMachine.run('m4', 'Wózek Widłowy 1', magazynId, now, now);
  stmtMachine.run('m5', 'Regał Wysokiego Składowania', magazynId, now, now);
  
  stmtMachine.run('m6', 'Prasa Hydrauliczna', halaBId, now, now);
  stmtMachine.run('m7', 'Frezarka CNC', halaBId, now, now);
} catch(e) {
  console.log("Machines might already exist.");
}

console.log('Dane zostały wgrane!');
