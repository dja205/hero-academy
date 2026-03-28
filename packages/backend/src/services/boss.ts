/**
 * ISS-BB-003 / ISS-BB-004 / ISS-BB-005 / ISS-BB-006: Boss Battle Service
 *
 * Core business logic for boss battles: unlock checks, question pool
 * building, answer scoring, victory processing, and achievement awards.
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { config } from '../config';
import {
  calculateXp,
  getRankForXp,
} from '@hero-academy/shared';
import type { RankName } from '@hero-academy/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BossQuestion {
  id: string;
  text: string;
  options: string[];
  correct_index: number;
  difficulty: string;
  topic_id: string;
}

export interface BossVictoryOptions {
  score: number;
  maxScore: number;
  durationSeconds: number;
  livesRemaining: number;
  bossHpFinal: number;
}

export interface BossGamificationResult {
  xpEarned: number;
  newTotalXp: number;
  currentRank: string;
  newRank: RankName | null;
  currentStreak: number;
  bestStreak: number;
  newAchievements: string[];
}

// ---------------------------------------------------------------------------
// ISS-BB-003: getBossForZone
// ---------------------------------------------------------------------------

export function getBossForZone(subjectId: string) {
  const db = getDb();
  return db
    .prepare('SELECT * FROM boss_battles WHERE subject_id = ? AND active = 1')
    .get(subjectId) as Record<string, unknown> | undefined;
}

// ---------------------------------------------------------------------------
// ISS-BB-003: isBossUnlocked
// ---------------------------------------------------------------------------

/**
 * Boss is unlocked when every active topic in the subject has at least
 * one completed attempt by this child (via any assessment in that topic).
 */
export async function isBossUnlocked(childId: string, subjectId: string): Promise<boolean> {
  // Debug mode: boss always unlocked
  if (config.DEBUG_UNLOCK_ALL === 'true') return true;

  const db = getDb();

  // Count active topics in this subject
  const totalTopics = (
    db
      .prepare('SELECT COUNT(*) as cnt FROM topics WHERE subject_id = ? AND active = 1')
      .get(subjectId) as { cnt: number }
  ).cnt;

  if (totalTopics === 0) return false;

  // Count how many of those topics the child has at least one attempt in
  const completedTopics = (
    db
      .prepare(
        `SELECT COUNT(DISTINCT t.id) as cnt
         FROM topics t
         JOIN assessments a ON a.topic_id = t.id AND a.active = 1
         JOIN attempts att ON att.assessment_id = a.id AND att.child_id = ?
         WHERE t.subject_id = ? AND t.active = 1`,
      )
      .get(childId, subjectId) as { cnt: number }
  ).cnt;

  return completedTopics >= totalTopics;
}

// ---------------------------------------------------------------------------
// ISS-BB-004: buildBossQuestionPool
// ---------------------------------------------------------------------------

/**
 * Build a boss question pool with difficulty distribution:
 * 40% hard, 40% medium, 20% easy. Backfills from other buckets if needed.
 * Throws if fewer than 5 total questions are available.
 */
