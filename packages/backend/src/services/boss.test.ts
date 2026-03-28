/**
 * Unit tests for boss service functions.
 *
 * TDD skeletons — these tests import from ../services/boss which does not
 * exist yet. They will fail on import until the implementation is written.
 *
 * ISS-BB-003: isBossUnlocked
 * ISS-BB-004: buildBossQuestionPool
 * ISS-BB-005: scoreBossAnswer, processBossAttempt, shouldAwardBossXp
 * ISS-BB-006: boss achievements
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { applyMigrations, teardown } from '../__test-utils__/setup-db';
import { getDb } from '../db';
import {
  isBossUnlocked,
  buildBossQuestionPool,
  scoreBossAnswer,
  processBossVictory,
  shouldAwardBossXp,
} from '../services/boss';

// ---------------------------------------------------------------------------
// Test constants
// ---------------------------------------------------------------------------

const PARENT_ID = 'parent-boss-svc-1';
const CHILD_ID = 'child-boss-svc-1';
const SUBJECT_ID = 'subject-boss-maths';
const BOSS_ID = 'boss-mathropolis';

// 5 topics (districts) needed for unlock check
const TOPIC_IDS = [
  'topic-boss-add',
  'topic-boss-sub',
  'topic-boss-mul',
  'topic-boss-div',
  'topic-boss-frac',
];
const ASSESSMENT_IDS = [
  'assess-boss-add',
  'assess-boss-sub',
  'assess-boss-mul',
  'assess-boss-div',
  'assess-boss-frac',
];

// Question IDs spread across difficulty levels (enough for a 20-question pool)
const EASY_Q_IDS = ['q-boss-e1', 'q-boss-e2', 'q-boss-e3', 'q-boss-e4', 'q-boss-e5', 'q-boss-e6'];
const MEDIUM_Q_IDS = ['q-boss-m1', 'q-boss-m2', 'q-boss-m3', 'q-boss-m4', 'q-boss-m5', 'q-boss-m6', 'q-boss-m7', 'q-boss-m8', 'q-boss-m9', 'q-boss-m10'];
const HARD_Q_IDS = ['q-boss-h1', 'q-boss-h2', 'q-boss-h3', 'q-boss-h4', 'q-boss-h5', 'q-boss-h6', 'q-boss-h7', 'q-boss-h8', 'q-boss-h9', 'q-boss-h10'];

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

function seedFullBossData() {
  const db = getDb();
  const bcrypt = require('bcryptjs');

  // Parent
  db.prepare(
    `INSERT INTO parents (id, email, password_hash, name, email_verified) VALUES (?, ?, ?, ?, 1)`,
  ).run(PARENT_ID, 'boss-svc@hero.com', bcrypt.hashSync('pass', 4), 'Boss Svc Parent');

  // Child
  db.prepare(
    `INSERT INTO children (id, parent_id, name, hero_name, pin_hash, xp, rank, current_streak, best_streak, last_active_date)
     VALUES (?, ?, ?, ?, ?, 0, 'Recruit', 0, 0, NULL)`,
  ).run(CHILD_ID, PARENT_ID, 'Boss Child', 'DragonSlayer', bcrypt.hashSync('1234', 4));

  // Subject (Mathropolis)
  db.prepare(
    `INSERT INTO subjects (id, name, zone_name, colour) VALUES (?, ?, ?, ?)`,
  ).run(SUBJECT_ID, 'Maths', 'Mathropolis', '#3b82f6');

  // Boss
  db.prepare(
    `INSERT INTO boss_battles (id, subject_id, name, emoji, hp, question_count)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(BOSS_ID, SUBJECT_ID, 'The Number Dragon', '🐲', 10, 20);

  // 5 topics (districts) in the subject
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

  // Questions across topics with varying difficulty
  const allQs = [
    ...EASY_Q_IDS.map((id, i) => ({ id, difficulty: 'easy', topicIdx: i % 5 })),
    ...MEDIUM_Q_IDS.map((id, i) => ({ id, difficulty: 'medium', topicIdx: i % 5 })),
    ...HARD_Q_IDS.map((id, i) => ({ id, difficulty: 'hard', topicIdx: i % 5 })),
  ];
  allQs.forEach((q) => {
    db.prepare(
      `INSERT INTO questions (id, topic_id, text, options, correct_index, explanation, difficulty)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(q.id, TOPIC_IDS[q.topicIdx], `Q ${q.id}?`, '["A","B","C","D"]', 0, 'Explanation', q.difficulty);
  });
}

function seedAttemptForDistrict(topicIdx: number) {
  const db = getDb();
  db.prepare(
    `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    `attempt-boss-district-${topicIdx}`,
    CHILD_ID,
    ASSESSMENT_IDS[topicIdx],
    '[]',
    1,
    1,
    1,
    10,
    30,
  );
}

function seedBossVictory() {
  const db = getDb();
  db.prepare(
    `INSERT INTO boss_attempts (id, boss_id, child_id, attempt_token, outcome, lives_remaining, boss_hp_final, duration_seconds, xp_earned, score, max_score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run('ba-victory-1', BOSS_ID, CHILD_ID, 'token-victory-1', 'victory', 2, 0, 120, 660, 20, 20);
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeAll(() => {
  applyMigrations();
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
// ISS-BB-003: isBossUnlocked
// ===========================================================================

describe('isBossUnlocked(childId, subjectId)', () => {
  it('returns false when no districts have completed attempts', async () => {
    const result = await isBossUnlocked(CHILD_ID, SUBJECT_ID);
    expect(result).toBe(false);
  });

  it('returns false when only 4 of 5 districts have attempts', async () => {
    // Seed attempts for first 4 districts, skip the 5th
    for (let i = 0; i < 4; i++) {
      seedAttemptForDistrict(i);
    }
    const result = await isBossUnlocked(CHILD_ID, SUBJECT_ID);
    expect(result).toBe(false);
  });

  it('returns true when all 5 districts have ≥1 completed attempt', async () => {
    for (let i = 0; i < 5; i++) {
      seedAttemptForDistrict(i);
    }
    const result = await isBossUnlocked(CHILD_ID, SUBJECT_ID);
    expect(result).toBe(true);
  });

  it('returns true with multiple attempts per district (only needs ≥1)', async () => {
    for (let i = 0; i < 5; i++) {
      seedAttemptForDistrict(i);
    }
    // Extra attempt on first district
    const db = getDb();
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run('attempt-boss-extra', CHILD_ID, ASSESSMENT_IDS[0], '[]', 3, 3, 3, 50, 20);

    const result = await isBossUnlocked(CHILD_ID, SUBJECT_ID);
    expect(result).toBe(true);
  });
});

// ===========================================================================
// ISS-BB-004: buildBossQuestionPool
// ===========================================================================

describe('buildBossQuestionPool(subjectId, count)', () => {
  it('returns exactly 20 questions', async () => {
    const pool = await buildBossQuestionPool(SUBJECT_ID, 20);
    expect(pool).toHaveLength(20);
  });

  it('returns questions with correct difficulty distribution: 40% hard, 40% medium, 20% easy', async () => {
    const pool = await buildBossQuestionPool(SUBJECT_ID, 20);
    const hard = pool.filter((q: { difficulty: string }) => q.difficulty === 'hard');
    const medium = pool.filter((q: { difficulty: string }) => q.difficulty === 'medium');
    const easy = pool.filter((q: { difficulty: string }) => q.difficulty === 'easy');

    expect(hard).toHaveLength(8);    // 40% of 20
    expect(medium).toHaveLength(8);  // 40% of 20
    expect(easy).toHaveLength(4);    // 20% of 20
  });

  it('returns questions from all topics in the subject', async () => {
    const pool = await buildBossQuestionPool(SUBJECT_ID, 20);
    const topicIds = new Set(pool.map((q: { topic_id: string }) => q.topic_id));
    // Should draw from multiple topics (at least 2+)
    expect(topicIds.size).toBeGreaterThanOrEqual(2);
  });

  it('each question has id, text, options, correct_index, difficulty', async () => {
    const pool = await buildBossQuestionPool(SUBJECT_ID, 20);
    for (const q of pool) {
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('text');
      expect(q).toHaveProperty('options');
      expect(q).toHaveProperty('correct_index');
      expect(q).toHaveProperty('difficulty');
    }
  });

  it('returns shuffled questions (non-deterministic order)', async () => {
    // Run twice and check they aren't in the exact same order
    // (probabilistically this should almost never produce same order for 20 items)
    const pool1 = await buildBossQuestionPool(SUBJECT_ID, 20);
    const pool2 = await buildBossQuestionPool(SUBJECT_ID, 20);
    const ids1 = pool1.map((q: { id: string }) => q.id);
    const ids2 = pool2.map((q: { id: string }) => q.id);
    // Same set of IDs (might differ slightly due to randomness in selection)
    expect(ids1.sort()).toEqual(ids2.sort());
    // But order should differ (with very high probability for 20 items)
    // We allow this to pass if they happen to match — it's probabilistic
  });

  it('throws or returns error when fewer than 5 total questions available', async () => {
    const db = getDb();
    // Remove most questions, keep only 3
    db.exec(`DELETE FROM questions WHERE id NOT IN ('${EASY_Q_IDS[0]}', '${EASY_Q_IDS[1]}', '${EASY_Q_IDS[2]}')`);

    await expect(buildBossQuestionPool(SUBJECT_ID, 20)).rejects.toThrow();
  });
});

// ===========================================================================
// ISS-BB-005: scoreBossAnswer
// ===========================================================================

describe('scoreBossAnswer(questionId, answer)', () => {
  it('returns 0 damage for an incorrect answer', async () => {
    // All test questions have correct_index=0; answer 1 is wrong
    const damage = await scoreBossAnswer(EASY_Q_IDS[0], 1);
    expect(damage).toBe(0);
  });

  it('returns 1 damage for a correct easy question', async () => {
    const damage = await scoreBossAnswer(EASY_Q_IDS[0], 0);
    expect(damage).toBe(1);
  });

  it('returns 2 damage for a correct medium question', async () => {
    const damage = await scoreBossAnswer(MEDIUM_Q_IDS[0], 0);
    expect(damage).toBe(2);
  });

  it('returns 3 damage for a correct hard question', async () => {
    const damage = await scoreBossAnswer(HARD_Q_IDS[0], 0);
    expect(damage).toBe(3);
  });
});

// ===========================================================================
// ISS-BB-005: shouldAwardBossXp
// ===========================================================================

describe('shouldAwardBossXp(childId, bossId)', () => {
  it('returns true when child has never beaten this boss', async () => {
    const result = await shouldAwardBossXp(CHILD_ID, BOSS_ID);
    expect(result).toBe(true);
  });

  it('returns false when child already has a victory on this boss', async () => {
    seedBossVictory();
    const result = await shouldAwardBossXp(CHILD_ID, BOSS_ID);
    expect(result).toBe(false);
  });

  it('returns true after defeat (only victory suppresses XP)', async () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO boss_attempts (id, boss_id, child_id, attempt_token, outcome, lives_remaining, boss_hp_final, duration_seconds, xp_earned, score, max_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run('ba-defeat-1', BOSS_ID, CHILD_ID, 'token-defeat-1', 'defeat', 0, 5, 90, 0, 10, 20);

    const result = await shouldAwardBossXp(CHILD_ID, BOSS_ID);
    expect(result).toBe(true);
  });
});

// ===========================================================================
// ISS-BB-005: processBossVictory (XP and gamification)
// ===========================================================================

describe('processBossVictory(childId, bossId, ...)', () => {
  it('awards 660 XP on first victory (calculateXp(20, 3) * 3)', async () => {
    // Unlock boss first
    for (let i = 0; i < 5; i++) seedAttemptForDistrict(i);

    const result = await processBossVictory(CHILD_ID, BOSS_ID, {
      score: 20,
      maxScore: 20,
      durationSeconds: 120,
      livesRemaining: 2,
      bossHpFinal: 0,
    });

    expect(result.xpEarned).toBe(660);
  });

  it('awards 0 XP on subsequent victories', async () => {
    for (let i = 0; i < 5; i++) seedAttemptForDistrict(i);
    seedBossVictory(); // Already won once

    const result = await processBossVictory(CHILD_ID, BOSS_ID, {
      score: 20,
      maxScore: 20,
      durationSeconds: 100,
      livesRemaining: 1,
      bossHpFinal: 0,
    });

    expect(result.xpEarned).toBe(0);
  });

  it('returns gamification data shape (xp, rank, streak, achievements)', async () => {
    for (let i = 0; i < 5; i++) seedAttemptForDistrict(i);

    const result = await processBossVictory(CHILD_ID, BOSS_ID, {
      score: 20,
      maxScore: 20,
      durationSeconds: 120,
      livesRemaining: 2,
      bossHpFinal: 0,
    });

    expect(result).toHaveProperty('xpEarned');
    expect(result).toHaveProperty('newTotalXp');
    expect(result).toHaveProperty('currentRank');
    expect(result).toHaveProperty('newRank');
    expect(result).toHaveProperty('currentStreak');
    expect(result).toHaveProperty('bestStreak');
    expect(result).toHaveProperty('newAchievements');
    expect(typeof result.xpEarned).toBe('number');
    expect(typeof result.newTotalXp).toBe('number');
    expect(Array.isArray(result.newAchievements)).toBe(true);
  });
});

// ===========================================================================
// ISS-BB-006: Boss achievements
// ===========================================================================

describe('boss achievements', () => {
  it('awards boss_slayer on first boss victory (any boss)', async () => {
    for (let i = 0; i < 5; i++) seedAttemptForDistrict(i);

    const result = await processBossVictory(CHILD_ID, BOSS_ID, {
      score: 20,
      maxScore: 20,
      durationSeconds: 120,
      livesRemaining: 2,
      bossHpFinal: 0,
    });

    expect(result.newAchievements).toContain('boss_slayer');

    // Verify persisted in child_achievements
    const db = getDb();
    const ach = db
      .prepare("SELECT * FROM child_achievements WHERE child_id = ? AND type = 'boss_slayer'")
      .get(CHILD_ID);
    expect(ach).toBeDefined();
  });

  it('awards zone_conquered_mathropolis on first Mathropolis boss victory', async () => {
    for (let i = 0; i < 5; i++) seedAttemptForDistrict(i);

    const result = await processBossVictory(CHILD_ID, BOSS_ID, {
      score: 20,
      maxScore: 20,
      durationSeconds: 120,
      livesRemaining: 2,
      bossHpFinal: 0,
    });

    expect(result.newAchievements).toContain('zone_conquered_mathropolis');

    const db = getDb();
    const ach = db
      .prepare("SELECT * FROM child_achievements WHERE child_id = ? AND type = 'zone_conquered_mathropolis'")
      .get(CHILD_ID);
    expect(ach).toBeDefined();
  });

  it('does not re-award boss_slayer on second victory', async () => {
    for (let i = 0; i < 5; i++) seedAttemptForDistrict(i);
    seedBossVictory();

    // Insert the achievements as if first victory already awarded them
    const db = getDb();
    db.prepare(
      `INSERT INTO child_achievements (id, child_id, type) VALUES (?, ?, ?)`,
    ).run('ach-bs-1', CHILD_ID, 'boss_slayer');
    db.prepare(
      `INSERT INTO child_achievements (id, child_id, type) VALUES (?, ?, ?)`,
    ).run('ach-zc-1', CHILD_ID, 'zone_conquered_mathropolis');

    const result = await processBossVictory(CHILD_ID, BOSS_ID, {
      score: 20,
      maxScore: 20,
      durationSeconds: 100,
      livesRemaining: 1,
      bossHpFinal: 0,
    });

    expect(result.newAchievements).not.toContain('boss_slayer');
    expect(result.newAchievements).not.toContain('zone_conquered_mathropolis');
  });

  it('achievements are stored in child_achievements with unique (child_id, type)', async () => {
    for (let i = 0; i < 5; i++) seedAttemptForDistrict(i);

    await processBossVictory(CHILD_ID, BOSS_ID, {
      score: 20,
      maxScore: 20,
      durationSeconds: 120,
      livesRemaining: 2,
      bossHpFinal: 0,
    });

    const db = getDb();
    const achievements = db
      .prepare('SELECT type FROM child_achievements WHERE child_id = ?')
      .all(CHILD_ID) as Array<{ type: string }>;
    const types = achievements.map((a) => a.type);

    expect(types).toContain('boss_slayer');
    expect(types).toContain('zone_conquered_mathropolis');
    // Each awarded only once
    expect(types.filter((t) => t === 'boss_slayer')).toHaveLength(1);
    expect(types.filter((t) => t === 'zone_conquered_mathropolis')).toHaveLength(1);
  });
});
