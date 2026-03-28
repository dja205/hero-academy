/**
 * Migration tests for 005_boss_battles.sql
 *
 * Validates that the boss_battles and boss_attempts tables are created
 * with correct schema, constraints, indexes, and seed data.
 *
 * ISS-BB-002: DB Migration
 * ISS-BB-012: Seed Data
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { applyMigrations, teardown } from '../../__test-utils__/setup-db';
import { getDb } from '../../db';

beforeAll(() => {
  applyMigrations();
});

afterAll(() => {
  teardown();
});

// ---------------------------------------------------------------------------
// ISS-BB-002: boss_battles table schema
// ---------------------------------------------------------------------------

describe('005_boss_battles migration — boss_battles table', () => {
  it('boss_battles table exists', () => {
    const db = getDb();
    const table = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='boss_battles'")
      .get() as { name: string } | undefined;
    expect(table).toBeDefined();
    expect(table!.name).toBe('boss_battles');
  });

  it('has all required columns with correct types', () => {
    const db = getDb();
    const columns = db.prepare("PRAGMA table_info('boss_battles')").all() as Array<{
      name: string;
      type: string;
      notnull: number;
      pk: number;
    }>;
    const colMap = new Map(columns.map((c) => [c.name, c]));

    // Primary key
    expect(colMap.get('id')).toBeDefined();
    expect(colMap.get('id')!.pk).toBe(1);
    expect(colMap.get('id')!.type).toBe('TEXT');

    // Foreign key to subjects
    expect(colMap.get('subject_id')).toBeDefined();
    expect(colMap.get('subject_id')!.type).toBe('TEXT');
    expect(colMap.get('subject_id')!.notnull).toBe(1);

    // Boss metadata
    expect(colMap.get('name')).toBeDefined();
    expect(colMap.get('name')!.type).toBe('TEXT');
    expect(colMap.get('name')!.notnull).toBe(1);

    expect(colMap.get('emoji')).toBeDefined();
    expect(colMap.get('emoji')!.type).toBe('TEXT');
    expect(colMap.get('emoji')!.notnull).toBe(1);

    // Game mechanics
    expect(colMap.get('hp')).toBeDefined();
    expect(colMap.get('hp')!.type).toBe('INTEGER');
    expect(colMap.get('hp')!.notnull).toBe(1);

    expect(colMap.get('question_count')).toBeDefined();
    expect(colMap.get('question_count')!.type).toBe('INTEGER');
    expect(colMap.get('question_count')!.notnull).toBe(1);

    // Timestamp
    expect(colMap.get('created_at')).toBeDefined();
  });

  it('subject_id references subjects(id)', () => {
    const db = getDb();
    const fks = db.prepare("PRAGMA foreign_key_list('boss_battles')").all() as Array<{
      table: string;
      from: string;
      to: string;
    }>;
    const subjectFk = fks.find((fk) => fk.from === 'subject_id');
    expect(subjectFk).toBeDefined();
    expect(subjectFk!.table).toBe('subjects');
    expect(subjectFk!.to).toBe('id');
  });
});

// ---------------------------------------------------------------------------
// ISS-BB-002: boss_attempts table schema
// ---------------------------------------------------------------------------

describe('005_boss_battles migration — boss_attempts table', () => {
  it('boss_attempts table exists', () => {
    const db = getDb();
    const table = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='boss_attempts'")
      .get() as { name: string } | undefined;
    expect(table).toBeDefined();
    expect(table!.name).toBe('boss_attempts');
  });

  it('has all required columns with correct types', () => {
    const db = getDb();
    const columns = db.prepare("PRAGMA table_info('boss_attempts')").all() as Array<{
      name: string;
      type: string;
      notnull: number;
      pk: number;
    }>;
    const colMap = new Map(columns.map((c) => [c.name, c]));

    // Primary key
    expect(colMap.get('id')).toBeDefined();
    expect(colMap.get('id')!.pk).toBe(1);

    // Foreign keys
    expect(colMap.get('boss_id')).toBeDefined();
    expect(colMap.get('boss_id')!.type).toBe('TEXT');
    expect(colMap.get('boss_id')!.notnull).toBe(1);

    expect(colMap.get('child_id')).toBeDefined();
    expect(colMap.get('child_id')!.type).toBe('TEXT');
    expect(colMap.get('child_id')!.notnull).toBe(1);

    // Idempotency token
    expect(colMap.get('attempt_token')).toBeDefined();
    expect(colMap.get('attempt_token')!.type).toBe('TEXT');
    expect(colMap.get('attempt_token')!.notnull).toBe(1);

    // Battle results
    expect(colMap.get('outcome')).toBeDefined();
    expect(colMap.get('outcome')!.type).toBe('TEXT');
    expect(colMap.get('outcome')!.notnull).toBe(1);

    expect(colMap.get('lives_remaining')).toBeDefined();
    expect(colMap.get('lives_remaining')!.type).toBe('INTEGER');
    expect(colMap.get('lives_remaining')!.notnull).toBe(1);

    expect(colMap.get('boss_hp_final')).toBeDefined();
    expect(colMap.get('boss_hp_final')!.type).toBe('INTEGER');
    expect(colMap.get('boss_hp_final')!.notnull).toBe(1);

    expect(colMap.get('duration_seconds')).toBeDefined();
    expect(colMap.get('duration_seconds')!.type).toBe('INTEGER');
    expect(colMap.get('duration_seconds')!.notnull).toBe(1);

    expect(colMap.get('xp_earned')).toBeDefined();
    expect(colMap.get('xp_earned')!.type).toBe('INTEGER');

    expect(colMap.get('score')).toBeDefined();
    expect(colMap.get('score')!.type).toBe('INTEGER');

    expect(colMap.get('max_score')).toBeDefined();
    expect(colMap.get('max_score')!.type).toBe('INTEGER');

    // Timestamp
    expect(colMap.get('created_at')).toBeDefined();
  });

  it('boss_id references boss_battles(id)', () => {
    const db = getDb();
    const fks = db.prepare("PRAGMA foreign_key_list('boss_attempts')").all() as Array<{
      table: string;
      from: string;
      to: string;
    }>;
    const bossFk = fks.find((fk) => fk.from === 'boss_id');
    expect(bossFk).toBeDefined();
    expect(bossFk!.table).toBe('boss_battles');
    expect(bossFk!.to).toBe('id');
  });

  it('child_id references children(id)', () => {
    const db = getDb();
    const fks = db.prepare("PRAGMA foreign_key_list('boss_attempts')").all() as Array<{
      table: string;
      from: string;
      to: string;
    }>;
    const childFk = fks.find((fk) => fk.from === 'child_id');
    expect(childFk).toBeDefined();
    expect(childFk!.table).toBe('children');
    expect(childFk!.to).toBe('id');
  });

  it('attempt_token has a unique index', () => {
    const db = getDb();
    const indexes = db.prepare("PRAGMA index_list('boss_attempts')").all() as Array<{
      name: string;
      unique: number;
    }>;
    // Find an index that covers attempt_token and is unique
    const uniqueIndexes = indexes.filter((idx) => idx.unique === 1);
    const hasUniqueToken = uniqueIndexes.some((idx) => {
      const cols = db.prepare(`PRAGMA index_info('${idx.name}')`).all() as Array<{
        name: string;
      }>;
      return cols.some((c) => c.name === 'attempt_token');
    });
    expect(hasUniqueToken).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ISS-BB-002: Indexes
// ---------------------------------------------------------------------------

describe('005_boss_battles migration — indexes', () => {
  it('has index on boss_attempts.child_id', () => {
    const db = getDb();
    const indexes = db.prepare("PRAGMA index_list('boss_attempts')").all() as Array<{
      name: string;
    }>;
    const hasChildIdx = indexes.some((idx) => {
      const cols = db.prepare(`PRAGMA index_info('${idx.name}')`).all() as Array<{
        name: string;
      }>;
      return cols.some((c) => c.name === 'child_id');
    });
    expect(hasChildIdx).toBe(true);
  });

  it('has index on boss_attempts.boss_id', () => {
    const db = getDb();
    const indexes = db.prepare("PRAGMA index_list('boss_attempts')").all() as Array<{
      name: string;
    }>;
    const hasBossIdx = indexes.some((idx) => {
      const cols = db.prepare(`PRAGMA index_info('${idx.name}')`).all() as Array<{
        name: string;
      }>;
      return cols.some((c) => c.name === 'boss_id');
    });
    expect(hasBossIdx).toBe(true);
  });

  it('has index on boss_battles.subject_id', () => {
    const db = getDb();
    const indexes = db.prepare("PRAGMA index_list('boss_battles')").all() as Array<{
      name: string;
    }>;
    const hasSubjectIdx = indexes.some((idx) => {
      const cols = db.prepare(`PRAGMA index_info('${idx.name}')`).all() as Array<{
        name: string;
      }>;
      return cols.some((c) => c.name === 'subject_id');
    });
    expect(hasSubjectIdx).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ISS-BB-012: Seed data — The Number Dragon
// ---------------------------------------------------------------------------

describe('005_boss_battles migration — seed data', () => {
  it('"The Number Dragon" boss is seeded for Mathropolis', () => {
    const db = getDb();

    // Seed a Mathropolis subject first if not already present
    db.prepare(
      `INSERT OR IGNORE INTO subjects (id, name, zone_name, colour) VALUES (?, ?, ?, ?)`,
    ).run('subject-maths', 'Maths', 'Mathropolis', '#3b82f6');

    const boss = db
      .prepare("SELECT * FROM boss_battles WHERE id = 'boss-mathropolis'")
      .get() as Record<string, unknown> | undefined;

    expect(boss).toBeDefined();
    expect(boss!.name).toBe('The Number Dragon');
    expect(boss!.emoji).toBe('🐲');
    expect(boss!.hp).toBe(10);
    expect(boss!.question_count).toBe(20);
  });

  it('seed boss references a valid subject', () => {
    const db = getDb();
    const boss = db
      .prepare("SELECT subject_id FROM boss_battles WHERE id = 'boss-mathropolis'")
      .get() as { subject_id: string } | undefined;

    expect(boss).toBeDefined();

    const subject = db
      .prepare('SELECT id FROM subjects WHERE id = ?')
      .get(boss!.subject_id) as { id: string } | undefined;
    expect(subject).toBeDefined();
  });
});
