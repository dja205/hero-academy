import { getDb } from '../db/index';
import { v4 as uuidv4 } from 'uuid';

export function seedSubjects(): string {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM subjects WHERE name = ?').get('Maths');
  if (existing) {
    console.log('  Subjects already seeded, skipping.');
    return (existing as { id: string }).id;
  }

  const id = uuidv4();
  db.prepare(`INSERT INTO subjects (id, name, zone_name, colour, "order") VALUES (?, ?, ?, ?, ?)`)
    .run(id, 'Maths', 'Mathropolis', '#ef4444', 1);

  console.log('  Seeded: 1 subject (Maths/Mathropolis)');
  return id;
}
