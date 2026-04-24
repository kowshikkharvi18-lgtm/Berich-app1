/**
 * BeRich DB Backup
 * ─────────────────
 * Copies app.db to backups/app_YYYY-MM-DD.db
 * Keeps last 30 daily backups automatically.
 * Run manually:  node db/backup.js
 * Or schedule:   add to start.bat or a cron/Task Scheduler
 */

const fs   = require('fs');
const path = require('path');

const DB_PATH     = process.env.DB_PATH || path.join(__dirname, 'app.db');
const BACKUP_DIR  = process.env.BACKUP_DIR || path.join(__dirname, 'backups');
const KEEP_DAYS   = 30;

function run() {
  if (!fs.existsSync(DB_PATH)) {
    console.log('⚠️  No database found at', DB_PATH);
    return;
  }

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const today    = new Date().toISOString().slice(0, 10);
  const destFile = path.join(BACKUP_DIR, `app_${today}.db`);

  // Copy the db file (WAL mode safe — SQLite allows file copy while WAL is active)
  fs.copyFileSync(DB_PATH, destFile);
  console.log(`✅ Backup saved → ${destFile}`);

  // Also copy WAL and SHM if they exist (for a consistent snapshot)
  for (const ext of ['-wal', '-shm']) {
    const src = DB_PATH + ext;
    if (fs.existsSync(src)) fs.copyFileSync(src, destFile + ext);
  }

  // ── Prune old backups (keep last KEEP_DAYS) ──────────────────────────────
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('app_') && f.endsWith('.db'))
    .sort();                          // oldest first

  const toDelete = files.slice(0, Math.max(0, files.length - KEEP_DAYS));
  for (const f of toDelete) {
    const full = path.join(BACKUP_DIR, f);
    fs.rmSync(full, { force: true });
    fs.rmSync(full + '-wal', { force: true });
    fs.rmSync(full + '-shm', { force: true });
    console.log(`🗑️  Pruned old backup: ${f}`);
  }

  console.log(`📦 Total backups kept: ${Math.min(files.length, KEEP_DAYS)}`);
}

run();