export async function buildBossQuestionPool(subjectId: string, count: number): Promise<BossQuestion[]> {
  const db = getDb();

  // Count total questions available
  const totalAvailable = (
    db
      .prepare(
        `SELECT COUNT(*) as cnt FROM questions q
         JOIN topics t ON q.topic_id = t.id
         WHERE t.subject_id = ? AND q.active = 1`,
      )
      .get(subjectId) as { cnt: number }
  ).cnt;

  if (totalAvailable < 5) {
    throw new Error('Insufficient questions for boss battle');
  }

  const hardCount = Math.round(count * 0.4);   // 8
  const mediumCount = Math.round(count * 0.4);  // 8
  const easyCount = count - hardCount - mediumCount; // 4

  const fetchByDifficulty = (difficulty: string, limit: number): BossQuestion[] => {
    const rows = db
      .prepare(
        `SELECT q.id, q.text, q.options, q.correct_index, q.difficulty, q.topic_id
         FROM questions q
         JOIN topics t ON q.topic_id = t.id
         WHERE t.subject_id = ? AND q.difficulty = ? AND q.active = 1
         ORDER BY q.id
         LIMIT ?`,
      )
      .all(subjectId, difficulty, limit) as Array<{
        id: string;
        text: string;
        options: string;
        correct_index: number;
        difficulty: string;
        topic_id: string;
      }>;

    return rows.map((r) => ({
      ...r,
      options: JSON.parse(r.options),
    }));
  };

  let hardQs = fetchByDifficulty('hard', hardCount);
  let mediumQs = fetchByDifficulty('medium', mediumCount);
  let easyQs = fetchByDifficulty('easy', easyCount);

  // Backfill if a difficulty bucket is short
  const usedIds = new Set([...hardQs, ...mediumQs, ...easyQs].map((q) => q.id));

  const backfill = (needed: number): BossQuestion[] => {
    if (needed <= 0) return [];
    const placeholders = [...usedIds].map(() => '?').join(',');
    const rows = db
      .prepare(
        `SELECT q.id, q.text, q.options, q.correct_index, q.difficulty, q.topic_id
         FROM questions q
         JOIN topics t ON q.topic_id = t.id
         WHERE t.subject_id = ? AND q.active = 1
         ${usedIds.size > 0 ? `AND q.id NOT IN (${placeholders})` : ''}
         ORDER BY q.id
         LIMIT ?`,
      )
      .all(subjectId, ...(usedIds.size > 0 ? [...usedIds] : []), needed) as Array<{
        id: string;
        text: string;
        options: string;
        correct_index: number;
        difficulty: string;
        topic_id: string;
      }>;

    return rows.map((r) => ({
      ...r,
      options: JSON.parse(r.options),
    }));
  };

  const hardDeficit = hardCount - hardQs.length;
  const mediumDeficit = mediumCount - mediumQs.length;
  const easyDeficit = easyCount - easyQs.length;
  const totalDeficit = hardDeficit + mediumDeficit + easyDeficit;

  if (totalDeficit > 0) {
    const extra = backfill(totalDeficit);
    // Distribute backfill proportionally
    let idx = 0;
    if (hardDeficit > 0) {
      hardQs = [...hardQs, ...extra.slice(idx, idx + hardDeficit)];
      idx += hardDeficit;
    }
    if (mediumDeficit > 0) {
      mediumQs = [...mediumQs, ...extra.slice(idx, idx + mediumDeficit)];
      idx += mediumDeficit;
    }
    if (easyDeficit > 0) {
      easyQs = [...easyQs, ...extra.slice(idx, idx + easyDeficit)];
    }
  }

  const pool = [...hardQs, ...mediumQs, ...easyQs];

  // Shuffle the final pool (Fisher-Yates)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}

// ---------------------------------------------------------------------------
// ISS-BB-005: scoreBossAnswer
// ---------------------------------------------------------------------------

/**
 * Score a single boss answer. Returns damage dealt:
 * 0 if wrong, 1 for easy, 2 for medium, 3 for hard.
 */
export async function scoreBossAnswer(questionId: string, answerIndex: number): Promise<number> {
  const db = getDb();
  const q = db
    .prepare('SELECT correct_index, difficulty FROM questions WHERE id = ?')
    .get(questionId) as { correct_index: number; difficulty: string } | undefined;

  if (!q || answerIndex !== q.correct_index) return 0;

  switch (q.difficulty) {
    case 'easy': return 1;
    case 'medium': return 2;
    case 'hard': return 3;
    default: return 1;
  }
}

// ---------------------------------------------------------------------------
// ISS-BB-005: shouldAwardBossXp
// ---------------------------------------------------------------------------

/**
 * Returns false if the child already has a victory for this boss.
 */
export async function shouldAwardBossXp(childId: string, bossId: string): Promise<boolean> {
  const db = getDb();
  const victory = db
    .prepare(
      "SELECT 1 FROM boss_attempts WHERE child_id = ? AND boss_id = ? AND outcome = 'victory' LIMIT 1",
    )
    .get(childId, bossId);
  return !victory;
}

// ---------------------------------------------------------------------------
// ISS-BB-005 / ISS-BB-006: processBossVictory
// ---------------------------------------------------------------------------

/**
 * Process a boss victory: award XP (660 first time, 0 after), evaluate
 * rank, update streak, and award boss-specific achievements.
 */
export async function processBossVictory(
  childId: string,
  bossId: string,
  opts: BossVictoryOptions,
): Promise<BossGamificationResult> {
  const db = getDb();

  // Check if XP should be awarded (first victory only)
  const awardXp = await shouldAwardBossXp(childId, bossId);

  // 660 XP = calculateXp(20, 3) * 3 = (20*10 + 20) * 3 = 220 * 3 = 660
  const xpEarned = awardXp ? calculateXp(20, 3) * 3 : 0;

  // Get current state
  const child = db
    .prepare('SELECT xp, rank, current_streak, best_streak, last_active_date FROM children WHERE id = ?')
    .get(childId) as {
      xp: number;
      rank: string;
      current_streak: number;
      best_streak: number;
      last_active_date: string | null;
    };

  const currentRank = child.rank;

  // Add XP
  let newTotalXp = child.xp;
  if (xpEarned > 0) {
    db.prepare('UPDATE children SET xp = xp + ? WHERE id = ?').run(xpEarned, childId);
    newTotalXp = child.xp + xpEarned;
  }

  // Evaluate rank
  const tier = getRankForXp(newTotalXp);
  let newRank: RankName | null = null;
  if (tier.name !== currentRank) {
    newRank = tier.name;
    db.prepare('UPDATE children SET rank = ? WHERE id = ?').run(tier.name, childId);
  }

  // Update streak
  const today = new Date().toISOString().slice(0, 10);
  let currentStreak = child.current_streak;
  let bestStreak = child.best_streak;

  if (child.last_active_date !== today) {
    if (child.last_active_date) {
      const lastDate = new Date(child.last_active_date + 'T00:00:00Z');
      const todayDate = new Date(today + 'T00:00:00Z');
      const diffDays = Math.round(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      currentStreak = diffDays === 1 ? child.current_streak + 1 : 1;
    } else {
      currentStreak = 1;
    }
    bestStreak = Math.max(currentStreak, child.best_streak);
    db.prepare(
      'UPDATE children SET current_streak = ?, best_streak = ?, last_active_date = ? WHERE id = ?',
    ).run(currentStreak, bestStreak, today, childId);
  }

  // Evaluate boss achievements
  const newAchievements: string[] = [];

  const hasAchievement = (type: string): boolean => {
    return !!db
      .prepare('SELECT 1 FROM child_achievements WHERE child_id = ? AND type = ?')
      .get(childId, type);
  };

  const award = (type: string): boolean => {
    if (hasAchievement(type)) return false;
    db.prepare(
      'INSERT INTO child_achievements (id, child_id, type) VALUES (?, ?, ?)',
    ).run(uuidv4(), childId, type);
    newAchievements.push(type);
    return true;
  };

  // boss_slayer — first boss victory ever
  award('boss_slayer');

  // zone_conquered_mathropolis — if this boss belongs to Mathropolis
  const boss = db
    .prepare(
      `SELECT bb.id, s.zone_name FROM boss_battles bb
       JOIN subjects s ON bb.subject_id = s.id
       WHERE bb.id = ?`,
    )
    .get(bossId) as { id: string; zone_name: string } | undefined;

  if (boss && boss.zone_name === 'Mathropolis') {
    award('zone_conquered_mathropolis');
  }

  return {
    xpEarned,
    newTotalXp,
    currentRank,
    newRank,
    currentStreak,
    bestStreak,
    newAchievements,
  };
}
