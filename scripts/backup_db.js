const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const dbPath = path.join(rootDir, 'dev.db');
const backupDir = path.join(rootDir, 'backups');

function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;
}

function runBackup() {
  console.log('[BACKUP] Inicjalizacja kopii zapasowej bazy SQLite...');

  if (!fs.existsSync(dbPath)) {
    console.error(`[BLAD] Baza danych nie istnieje pod ścieżką: ${dbPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = formatTimestamp();
  const targetBackupPath = path.join(backupDir, `dev_db_${timestamp}.db`);

  // Simple safe stream copy
  fs.copyFileSync(dbPath, targetBackupPath);
  console.log(`[SUKCES] Utworzono kopię zapasową: ${targetBackupPath}`);

  // Optional WAL mode auxiliary files
  const walPath = `${dbPath}-wal`;
  const shmPath = `${dbPath}-shm`;
  if (fs.existsSync(walPath)) {
    fs.copyFileSync(walPath, `${targetBackupPath}-wal`);
  }
  if (fs.existsSync(shmPath)) {
    fs.copyFileSync(shmPath, `${targetBackupPath}-shm`);
  }

  // Cleanup old backups older than 30 days
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const nowMs = Date.now();

  const files = fs.readdirSync(backupDir);
  let deletedCount = 0;

  files.forEach((file) => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    if (nowMs - stats.mtimeMs > thirtyDaysMs) {
      fs.unlinkSync(filePath);
      deletedCount++;
    }
  });

  if (deletedCount > 0) {
    console.log(`[CLEANUP] Usunięto ${deletedCount} przestarzałych kopii zapasowych (starszych niż 30 dni).`);
  }
}

runBackup();
