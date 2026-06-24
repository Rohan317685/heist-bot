import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'heist_support.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      thread_ts TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      resolved_by TEXT
    );

    CREATE TABLE IF NOT EXISTS support_team (
      user_id TEXT PRIMARY KEY,
      added_by TEXT NOT NULL,
      added_at TEXT NOT NULL
    );
  `);

  const hasTicketNumber = db
    .prepare("SELECT COUNT(*) as cnt FROM pragma_table_info('tickets') WHERE name = 'ticket_number'")
    .get() as { cnt: number };

  if (hasTicketNumber.cnt === 0) {
    db.exec(`ALTER TABLE tickets ADD COLUMN ticket_number INTEGER`);
    const rows = db.prepare('SELECT thread_ts FROM tickets ORDER BY created_at ASC').all() as { thread_ts: string }[];
    let num = 1;
    const update = db.prepare('UPDATE tickets SET ticket_number = ? WHERE thread_ts = ?');
    const tx = db.transaction(() => {
      for (const row of rows) {
        update.run(num++, row.thread_ts);
      }
    });
    tx();
  }
}
