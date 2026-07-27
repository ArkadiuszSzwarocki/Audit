const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

console.log('Checking if assignedToId column exists in Kaizen table...\n');

const tableInfo = db.pragma('table_info(Kaizen)');
const hasAssignedToId = tableInfo.some(col => col.name === 'assignedToId');

if (hasAssignedToId) {
  console.log('✅ Column assignedToId already exists. No action needed.');
} else {
  console.log('❌ Column assignedToId is missing. Adding it now...\n');
  
  try {
    // Add the missing column
    db.exec(`ALTER TABLE Kaizen ADD COLUMN assignedToId TEXT;`);
    console.log('✅ Column assignedToId added successfully!\n');
    
    // Verify it was added
    const newTableInfo = db.pragma('table_info(Kaizen)');
    console.log('Updated Kaizen table structure:');
    newTableInfo.forEach(col => {
      if (col.name === 'assignedToId') {
        console.log(`  → ${col.name} (${col.type}) - NEW`);
      }
    });
    
    // Verify data is still intact
    const countResult = db.prepare('SELECT COUNT(*) as cnt FROM Kaizen').get();
    console.log(`\n✅ Kaizen records still intact: ${countResult.cnt}`);
  } catch (error) {
    console.error('❌ Error adding column:', error.message);
    process.exit(1);
  }
}

db.close();
console.log('\nDatabase update complete.');
