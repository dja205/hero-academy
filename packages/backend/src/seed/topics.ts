import { getDb } from '../db/index';
import { v4 as uuidv4 } from 'uuid';

export const TOPIC_IDS: Record<string, string> = {};

export function seedTopics(subjectId: string): void {
  const db = getDb();

  const topics = [
    { key: 'number_tower',    name: 'Number Tower',    districtName: 'The Number Tower',   colour: '#3b82f6', order: 1 },
    { key: 'fraction_falls',  name: 'Fraction Falls',  districtName: 'Fraction Falls',      colour: '#8b5cf6', order: 2 },
    { key: 'shape_city',      name: 'Shape City',      districtName: 'Shape City',          colour: '#10b981', order: 3 },
    { key: 'sequence_bridge', name: 'Sequence Bridge', districtName: 'Sequence Bridge',     colour: '#f59e0b', order: 4 },
    { key: 'problem_palace',  name: 'Problem Palace',  districtName: 'The Problem Palace',  colour: '#ec4899', order: 5 },
  ];

  for (const t of topics) {
    const existing = db.prepare('SELECT id FROM topics WHERE name = ?').get(t.name);
    if (existing) {
      TOPIC_IDS[t.key] = (existing as { id: string }).id;
      continue;
    }
    const id = uuidv4();
    TOPIC_IDS[t.key] = id;
    db.prepare(`
      INSERT INTO topics (id, subject_id, name, district_name, colour, "order")
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, subjectId, t.name, t.districtName, t.colour, t.order);
  }
  console.log('  Seeded: 5 topics');
}
