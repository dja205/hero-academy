/**
 * Integration tests for Boss Battle API endpoints.
 *
 * TDD skeletons — the boss router (../routes/boss) does not exist yet.
 * These tests will fail on import or 404 until the routes are implemented
 * and registered in app.ts.
 *
 * ISS-BB-003: GET /api/v1/boss/:subjectId/status
 * ISS-BB-004: GET /api/v1/boss/:subjectId/questions
 * ISS-BB-005: POST /api/v1/boss/:subjectId/attempt
 * ISS-BB-006: Boss Achievements (via attempt endpoint)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';

import { applyMigrations, teardown } from '../__test-utils__/setup-db';
import { createApp } from '../app';
import { getDb } from '../db';
import { generateAccessToken } from '../services/auth';
import { Role } from '@hero-academy/shared';
import type express from 'express';

let app: express.Application;
let childToken: string;
let parentToken: string;

// ---------------------------------------------------------------------------
// Test constants
// ---------------------------------------------------------------------------

const PARENT_ID = 'parent-boss-rt-1';
const CHILD_ID = 'child-boss-rt-1';
const CHILD_ID_2 = 'child-boss-rt-2';
const SUBJECT_ID = 'subject-boss-rt-maths';
const BOSS_ID = 'boss-mathropolis';

const TOPIC_IDS = [
  'topic-boss-rt-add',
  'topic-boss-rt-sub',
  'topic-boss-rt-mul',
  'topic-boss-rt-div',
  'topic-boss-rt-frac',
];
const ASSESSMENT_IDS = [
  'assess-boss-rt-add',
  'assess-boss-rt-sub',
  'assess-boss-rt-mul',
  'assess-boss-rt-div',
  'assess-boss-rt-frac',
];

// Enough questions for a 20-question boss pool
const EASY_Q_IDS = ['q-rt-e1', 'q-rt-e2', 'q-rt-e3', 'q-rt-e4', 'q-rt-e5', 'q-rt-e6'];
const MEDIUM_Q_IDS = ['q-rt-m1', 'q-rt-m2', 'q-rt-m3', 'q-rt-m4', 'q-rt-m5', 'q-rt-m6', 'q-rt-m7', 'q-rt-m8', 'q-rt-m9', 'q-rt-m10'];
const HARD_Q_IDS = ['q-rt-h1', 'q-rt-h2', 'q-rt-h3', 'q-rt-h4', 'q-rt-h5', 'q-rt-h6', 'q-rt-h7', 'q-rt-h8', 'q-rt-h9', 'q-rt-h10'];
const ALL_Q_IDS = [...EASY_Q_IDS, ...MEDIUM_Q_IDS, ...HARD_Q_IDS];

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

function seedFullBossData() {
  const db = getDb();
  const bcrypt = require('bcryptjs');

  // Parent
  db.prepare(
    `INSERT INTO parents (id, email, password_hash, name, email_verified) VALUES (?, ?, ?, ?, 1)`,
  ).run(PARENT_ID, 'boss-rt@hero.com', bcrypt.hashSync('pass', 4), 'Boss RT Parent');

  // Children
  db.prepare(
    `INSERT INTO children (id, parent_id, name, hero_name, pin_hash, xp, rank, current_streak, best_streak, last_active_date)
     VALUES (?, ?, ?, ?, ?, 0, 'Recruit', 0, 0, NULL)`,
  ).run(CHILD_ID, PARENT_ID, 'Boss Child', 'DragonSlayer', bcrypt.hashSync('1234', 4));

  db.prepare(
    `INSERT INTO children (id, parent_id, name, hero_name, pin_hash, xp, rank, current_streak, best_streak, last_active_date)
     VALUES (?, ?, ?, ?, ?, 0, 'Recruit', 0, 0, NULL)`,
  ).run(CHILD_ID_2, PARENT_ID, 'Locked Child', 'LockedHero', bcrypt.hashSync('5678', 4));

  // Subject
  db.prepare(
    `INSERT INTO subjects (id, name, zone_name, colour) VALUES (?, ?, ?, ?)`,
  ).run(SUBJECT_ID, 'Maths', 'Mathropolis', '#3b82f6');

  // Boss
  db.prepare(
    `INSERT INTO boss_battles (id, subject_id, name, emoji, hp, question_count)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(BOSS_ID, SUBJECT_ID, 'The Number Dragon', '🐲', 10, 20);

  // 5 topics
  TOPIC_IDS.forEach((tid, i) => {
    db.prepare(
      `INSERT INTO topics (id, subject_id, name, district_name, colour) VALUES (?, ?, ?, ?, ?)`,
    ).run(tid, SUBJECT_ID, `Topic ${i + 1}`, `District ${i + 1}`, '#22c55e');
  });

  // 1 assessment per topic
  TOPIC_IDS.forEach((tid, i) => {
    db.prepare(
      `INSERT INTO assessments (id, topic_id, title, difficulty, question_ids, active)
       VALUES (?, ?, ?, ?, ?, 1)`,
    ).run(ASSESSMENT_IDS[i], tid, `Assessment ${i + 1}`, 'easy', '[]');
  });

  // Questions across difficulty levels
  EASY_Q_IDS.forEach((id, i) => {
    db.prepare(
      `INSERT INTO questions (id, topic_id, text, options, correct_index, explanation, difficulty)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, TOPIC_IDS[i % 5], `Easy Q ${i}?`, '["A","B","C","D"]', 0, 'Correct is A', 'easy');
  });

  MEDIUM_Q_IDS.forEach((id, i) => {
    db.prepare(
      `INSERT INTO questions (id, topic_id, text, options, correct_index, explanation, difficulty)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, TOPIC_IDS[i % 5], `Medium Q ${i}?`, '["A","B","C","D"]', 1, 'Correct is B', 'medium');
  });

  HARD_Q_IDS.forEach((id, i) => {
    db.prepare(
      `INSERT INTO questions (id, topic_id, text, options, correct_index, explanation, difficulty)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, TOPIC_IDS[i % 5], `Hard Q ${i}?`, '["A","B","C","D"]', 2, 'Correct is C', 'hard');
  });
}

function unlockBossForChild(childId: string) {
  const db = getDb();
  ASSESSMENT_IDS.forEach((aid, i) => {
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(`attempt-unlock-${childId}-${i}`, childId, aid, '[]', 1, 1, 1, 10, 30);
  });
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeAll(() => {
  applyMigrations();
  app = createApp();
  childToken = generateAccessToken({ sub: CHILD_ID, role: Role.Child, parentId: PARENT_ID });
  parentToken = generateAccessToken({ sub: PARENT_ID, role: Role.Parent });
});

afterAll(() => {
  teardown();
});

beforeEach(() => {
  const db = getDb();
  db.exec('DELETE FROM child_achievements');
  db.exec('DELETE FROM boss_attempts');
  db.exec('DELETE FROM attempts');
  db.exec('DELETE FROM questions');
  db.exec('DELETE FROM assessments');
  db.exec('DELETE FROM topics');
  db.exec('DELETE FROM boss_battles');
  db.exec('DELETE FROM children');
  db.exec('DELETE FROM subjects');
  db.exec('DELETE FROM parents');
  seedFullBossData();
});

// ===========================================================================
// ISS-BB-003: GET /api/v1/boss/:subjectId/status
// ===========================================================================

describe('GET /api/v1/boss/:subjectId/status — auth', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get(`/api/v1/boss/${SUBJECT_ID}/status`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 when a parent token is used (requires child role)', async () => {
    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/status`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('GET /api/v1/boss/:subjectId/status — not found', () => {
  it('returns 404 when subject does not exist', async () => {
    const res = await request(app)
      .get('/api/v1/boss/nonexistent-subject/status')
      .set('Authorization', `Bearer ${childToken}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('GET /api/v1/boss/:subjectId/status — unlock logic', () => {
  it('returns unlocked: false when districts are incomplete', async () => {
    // Child has no attempts at all — boss is locked
    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/status`)
      .set('Authorization', `Bearer ${childToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unlocked).toBe(false);
  });

  it('returns unlocked: false when only 4 of 5 districts have attempts', async () => {
    const db = getDb();
    for (let i = 0; i < 4; i++) {
      db.prepare(
        `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(`attempt-partial-${i}`, CHILD_ID, ASSESSMENT_IDS[i], '[]', 1, 1, 1, 10, 30);
    }

    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/status`)
      .set('Authorization', `Bearer ${childToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.unlocked).toBe(false);
  });

  it('returns unlocked: true when all 5 districts have ≥1 completed attempt', async () => {
    unlockBossForChild(CHILD_ID);

    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/status`)
      .set('Authorization', `Bearer ${childToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.unlocked).toBe(true);
  });
});

describe('GET /api/v1/boss/:subjectId/status — response shape', () => {
  it('returns boss definition fields', async () => {
    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/status`)
      .set('Authorization', `Bearer ${childToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data).toHaveProperty('boss');
    expect(data.boss.id).toBe(BOSS_ID);
    expect(data.boss.name).toBe('The Number Dragon');
    expect(data.boss.emoji).toBe('🐲');
    expect(data.boss.hp).toBe(10);
    expect(data.boss.questionCount).toBe(20);
  });

  it('returns lastAttempt: null when child has no boss attempts', async () => {
    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/status`)
      .set('Authorization', `Bearer ${childToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.lastAttempt).toBeNull();
  });

  it('returns lastAttempt with most recent boss attempt data', async () => {
    unlockBossForChild(CHILD_ID);

    const db = getDb();
    db.prepare(
      `INSERT INTO boss_attempts (id, boss_id, child_id, attempt_token, outcome, lives_remaining, boss_hp_final, duration_seconds, xp_earned, score, max_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run('ba-status-1', BOSS_ID, CHILD_ID, 'token-status-1', 'defeat', 0, 3, 90, 0, 15, 20);

    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/status`)
      .set('Authorization', `Bearer ${childToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.lastAttempt).toBeDefined();
    expect(res.body.data.lastAttempt.outcome).toBe('defeat');
  });

  it('returns alreadyConquered: false when child has no victory', async () => {
    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/status`)
      .set('Authorization', `Bearer ${childToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.alreadyConquered).toBe(false);
  });

  it('returns alreadyConquered: true when child has a victory outcome', async () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO boss_attempts (id, boss_id, child_id, attempt_token, outcome, lives_remaining, boss_hp_final, duration_seconds, xp_earned, score, max_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run('ba-victory-status', BOSS_ID, CHILD_ID, 'token-victory-status', 'victory', 2, 0, 120, 660, 20, 20);

    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/status`)
      .set('Authorization', `Bearer ${childToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.alreadyConquered).toBe(true);
  });
});

// ===========================================================================
// ISS-BB-004: GET /api/v1/boss/:subjectId/questions
// ===========================================================================

describe('GET /api/v1/boss/:subjectId/questions — auth', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get(`/api/v1/boss/${SUBJECT_ID}/questions`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 when a parent token is used', async () => {
    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('GET /api/v1/boss/:subjectId/questions — boss locked', () => {
  it('returns 403 when boss is locked for this child (districts incomplete)', async () => {
    // No attempts at all — boss is locked
    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/v1/boss/:subjectId/questions — insufficient questions', () => {
  it('returns 400 when fewer than 5 total questions available', async () => {
    unlockBossForChild(CHILD_ID);

    // Remove most questions
    const db = getDb();
    const keepIds = ALL_Q_IDS.slice(0, 3);
    db.prepare(
      `DELETE FROM questions WHERE id NOT IN (${keepIds.map(() => '?').join(',')})`,
    ).run(...keepIds);

    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/boss/:subjectId/questions — happy path', () => {
  it('returns 20 questions when boss is unlocked', async () => {
    unlockBossForChild(CHILD_ID);

    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.questions).toHaveLength(20);
  });

  it('returns correct difficulty distribution: 8 hard, 8 medium, 4 easy', async () => {
    unlockBossForChild(CHILD_ID);

    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);

    const questions = res.body.data.questions;
    const hard = questions.filter((q: { difficulty: string }) => q.difficulty === 'hard');
    const medium = questions.filter((q: { difficulty: string }) => q.difficulty === 'medium');
    const easy = questions.filter((q: { difficulty: string }) => q.difficulty === 'easy');

    expect(hard).toHaveLength(8);
    expect(medium).toHaveLength(8);
    expect(easy).toHaveLength(4);
  });

  it('includes attemptToken UUID in response', async () => {
    unlockBossForChild(CHILD_ID);

    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);

    expect(res.body.data.attemptToken).toBeDefined();
    expect(typeof res.body.data.attemptToken).toBe('string');
    // UUID v4 format check
    expect(res.body.data.attemptToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('each question includes difficulty field', async () => {
    unlockBossForChild(CHILD_ID);

    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);

    for (const q of res.body.data.questions) {
      expect(q).toHaveProperty('difficulty');
      expect(['easy', 'medium', 'hard']).toContain(q.difficulty);
    }
  });

  it('each question includes correct_index (for client-side feedback)', async () => {
    unlockBossForChild(CHILD_ID);

    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);

    for (const q of res.body.data.questions) {
      expect(q).toHaveProperty('correct_index');
      expect(typeof q.correct_index).toBe('number');
      expect(q.correct_index).toBeGreaterThanOrEqual(0);
      expect(q.correct_index).toBeLessThanOrEqual(3);
    }
  });

  it('each question has id, text, options', async () => {
    unlockBossForChild(CHILD_ID);

    const res = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);

    for (const q of res.body.data.questions) {
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('text');
      expect(q).toHaveProperty('options');
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options).toHaveLength(4);
    }
  });
});

// ===========================================================================
// ISS-BB-005: POST /api/v1/boss/:subjectId/attempt
// ===========================================================================

describe('POST /api/v1/boss/:subjectId/attempt — auth', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app)
      .post(`/api/v1/boss/${SUBJECT_ID}/attempt`)
      .send({ answers: [], attemptToken: 'tok', bossId: BOSS_ID, outcome: 'victory', livesRemaining: 3, bossHpFinal: 0, durationSeconds: 60 });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 when a parent token is used', async () => {
    const res = await request(app)
      .post(`/api/v1/boss/${SUBJECT_ID}/attempt`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ answers: [], attemptToken: 'tok', bossId: BOSS_ID, outcome: 'victory', livesRemaining: 3, bossHpFinal: 0, durationSeconds: 60 });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('POST /api/v1/boss/:subjectId/attempt — server re-scoring', () => {
  it('server verifies outcome: victory when all answers correct and boss HP reaches 0', async () => {
    unlockBossForChild(CHILD_ID);

    // First get the question pool
    const poolRes = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);
    const { questions, attemptToken } = poolRes.body.data;

    // Answer all questions correctly
    const answers = questions.map((q: { correct_index: number }) => q.correct_index);

    const res = await request(app)
      .post(`/api/v1/boss/${SUBJECT_ID}/attempt`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        answers,
        attemptToken,
        bossId: BOSS_ID,
        outcome: 'victory',
        livesRemaining: 3,
        bossHpFinal: 0,
        durationSeconds: 120,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.outcome).toBe('victory');
    expect(res.body.data.bossHpFinal).toBe(0);
  });

  it('damage formula: easy=1, medium=2, hard=3 per correct answer', async () => {
    unlockBossForChild(CHILD_ID);

    const poolRes = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);
    const { questions, attemptToken } = poolRes.body.data;

    // Answer all correctly — compute expected total damage
    const answers = questions.map((q: { correct_index: number }) => q.correct_index);
    const expectedDamage = questions.reduce((sum: number, q: { difficulty: string }) => {
      const dmg = q.difficulty === 'hard' ? 3 : q.difficulty === 'medium' ? 2 : 1;
      return sum + dmg;
    }, 0);

    // With 8 hard (24) + 8 medium (16) + 4 easy (4) = 44 total damage
    // Boss HP starts at 10, so boss HP should reach 0 well before all questions answered
    expect(expectedDamage).toBe(44);

    const res = await request(app)
      .post(`/api/v1/boss/${SUBJECT_ID}/attempt`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        answers,
        attemptToken,
        bossId: BOSS_ID,
        outcome: 'victory',
        livesRemaining: 3,
        bossHpFinal: 0,
        durationSeconds: 120,
      });

    expect(res.status).toBe(201);
    // Server computes score as number correct
    expect(res.body.data.score).toBe(20);
    expect(res.body.data.maxScore).toBe(20);
  });

  it('defeat: child loses all 3 lives when answering wrong', async () => {
    unlockBossForChild(CHILD_ID);

    const poolRes = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);
    const { questions, attemptToken } = poolRes.body.data;

    // Answer all questions wrong (offset correct_index by 1)
    const answers = questions.map((q: { correct_index: number }) => (q.correct_index + 1) % 4);

    const res = await request(app)
      .post(`/api/v1/boss/${SUBJECT_ID}/attempt`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        answers,
        attemptToken,
        bossId: BOSS_ID,
        outcome: 'defeat',
        livesRemaining: 0,
        bossHpFinal: 10,
        durationSeconds: 90,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.outcome).toBe('defeat');
    expect(res.body.data.livesRemaining).toBe(0);
    expect(res.body.data.bossHpFinal).toBe(10); // no damage dealt
  });
});

describe('POST /api/v1/boss/:subjectId/attempt — XP', () => {
  it('first victory awards 660 XP (calculateXp(20, 3) * 3 = 220 * 3)', async () => {
    unlockBossForChild(CHILD_ID);

    const poolRes = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);
    const { questions, attemptToken } = poolRes.body.data;

    const answers = questions.map((q: { correct_index: number }) => q.correct_index);

    const res = await request(app)
      .post(`/api/v1/boss/${SUBJECT_ID}/attempt`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        answers,
        attemptToken,
        bossId: BOSS_ID,
        outcome: 'victory',
        livesRemaining: 2,
        bossHpFinal: 0,
        durationSeconds: 120,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.xpEarned).toBe(660);
  });

  it('subsequent victories award 0 XP', async () => {
    unlockBossForChild(CHILD_ID);

    // Record a prior victory
    const db = getDb();
    db.prepare(
      `INSERT INTO boss_attempts (id, boss_id, child_id, attempt_token, outcome, lives_remaining, boss_hp_final, duration_seconds, xp_earned, score, max_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run('ba-prior-victory', BOSS_ID, CHILD_ID, 'prior-token', 'victory', 2, 0, 100, 660, 20, 20);

    const poolRes = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);
    const { questions, attemptToken } = poolRes.body.data;
    const answers = questions.map((q: { correct_index: number }) => q.correct_index);

    const res = await request(app)
      .post(`/api/v1/boss/${SUBJECT_ID}/attempt`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        answers,
        attemptToken,
        bossId: BOSS_ID,
        outcome: 'victory',
        livesRemaining: 1,
        bossHpFinal: 0,
        durationSeconds: 100,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.xpEarned).toBe(0);
  });
});

describe('POST /api/v1/boss/:subjectId/attempt — idempotency', () => {
  it('returns 409 on duplicate attemptToken', async () => {
    unlockBossForChild(CHILD_ID);

    const poolRes = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);
    const { questions, attemptToken } = poolRes.body.data;
    const answers = questions.map((q: { correct_index: number }) => q.correct_index);

    const body = {
      answers,
      attemptToken,
      bossId: BOSS_ID,
      outcome: 'victory',
      livesRemaining: 2,
      bossHpFinal: 0,
      durationSeconds: 120,
    };

    // First submission — success
    const res1 = await request(app)
      .post(`/api/v1/boss/${SUBJECT_ID}/attempt`)
      .set('Authorization', `Bearer ${childToken}`)
      .send(body);
    expect(res1.status).toBe(201);

    // Second submission with same token — duplicate
    const res2 = await request(app)
      .post(`/api/v1/boss/${SUBJECT_ID}/attempt`)
      .set('Authorization', `Bearer ${childToken}`)
      .send(body);
    expect(res2.status).toBe(409);
    expect(res2.body.error.code).toBe('DUPLICATE');
  });
});

describe('POST /api/v1/boss/:subjectId/attempt — records boss_attempt row', () => {
  it('persists the boss_attempt in the database', async () => {
    unlockBossForChild(CHILD_ID);

    const poolRes = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);
    const { questions, attemptToken } = poolRes.body.data;
    const answers = questions.map((q: { correct_index: number }) => q.correct_index);

    await request(app)
      .post(`/api/v1/boss/${SUBJECT_ID}/attempt`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        answers,
        attemptToken,
        bossId: BOSS_ID,
        outcome: 'victory',
        livesRemaining: 2,
        bossHpFinal: 0,
        durationSeconds: 120,
      });

    const db = getDb();
    const row = db
      .prepare('SELECT * FROM boss_attempts WHERE attempt_token = ?')
      .get(attemptToken) as Record<string, unknown> | undefined;

    expect(row).toBeDefined();
    expect(row!.boss_id).toBe(BOSS_ID);
    expect(row!.child_id).toBe(CHILD_ID);
    expect(row!.outcome).toBe('victory');
    expect(row!.lives_remaining).toBe(2);
    expect(row!.boss_hp_final).toBe(0);
    expect(row!.duration_seconds).toBe(120);
    expect(row!.score).toBe(20);
    expect(row!.max_score).toBe(20);
  });
});

describe('POST /api/v1/boss/:subjectId/attempt — gamification response shape', () => {
  it('returns full gamification data on victory', async () => {
    unlockBossForChild(CHILD_ID);

    const poolRes = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);
    const { questions, attemptToken } = poolRes.body.data;
    const answers = questions.map((q: { correct_index: number }) => q.correct_index);

    const res = await request(app)
      .post(`/api/v1/boss/${SUBJECT_ID}/attempt`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        answers,
        attemptToken,
        bossId: BOSS_ID,
        outcome: 'victory',
        livesRemaining: 2,
        bossHpFinal: 0,
        durationSeconds: 120,
      });

    expect(res.status).toBe(201);
    const data = res.body.data;

    expect(data).toHaveProperty('xpEarned');
    expect(data).toHaveProperty('newTotalXp');
    expect(data).toHaveProperty('currentRank');
    expect(data).toHaveProperty('newRank');
    expect(data).toHaveProperty('currentStreak');
    expect(data).toHaveProperty('bestStreak');
    expect(data).toHaveProperty('newAchievements');
    expect(data).toHaveProperty('outcome');
    expect(data).toHaveProperty('score');
    expect(data).toHaveProperty('maxScore');
    expect(data).toHaveProperty('bossHpFinal');
    expect(data).toHaveProperty('livesRemaining');

    expect(typeof data.xpEarned).toBe('number');
    expect(typeof data.newTotalXp).toBe('number');
    expect(typeof data.currentRank).toBe('string');
    expect(Array.isArray(data.newAchievements)).toBe(true);
  });
});

// ===========================================================================
// ISS-BB-006: Boss Achievements (via attempt endpoint)
// ===========================================================================

describe('POST /api/v1/boss/:subjectId/attempt — achievements', () => {
  it('awards boss_slayer achievement on first boss victory', async () => {
    unlockBossForChild(CHILD_ID);

    const poolRes = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);
    const { questions, attemptToken } = poolRes.body.data;
    const answers = questions.map((q: { correct_index: number }) => q.correct_index);

    const res = await request(app)
      .post(`/api/v1/boss/${SUBJECT_ID}/attempt`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        answers,
        attemptToken,
        bossId: BOSS_ID,
        outcome: 'victory',
        livesRemaining: 2,
        bossHpFinal: 0,
        durationSeconds: 120,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.newAchievements).toContain('boss_slayer');
  });

  it('awards zone_conquered_mathropolis on first Mathropolis boss victory', async () => {
    unlockBossForChild(CHILD_ID);

    const poolRes = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);
    const { questions, attemptToken } = poolRes.body.data;
    const answers = questions.map((q: { correct_index: number }) => q.correct_index);

    const res = await request(app)
      .post(`/api/v1/boss/${SUBJECT_ID}/attempt`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        answers,
        attemptToken,
        bossId: BOSS_ID,
        outcome: 'victory',
        livesRemaining: 2,
        bossHpFinal: 0,
        durationSeconds: 120,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.newAchievements).toContain('zone_conquered_mathropolis');
  });

  it('does not award boss achievements on defeat', async () => {
    unlockBossForChild(CHILD_ID);

    const poolRes = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);
    const { questions, attemptToken } = poolRes.body.data;
    const answers = questions.map((q: { correct_index: number }) => (q.correct_index + 1) % 4);

    const res = await request(app)
      .post(`/api/v1/boss/${SUBJECT_ID}/attempt`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        answers,
        attemptToken,
        bossId: BOSS_ID,
        outcome: 'defeat',
        livesRemaining: 0,
        bossHpFinal: 10,
        durationSeconds: 90,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.newAchievements).not.toContain('boss_slayer');
    expect(res.body.data.newAchievements).not.toContain('zone_conquered_mathropolis');
  });

  it('achievements persist in child_achievements table', async () => {
    unlockBossForChild(CHILD_ID);

    const poolRes = await request(app)
      .get(`/api/v1/boss/${SUBJECT_ID}/questions`)
      .set('Authorization', `Bearer ${childToken}`);
    const { questions, attemptToken } = poolRes.body.data;
    const answers = questions.map((q: { correct_index: number }) => q.correct_index);

    await request(app)
      .post(`/api/v1/boss/${SUBJECT_ID}/attempt`)
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        answers,
        attemptToken,
        bossId: BOSS_ID,
        outcome: 'victory',
        livesRemaining: 2,
        bossHpFinal: 0,
        durationSeconds: 120,
      });

    const db = getDb();
    const achievements = db
      .prepare('SELECT type FROM child_achievements WHERE child_id = ?')
      .all(CHILD_ID) as Array<{ type: string }>;
    const types = achievements.map((a) => a.type);

    expect(types).toContain('boss_slayer');
    expect(types).toContain('zone_conquered_mathropolis');
  });
});
