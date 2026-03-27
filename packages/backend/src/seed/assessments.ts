import { getDb } from '../db/index';
import { v4 as uuidv4 } from 'uuid';
import { TOPIC_IDS } from './topics';

export function seedAssessments(): Record<string, string> {
  const db = getDb();
  const assessmentMap: Record<string, string> = {};

  const specs = [
    { topicKey: 'number_tower',    difficulty: 'easy',   title: 'Mission 1: Number Foundations', order: 1 },
    { topicKey: 'number_tower',    difficulty: 'medium', title: 'Mission 2: Number Challenge',    order: 2 },
    { topicKey: 'number_tower',    difficulty: 'hard',   title: 'Mission 3: Number Master',       order: 3 },
    { topicKey: 'fraction_falls',  difficulty: 'easy',   title: 'Mission 1: Fraction Basics',     order: 1 },
    { topicKey: 'fraction_falls',  difficulty: 'medium', title: 'Mission 2: Fraction Challenge',  order: 2 },
    { topicKey: 'fraction_falls',  difficulty: 'hard',   title: 'Mission 3: Fraction Master',     order: 3 },
    { topicKey: 'shape_city',      difficulty: 'easy',   title: 'Mission 1: Shape Basics',        order: 1 },
    { topicKey: 'shape_city',      difficulty: 'medium', title: 'Mission 2: Shape Challenge',     order: 2 },
    { topicKey: 'shape_city',      difficulty: 'hard',   title: 'Mission 3: Shape Master',        order: 3 },
    { topicKey: 'sequence_bridge', difficulty: 'easy',   title: 'Mission 1: Pattern Basics',      order: 1 },
    { topicKey: 'sequence_bridge', difficulty: 'medium', title: 'Mission 2: Pattern Challenge',   order: 2 },
    { topicKey: 'sequence_bridge', difficulty: 'hard',   title: 'Mission 3: Pattern Master',      order: 3 },
    { topicKey: 'problem_palace',  difficulty: 'easy',   title: 'Mission 1: Problem Basics',      order: 1 },
    { topicKey: 'problem_palace',  difficulty: 'medium', title: 'Mission 2: Problem Challenge',   order: 2 },
    { topicKey: 'problem_palace',  difficulty: 'hard',   title: 'Mission 3: Problem Master',      order: 3 },
  ];

  for (const spec of specs) {
    const mapKey = `${spec.topicKey}_${spec.difficulty}`;
    const topicId = TOPIC_IDS[spec.topicKey];
    if (!topicId) {
      console.warn(`  Warning: No topic ID for key "${spec.topicKey}" — run seedTopics first.`);
      continue;
    }

    const existing = db
      .prepare('SELECT id FROM assessments WHERE topic_id = ? AND difficulty = ?')
      .get(topicId, spec.difficulty);

    if (existing) {
      assessmentMap[mapKey] = (existing as { id: string }).id;
      continue;
    }

    const id = uuidv4();
    assessmentMap[mapKey] = id;
    db.prepare(`
      INSERT INTO assessments (id, topic_id, title, difficulty, question_ids, "order")
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, topicId, spec.title, spec.difficulty, '[]', spec.order);
  }

  console.log('  Seeded: 15 assessments');
  return assessmentMap;
}

export let ASSESSMENT_IDS: Record<string, string> = {};

export function initAssessmentIds(map: Record<string, string>): void {
  ASSESSMENT_IDS = map;
}
