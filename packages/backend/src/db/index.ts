import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const isMemory = config.DATABASE_PATH === ':memory:';
  const dbPath = isMemory ? ':memory:' : path.resolve(config.DATABASE_PATH);

  if (!isMemory) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  db = new Database(dbPath);
  if (!isMemory) db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function initDb(): Database.Database {
  return getDb();
}
