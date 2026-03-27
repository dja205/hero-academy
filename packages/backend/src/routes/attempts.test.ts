/**
 * Integration tests for POST /api/v1/attempts
 *
 * Tests the full attempt submission flow including:
 * - validation (missing/invalid fields)
 * - authentication & authorization
 * - scoring against question bank
 * - idempotency (duplicate attemptId → 409)
 * - gamification response shape (newRank can be null)
 * - assessment not found → 404
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

const PARENT_ID = 'parent-att-1';
const CHILD_ID = 'child-att-1';
const SUBJECT_ID = 'subject-att-maths';
const TOPIC_ID = 'topic-att-add';
const ASSESSMENT_ID = 'assess-att-1';
const Q1 = 'q-att-1';
const Q2 = 'q-att-2';
const Q3 = 'q-att-3';

function seedData() {
  const db = getDb();
  const bcrypt = require('bcryptjs');

  db.prepare(
    `INSERT INTO parents (id, email, password_hash, name, email_verified) VALUES (?, ?, ?, ?, 1)`,
  ).run(PARENT_ID, 'att-test@hero.com', bcrypt.hashSync('pass', 4), 'Att Parent');

  db.prepare(
    `INSERT INTO children (id, parent_id, name, hero_name, pin_hash, xp, rank, current_streak, best_streak, last_active_date)
     VALUES (?, ?, ?, ?, ?, 0, 'Recruit', 0, 0, NULL)`,
  ).run(CHILD_ID, PARENT_ID, 'Att Child', 'TestHero', bcrypt.hashSync('1234', 4));

  db.prepare(
    `INSERT INTO subjects (id, name, zone_name, colour) VALUES (?, ?, ?, ?)`,
  ).run(SUBJECT_ID, 'Maths ATT', 'Number Zone', '#3b82f6');

  db.prepare(
    `INSERT INTO topics (id, subject_id, name, district_name, colour) VALUES (?, ?, ?, ?, ?)`,
  ).run(TOPIC_ID, SUBJECT_ID, 'Addition ATT', 'Addition Alley', '#22c55e');

  // 3 questions: correct answers 0, 1, 2
  db.prepare(
    `INSERT INTO questions (id, topic_id, text, options, correct_index, explanation, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(Q1, TOPIC_ID, '1+1?', '["2","3","4","5"]', 0, 'ans', 'easy');
  db.prepare(
    `INSERT INTO questions (id, topic_id, text, options, correct_index, explanation, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(Q2, TOPIC_ID, '2+3?', '["4","5","6","7"]', 1, 'ans', 'easy');
  db.prepare(
    `INSERT INTO questions (id, topic_id, text, options, correct_index, explanation, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(Q3, TOPIC_ID, '5+5?', '["8","9","10","11"]', 2, 'ans', 'easy');

  db.prepare(
    `INSERT INTO assessments (id, topic_id, title, difficulty, question_ids, active)
     VALUES (?, ?, ?, ?, ?, 1)`,
  ).run(ASSESSMENT_ID, TOPIC_ID, 'Addition Basics', 'easy', JSON.stringify([Q1, Q2, Q3]));
}

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
  db.exec('DELETE FROM attempts');
  db.exec('DELETE FROM children');
  db.exec('DELETE FROM assessments');
  db.exec('DELETE FROM questions');
  db.exec('DELETE FROM topics');
  db.exec('DELETE FROM subjects');
  db.exec('DELETE FROM parents');
  seedData();
});

// ---------------------------------------------------------------------------
// Authentication & Authorization
// ---------------------------------------------------------------------------

describe('POST /api/v1/attempts — auth', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/api/v1/attempts')
      .send({ assessmentId: ASSESSMENT_ID, answers: [0, 1, 2], durationSeconds: 30 });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 when a parent token is used (requires child role)', async () => {
    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ assessmentId: ASSESSMENT_ID, answers: [0, 1, 2], durationSeconds: 30 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('POST /api/v1/attempts — validation', () => {
  it('returns 400 when assessmentId is missing', async () => {
    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ answers: [0, 1, 2], durationSeconds: 30 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'assessmentId' }),
      ]),
    );
  });

  it('returns 400 when answers is not an array', async () => {
    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ assessmentId: ASSESSMENT_ID, answers: 'not-array', durationSeconds: 30 });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'answers' }),
      ]),
    );
  });

  it('returns 400 when durationSeconds is negative', async () => {
    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ assessmentId: ASSESSMENT_ID, answers: [0], durationSeconds: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'durationSeconds' }),
      ]),
    );
  });

  it('returns 400 when durationSeconds is missing', async () => {
    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ assessmentId: ASSESSMENT_ID, answers: [0] });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'durationSeconds' }),
      ]),
    );
  });

  it('returns 400 with multiple errors when all fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Assessment not found
// ---------------------------------------------------------------------------

describe('POST /api/v1/attempts — assessment lookup', () => {
  it('returns 404 when assessmentId does not match any active assessment', async () => {
    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ assessmentId: 'nonexistent-id', answers: [0, 1, 2], durationSeconds: 30 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 when assessment is inactive', async () => {
    const db = getDb();
    db.prepare('UPDATE assessments SET active = 0 WHERE id = ?').run(ASSESSMENT_ID);

    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({ assessmentId: ASSESSMENT_ID, answers: [0, 1, 2], durationSeconds: 30 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// Scoring — happy path
// ---------------------------------------------------------------------------

describe('POST /api/v1/attempts — scoring', () => {
  it('returns 201 with correct score for all-correct answers', async () => {
    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        assessmentId: ASSESSMENT_ID,
        answers: [0, 1, 2],       // all correct
        durationSeconds: 30,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.score).toBe(3);
    expect(data.maxScore).toBe(3);
    expect(data.stars).toBe(3);         // 100% → 3 stars
    expect(data.xpEarned).toBe(50);     // 3*10 + 20
    expect(data.attemptId).toBeDefined();
    expect(data.currentRank).toBeDefined();
    expect(data.currentStreak).toBeGreaterThanOrEqual(1);
    expect(data.bestStreak).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(data.newAchievements)).toBe(true);
  });

  it('scores partial answers correctly', async () => {
    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        assessmentId: ASSESSMENT_ID,
        answers: [0, 0, 0],       // only Q1 correct (correct_index=0)
        durationSeconds: 60,
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.score).toBe(1);
    expect(data.maxScore).toBe(3);
    expect(data.stars).toBe(1);         // 33% → 1 star
    expect(data.xpEarned).toBe(10);     // 1*10 + 0
  });

  it('scores zero for all-wrong answers', async () => {
    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        assessmentId: ASSESSMENT_ID,
        answers: [3, 3, 3],       // all wrong
        durationSeconds: 60,
      });

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.score).toBe(0);
    expect(data.maxScore).toBe(3);
    expect(data.stars).toBe(1);         // 0% → 1 star
    expect(data.xpEarned).toBe(0);     // 0*10 + 0
  });
});

// ---------------------------------------------------------------------------
// Idempotency — duplicate attemptId
// ---------------------------------------------------------------------------

describe('POST /api/v1/attempts — idempotency', () => {
  it('returns 409 DUPLICATE when the same attemptId is submitted twice', async () => {
    const body = {
      assessmentId: ASSESSMENT_ID,
      answers: [0, 1, 2],
      durationSeconds: 30,
      attemptId: 'unique-attempt-id-1',
    };

    // First submission — success
    const res1 = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send(body);
    expect(res1.status).toBe(201);

    // Second submission — duplicate
    const res2 = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send(body);
    expect(res2.status).toBe(409);
    expect(res2.body.error.code).toBe('DUPLICATE');
  });

  it('uses client-supplied attemptId as the attempt record ID', async () => {
    const myId = 'my-custom-attempt-id';
    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        assessmentId: ASSESSMENT_ID,
        answers: [0, 1, 2],
        durationSeconds: 30,
        attemptId: myId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.attemptId).toBe(myId);
  });

  it('generates a server-side UUID when no attemptId is provided', async () => {
    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        assessmentId: ASSESSMENT_ID,
        answers: [0, 1, 2],
        durationSeconds: 30,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.attemptId).toBeDefined();
    expect(typeof res.body.data.attemptId).toBe('string');
    expect(res.body.data.attemptId.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// newRank can be null when rank doesn't change
// ---------------------------------------------------------------------------

describe('POST /api/v1/attempts — newRank behaviour', () => {
  it('returns newRank=null when rank does not change', async () => {
    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        assessmentId: ASSESSMENT_ID,
        answers: [0, 0, 0],       // 1/3 correct → 10 XP → stays Recruit
        durationSeconds: 90,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.newRank).toBeNull();
    expect(res.body.data.currentRank).toBe('Recruit');
  });

  it('returns newRank with the new rank name when rank changes', async () => {
    // Give child 90 XP so the next attempt pushes them over 100 → Sidekick
    const db = getDb();
    db.prepare('UPDATE children SET xp = 90 WHERE id = ?').run(CHILD_ID);

    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        assessmentId: ASSESSMENT_ID,
        answers: [0, 1, 2],       // 3/3 → 50 XP → total 140 → Sidekick
        durationSeconds: 90,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.newRank).toBe('Sidekick');
    expect(res.body.data.currentRank).toBe('Sidekick');
  });
});

// ---------------------------------------------------------------------------
// Gamification response shape
// ---------------------------------------------------------------------------

describe('POST /api/v1/attempts — response shape', () => {
  it('contains all required fields in data', async () => {
    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        assessmentId: ASSESSMENT_ID,
        answers: [0, 1, 2],
        durationSeconds: 45,
      });

    expect(res.status).toBe(201);
    const data = res.body.data;

    // Verify every expected field is present
    expect(data).toHaveProperty('attemptId');
    expect(data).toHaveProperty('score');
    expect(data).toHaveProperty('maxScore');
    expect(data).toHaveProperty('stars');
    expect(data).toHaveProperty('xpEarned');
    expect(data).toHaveProperty('newTotalXp');
    expect(data).toHaveProperty('newRank');
    expect(data).toHaveProperty('currentRank');
    expect(data).toHaveProperty('currentStreak');
    expect(data).toHaveProperty('bestStreak');
    expect(data).toHaveProperty('newAchievements');

    // Type checks
    expect(typeof data.attemptId).toBe('string');
    expect(typeof data.score).toBe('number');
    expect(typeof data.maxScore).toBe('number');
    expect([1, 2, 3]).toContain(data.stars);
    expect(typeof data.xpEarned).toBe('number');
    expect(typeof data.newTotalXp).toBe('number');
    expect(typeof data.currentRank).toBe('string');
    expect(typeof data.currentStreak).toBe('number');
    expect(typeof data.bestStreak).toBe('number');
    expect(Array.isArray(data.newAchievements)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// XP suppression on repeat 3-star
// ---------------------------------------------------------------------------

describe('POST /api/v1/attempts — XP suppression after 3★', () => {
  it('does not award XP on second 3-star attempt of same assessment', async () => {
    // First attempt: all correct → 3★, earns XP
    const res1 = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        assessmentId: ASSESSMENT_ID,
        answers: [0, 1, 2],
        durationSeconds: 90,
      });
    expect(res1.status).toBe(201);
    expect(res1.body.data.xpEarned).toBe(50);

    // Second attempt: same assessment, all correct → 3★ again
    const res2 = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        assessmentId: ASSESSMENT_ID,
        answers: [0, 1, 2],
        durationSeconds: 90,
      });
    expect(res2.status).toBe(201);
    expect(res2.body.data.xpEarned).toBe(0); // No XP on repeat 3★
  });
});

// ---------------------------------------------------------------------------
// Achievements via route
// ---------------------------------------------------------------------------

describe('POST /api/v1/attempts — achievements', () => {
  it('awards first_mission and speed_demon on fast first attempt', async () => {
    const res = await request(app)
      .post('/api/v1/attempts')
      .set('Authorization', `Bearer ${childToken}`)
      .send({
        assessmentId: ASSESSMENT_ID,
        answers: [0, 1, 2],
        durationSeconds: 30,   // < 60 → speed_demon
      });

    expect(res.status).toBe(201);
    const achs = res.body.data.newAchievements;
    expect(achs).toContain('first_mission');
    expect(achs).toContain('speed_demon');
    expect(achs).toContain('perfect_score');
    expect(achs).toContain('district_conqueror');
  });
});
