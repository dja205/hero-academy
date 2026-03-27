import fs from 'fs';
import path from 'path';
import { getDb } from './index';

export function runMigrations(): void {
  const db = getDb();
  const migrationsDir = path.join(__dirname, 'migrations');

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      run_at DATETIME NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const id = file.replace('.sql', '');
    const already = db.prepare('SELECT id FROM _migrations WHERE id = ?').get(id);
    if (already) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    db.exec(sql);
    db.prepare('INSERT INTO _migrations (id) VALUES (?)').run(id);
    console. Migration applied: ${file}`);log(`
  }
}

if (require.main === module) {
  runMigrations();
  console.log('Migrations complete.');
}
