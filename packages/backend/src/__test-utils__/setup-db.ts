/**
 * Test helper: in-memory SQLite database with full schema.
 *
 * Environment variables are set by vitest.config.ts (before imports),
 * so getDb() returns an in-memory database.
 */

import fs from 'fs';
import path from 'path';

import { getDb, closeDb } from '../db';

const MIGRATIONS_DIR = path.join(__dirname, '../db/migrations');

/**
 * Apply all migration files to the in-memory database (idempotent).
 * Closes any existing connection first to guarantee a fresh DB.
 * Tracks applied migrations in _migrations table to avoid re-running ALTERs.
 */
export function applyMigrations(): void {
  // Close any existing DB to ensure a fresh instance
  closeDb();
  const db = getDb();

  // Drop all existing tables for a truly fresh schema (path.resolve(':memory:')
  // creates a real file that persists between test suites).
  db.pragma('foreign_keys = OFF');
  const tables = (
    db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[]
  ).map((t) => t.name);
  for (const t of tables) {
    db.exec(`DROP TABLE IF EXISTS "${t}"`);
  }
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      run_at DATETIME NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const id = file.replace('.sql', '');
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    db.exec(sql);
    db.prepare('INSERT OR IGNORE INTO _migrations (id) VALUES (?)').run(id);
  }
}

/**
 * Seed minimal test data: parent, child, subject, topic, questions, assessment.
 * Returns IDs for all seeded entities.
 */
export function seedTestData() {
  const db = getDb();

  const parentId = 'parent-test-1';
  const childId = 'child-test-1';
  const subjectId = 'subject-maths';
  const topicId = 'topic-addition';
  const assessmentId = 'assess-add-1';
  const q1 = 'q-1';
  const q2 = 'q-2';
  const q3 = 'q-3';

  // Parent
  db.prepare(
    `INSERT INTO parents (id, email, password_hash, name, email_verified)
     VALUES (?, ?, ?, ?, 1)`,
  ).run(parentId, 'test@hero.com', '$2a$12$placeholder', 'Test Parent');

  // Child (PIN: 1234)
  const bcrypt = require('bcryptjs');
  const pinHash = bcrypt.hashSync('1234', 4); // fast rounds for tests
  db.prepare(
    `INSERT INTO children (id, parent_id, name, hero_name, pin_hash, xp, rank, current_streak, best_streak, last_active_date)
     VALUES (?, ?, ?, ?, ?, 0, 'Recruit', 0, 0, NULL)`,
  ).run(childId, parentId, 'Test Child', 'SuperKid', pinHash);

  // Subject
  db.prepare(
    `INSERT INTO subjects (id, name, zone_name, colour) VALUES (?, ?, ?, ?)`,
  ).run(subjectId, 'Maths', 'Number Zone', '#3b82f6');

  // Topic
  db.prepare(
    `INSERT INTO topics (id, subject_id, name, district_name, colour)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(topicId, subjectId, 'Addition', 'Addition Alley', '#22c55e');

  // Questions (3 MCQ, correct answers: 0, 1, 2)
  db.prepare(
    `INSERT INTO questions (id, topic_id, text, options, correct_index, explanation, difficulty)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(q1, topicId, '1+1=?', '["2","3","4","5"]', 0, '1+1=2', 'easy');

  db.prepare(
    `INSERT INTO questions (id, topic_id, text, options, correct_index, explanation, difficulty)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(q2, topicId, '2+3=?', '["4","5","6","7"]', 1, '2+3=5', 'easy');

  db.prepare(
    `INSERT INTO questions (id, topic_id, text, options, correct_index, explanation, difficulty)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(q3, topicId, '5+5=?', '["8","9","10","11"]', 2, '5+5=10', 'easy');

  // Assessment referencing all 3 questions
  db.prepare(
    `INSERT INTO assessments (id, topic_id, title, difficulty, question_ids, active)
     VALUES (?, ?, ?, ?, ?, 1)`,
  ).run(assessmentId, topicId, 'Addition Basics', 'easy', JSON.stringify([q1, q2, q3]));

  return {
    parentId,
    childId,
    subjectId,
    topicId,
    assessmentId,
    questionIds: [q1, q2, q3],
    correctAnswers: [0, 1, 2],
  };
}

/**
 * Generate a child JWT for use in test requests.
 */
export function childToken(childId: string, parentId: string): string {
  const { generateAccessToken } = require('../services/auth');
  const { Role } = require('@hero-academy/shared');
  return generateAccessToken({ sub: childId, role: Role.Child, parentId });
}

/**
 * Teardown: close DB connection.
 */
export function teardown(): void {
  closeDb();
}
