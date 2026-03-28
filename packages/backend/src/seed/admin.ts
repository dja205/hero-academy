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

/**
 * Seeds a test parent + child for use when DEBUG_UNLOCK_ALL=true.
 * Credentials: parent test@test.com / password, child PIN 1111
 * Safe to call multiple times — skips if already exists.
 */
export function seedDebugTestAccount(): void {
  const db = getDb();
  const PARENT_ID = 'debug-parent-00000000-0000-0000-0000-000000000001';
  const CHILD_ID  = 'debug-child-000000000-0000-0000-0000-000000000001';

  // Find or create debug parent (check by email, not by fixed ID)
  let parentRow = db.prepare('SELECT id FROM parents WHERE email = ?').get('test@test.com') as { id: string } | undefined;
  if (!parentRow) {
    const passwordHash = bcrypt.hashSync('password', 12);
    db.prepare(`
      INSERT INTO parents (id, email, password_hash, name, subscription_status, subscription_plan, email_verified)
      VALUES (?, ?, ?, ?, 'active', 'hero', 1)
    `).run(PARENT_ID, 'test@test.com', passwordHash, 'Test Parent');
    parentRow = { id: PARENT_ID };
    console.log('  Seeded: debug parent (test@test.com / password)');
  } else {
    // Ensure password is 'password' for test convenience
    const passwordHash = bcrypt.hashSync('password', 12);
    db.prepare('UPDATE parents SET password_hash = ? WHERE id = ?').run(passwordHash, parentRow.id);
  }

  const actualParentId = parentRow.id;
  const existingChild = db.prepare('SELECT id FROM children WHERE parent_id = ? AND name = ?').get(actualParentId, 'TestHero');
  if (!existingChild) {
    const pinHash = bcrypt.hashSync('1111', 12);
    db.prepare(`
      INSERT INTO children (id, parent_id, name, hero_name, avatar_config, pin_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(CHILD_ID, actualParentId, 'TestHero', 'Captain Debug', '{"costume":1,"mask":1}', pinHash);
    console.log('  Seeded: debug child TestHero (PIN: 1111)');
  } else {
    // Ensure PIN is 1111
    const pinHash = bcrypt.hashSync('1111', 12);
    db.prepare('UPDATE children SET pin_hash = ? WHERE parent_id = ? AND name = ?').run(pinHash, actualParentId, 'TestHero');
  }
}
