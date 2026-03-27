/**
 * Gamification service integration tests.
 *
 * Tests DB-dependent functions: shouldAwardXp, addXp, evaluateRank,
 * updateStreak, evaluateAchievements, and the orchestrator processAttemptGamification.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  applyMigrations,
  seedTestData,
  teardown,
} from '../__test-utils__/setup-db';
import { getDb } from '../db';
import {
  shouldAwardXp,
  addXp,
  evaluateRank,
  updateStreak,
  evaluateAchievements,
  processAttemptGamification,
} from './gamification';

let seed: ReturnType<typeof seedTestData>;

beforeAll(() => {
  applyMigrations();
});

afterAll(() => {
  teardown();
});

beforeEach(() => {
  // Wipe test-dependent tables and re-seed
  const db = getDb();
  db.exec('DELETE FROM child_achievements');
  db.exec('DELETE FROM attempts');
  db.exec('DELETE FROM children');
  db.exec('DELETE FROM assessments');
  db.exec('DELETE FROM questions');
  db.exec('DELETE FROM topics');
  db.exec('DELETE FROM subjects');
  db.exec('DELETE FROM parents');
  seed = seedTestData();
});

// ---------------------------------------------------------------------------
// shouldAwardXp
// ---------------------------------------------------------------------------

describe('shouldAwardXp', () => {
  it('returns true when no prior attempts exist', () => {
    expect(shouldAwardXp(seed.childId, seed.assessmentId)).toBe(true);
  });

  it('returns true when best prior attempt is less than 3 stars', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, '[]', 2, 3, 2, 25, 30)`,
    ).run('att-prior', seed.childId, seed.assessmentId);

    expect(shouldAwardXp(seed.childId, seed.assessmentId)).toBe(true);
  });

  it('returns false when best prior attempt already has 3 stars', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, '[]', 3, 3, 3, 50, 30)`,
    ).run('att-perfect', seed.childId, seed.assessmentId);

    expect(shouldAwardXp(seed.childId, seed.assessmentId)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// addXp
// ---------------------------------------------------------------------------

describe('addXp', () => {
  it('increments child XP and returns the new total', () => {
    const newTotal = addXp(seed.childId, 50);
    expect(newTotal).toBe(50);

    const newTotal2 = addXp(seed.childId, 30);
    expect(newTotal2).toBe(80);
  });

  it('handles zero XP addition', () => {
    const newTotal = addXp(seed.childId, 0);
    expect(newTotal).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// evaluateRank
// ---------------------------------------------------------------------------

describe('evaluateRank', () => {
  it('returns Recruit with changed=false when XP is low', () => {
    const result = evaluateRank(seed.childId, 50);
    expect(result.newRank).toBe('Recruit');
    expect(result.changed).toBe(false);
  });

  it('promotes to Sidekick and returns changed=true', () => {
    const result = evaluateRank(seed.childId, 100);
    expect(result.newRank).toBe('Sidekick');
    expect(result.changed).toBe(true);

    // Verify DB was updated
    const row = getDb()
      .prepare('SELECT rank FROM children WHERE id = ?')
      .get(seed.childId) as { rank: string };
    expect(row.rank).toBe('Sidekick');
  });

  it('promotes to Hero at 500 XP', () => {
    const result = evaluateRank(seed.childId, 500);
    expect(result.newRank).toBe('Hero');
    expect(result.changed).toBe(true);
  });

  it('promotes to Superhero at 1500 XP', () => {
    const result = evaluateRank(seed.childId, 1500);
    expect(result.newRank).toBe('Superhero');
    expect(result.changed).toBe(true);
  });

  it('returns changed=false when rank stays the same', () => {
    // Set to Sidekick first
    getDb()
      .prepare('UPDATE children SET rank = ? WHERE id = ?')
      .run('Sidekick', seed.childId);

    const result = evaluateRank(seed.childId, 200);
    expect(result.newRank).toBe('Sidekick');
    expect(result.changed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateStreak
// ---------------------------------------------------------------------------

describe('updateStreak', () => {
  it('starts a streak of 1 on first activity', () => {
    const result = updateStreak(seed.childId);
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(1);
  });

  it('returns same streak when called twice on the same day', () => {
    updateStreak(seed.childId);
    const result = updateStreak(seed.childId);
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(1);
  });

  it('increments streak when last active was yesterday', () => {
    const db = getDb();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    db.prepare(
      'UPDATE children SET current_streak = 3, best_streak = 5, last_active_date = ? WHERE id = ?',
    ).run(yesterdayStr, seed.childId);

    const result = updateStreak(seed.childId);
    expect(result.currentStreak).toBe(4);
    expect(result.bestStreak).toBe(5);
  });

  it('resets streak to 1 when gap is more than 1 day', () => {
    const db = getDb();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    db.prepare(
      'UPDATE children SET current_streak = 5, best_streak = 5, last_active_date = ? WHERE id = ?',
    ).run(threeDaysAgo.toISOString().slice(0, 10), seed.childId);

    const result = updateStreak(seed.childId);
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(5);
  });

  it('updates best_streak when current exceeds previous best', () => {
    const db = getDb();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    db.prepare(
      'UPDATE children SET current_streak = 5, best_streak = 5, last_active_date = ? WHERE id = ?',
    ).run(yesterday.toISOString().slice(0, 10), seed.childId);

    const result = updateStreak(seed.childId);
    expect(result.currentStreak).toBe(6);
    expect(result.bestStreak).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// evaluateAchievements
// ---------------------------------------------------------------------------

describe('evaluateAchievements', () => {
  it('awards first_mission on first attempt', () => {
    const db = getDb();
    // Insert exactly 1 attempt (the one that just happened)
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, '[]', 2, 3, 2, 25, 90)`,
    ).run('att-1', seed.childId, seed.assessmentId);

    const achievements = evaluateAchievements(seed.childId, {
      assessmentId: seed.assessmentId,
      stars: 2,
      durationSeconds: 90,
      totalXp: 25,
      rankChanged: false,
      newRank: 'Recruit',
      currentStreak: 1,
    });

    expect(achievements).toContain('first_mission');
  });

  it('does NOT award first_mission on second attempt', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, '[]', 2, 3, 2, 25, 90)`,
    ).run('att-1', seed.childId, seed.assessmentId);
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, '[]', 2, 3, 2, 25, 90)`,
    ).run('att-2', seed.childId, seed.assessmentId);

    const achievements = evaluateAchievements(seed.childId, {
      assessmentId: seed.assessmentId,
      stars: 2,
      durationSeconds: 90,
      totalXp: 50,
      rankChanged: false,
      newRank: 'Recruit',
      currentStreak: 1,
    });

    expect(achievements).not.toContain('first_mission');
  });

  it('awards perfect_score on 3-star attempt', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, '[]', 3, 3, 3, 50, 90)`,
    ).run('att-perf', seed.childId, seed.assessmentId);

    const achievements = evaluateAchievements(seed.childId, {
      assessmentId: seed.assessmentId,
      stars: 3,
      durationSeconds: 90,
      totalXp: 50,
      rankChanged: false,
      newRank: 'Recruit',
      currentStreak: 1,
    });

    expect(achievements).toContain('perfect_score');
  });

  it('does NOT award perfect_score for 2 stars', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, '[]', 2, 3, 2, 25, 90)`,
    ).run('att-ok', seed.childId, seed.assessmentId);

    const achievements = evaluateAchievements(seed.childId, {
      assessmentId: seed.assessmentId,
      stars: 2,
      durationSeconds: 90,
      totalXp: 25,
      rankChanged: false,
      newRank: 'Recruit',
      currentStreak: 1,
    });

    expect(achievements).not.toContain('perfect_score');
  });

  it('awards speed_demon when duration < 60s', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, '[]', 2, 3, 2, 25, 45)`,
    ).run('att-fast', seed.childId, seed.assessmentId);

    const achievements = evaluateAchievements(seed.childId, {
      assessmentId: seed.assessmentId,
      stars: 2,
      durationSeconds: 45,
      totalXp: 25,
      rankChanged: false,
      newRank: 'Recruit',
      currentStreak: 1,
    });

    expect(achievements).toContain('speed_demon');
  });

  it('does NOT award speed_demon when duration >= 60s', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, '[]', 2, 3, 2, 25, 60)`,
    ).run('att-slow', seed.childId, seed.assessmentId);

    const achievements = evaluateAchievements(seed.childId, {
      assessmentId: seed.assessmentId,
      stars: 2,
      durationSeconds: 60,
      totalXp: 25,
      rankChanged: false,
      newRank: 'Recruit',
      currentStreak: 1,
    });

    expect(achievements).not.toContain('speed_demon');
  });

  it('awards rank_up when promoted to Sidekick', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, '[]', 3, 3, 3, 50, 90)`,
    ).run('att-rank', seed.childId, seed.assessmentId);

    const achievements = evaluateAchievements(seed.childId, {
      assessmentId: seed.assessmentId,
      stars: 3,
      durationSeconds: 90,
      totalXp: 100,
      rankChanged: true,
      newRank: 'Sidekick',
      currentStreak: 1,
    });

    expect(achievements).toContain('rank_up');
  });

  it('does NOT award rank_up when promoted to Hero', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, '[]', 3, 3, 3, 50, 90)`,
    ).run('att-hero', seed.childId, seed.assessmentId);

    const achievements = evaluateAchievements(seed.childId, {
      assessmentId: seed.assessmentId,
      stars: 3,
      durationSeconds: 90,
      totalXp: 500,
      rankChanged: true,
      newRank: 'Hero',
      currentStreak: 1,
    });

    expect(achievements).not.toContain('rank_up');
  });

  it('awards district_conqueror when all assessments in topic have ≥2★', () => {
    const db = getDb();
    // Only 1 active assessment in our seeded topic, so achieving ≥2★ should trigger it
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, '[]', 2, 3, 2, 25, 90)`,
    ).run('att-conq', seed.childId, seed.assessmentId);

    const achievements = evaluateAchievements(seed.childId, {
      assessmentId: seed.assessmentId,
      stars: 2,
      durationSeconds: 90,
      totalXp: 25,
      rankChanged: false,
      newRank: 'Recruit',
      currentStreak: 1,
    });

    expect(achievements).toContain('district_conqueror');
  });

  it('does NOT re-award an achievement already earned', () => {
    const db = getDb();
    // Manually insert achievement
    db.prepare(
      `INSERT INTO child_achievements (id, child_id, type) VALUES (?, ?, ?)`,
    ).run('ach-1', seed.childId, 'speed_demon');

    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, '[]', 2, 3, 2, 25, 30)`,
    ).run('att-re', seed.childId, seed.assessmentId);

    const achievements = evaluateAchievements(seed.childId, {
      assessmentId: seed.assessmentId,
      stars: 2,
      durationSeconds: 30,
      totalXp: 25,
      rankChanged: false,
      newRank: 'Recruit',
      currentStreak: 1,
    });

    expect(achievements).not.toContain('speed_demon');
  });
});

// ---------------------------------------------------------------------------
// processAttemptGamification (orchestrator)
// ---------------------------------------------------------------------------

describe('processAttemptGamification', () => {
  it('calculates stars, XP, streak, and achievements for a perfect first attempt', () => {
    // Insert the attempt first (as the route handler does before calling the orchestrator)
    const db = getDb();
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, ?, 3, 3, 3, 0, 45)`,
    ).run('att-orch', seed.childId, seed.assessmentId, JSON.stringify([0, 1, 2]));

    const result = processAttemptGamification(
      seed.childId,
      seed.assessmentId,
      3,  // score
      3,  // maxScore
      45, // durationSeconds
      true, // preEvaluatedEarnXp
    );

    expect(result.score).toBe(3);
    expect(result.maxScore).toBe(3);
    expect(result.stars).toBe(3);
    expect(result.xpEarned).toBe(50); // 3*10 + 20 (3-star bonus)
    expect(result.newTotalXp).toBe(50);
    expect(result.currentStreak).toBeGreaterThanOrEqual(1);
    expect(result.newAchievements).toContain('first_mission');
    expect(result.newAchievements).toContain('perfect_score');
    expect(result.newAchievements).toContain('speed_demon');
  });

  it('returns newRank=null when rank does not change', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, ?, 1, 3, 1, 0, 90)`,
    ).run('att-norank', seed.childId, seed.assessmentId, JSON.stringify([0, 0, 0]));

    const result = processAttemptGamification(
      seed.childId,
      seed.assessmentId,
      1,   // score — low
      3,   // maxScore
      90,
      true,
    );

    // 1/3 = 33% → 1 star → XP = 1*10 + 0 = 10
    expect(result.stars).toBe(1);
    expect(result.xpEarned).toBe(10);
    expect(result.newRank).toBeNull(); // stays Recruit
  });

  it('awards no XP when preEvaluatedEarnXp is false', () => {
    const db = getDb();
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, ?, 3, 3, 3, 0, 90)`,
    ).run('att-noxp', seed.childId, seed.assessmentId, JSON.stringify([0, 1, 2]));

    const result = processAttemptGamification(
      seed.childId,
      seed.assessmentId,
      3,
      3,
      90,
      false, // already got 3 stars before
    );

    expect(result.xpEarned).toBe(0);
    expect(result.newTotalXp).toBe(0);
    expect(result.newRank).toBeNull();
  });

  it('promotes rank from Recruit to Sidekick at ≥100 XP', () => {
    const db = getDb();
    // Give child 80 XP already
    db.prepare('UPDATE children SET xp = 80 WHERE id = ?').run(seed.childId);

    // This attempt earns 3*10 + 20 = 50 XP → total = 130 → Sidekick
    db.prepare(
      `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
       VALUES (?, ?, ?, ?, 3, 3, 3, 0, 90)`,
    ).run('att-promo', seed.childId, seed.assessmentId, JSON.stringify([0, 1, 2]));

    const result = processAttemptGamification(
      seed.childId,
      seed.assessmentId,
      3,
      3,
      90,
      true,
    );

    expect(result.xpEarned).toBe(50);
    expect(result.newTotalXp).toBe(130);
    expect(result.newRank).toBe('Sidekick');
    expect(result.newAchievements).toContain('rank_up');
  });
});
