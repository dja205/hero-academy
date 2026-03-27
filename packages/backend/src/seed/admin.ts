import { getDb } from '../db/index';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export function seedAdmin(): void {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM admins WHERE email = ?').get('admin@hero-academy.local');
  if (existing) {
    console.log('  Admin already seeded, skipping.');
    return;
  }
  const passwordHash = bcrypt.hashSync('AdminHero2024!', 12);
  db.prepare(`INSERT INTO admins (id, email, password_hash, name) VALUES (?, ?, ?, ?)`)
    .run(uuidv4(), 'admin@hero-academy.local', passwordHash, 'Super Admin');
  console.log('  Seeded: 1 admin (admin@hero-academy.local)');
}
