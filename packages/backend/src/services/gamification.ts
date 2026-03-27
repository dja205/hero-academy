/**
 * ISS-022 / ISS-024–027: Gamification service
 *
 * Handles XP accumulation, rank evaluation, streak tracking, and
 * achievement evaluation after each attempt submission.
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import {
  getRankForXp,
  calculateStars,
  calculateXp,
} from '@hero-academy/shared';
import type { RankName } from '@hero-academy/shared';

export { calculateStars, calculateXp };

// ---------------------------------------------------------------------------
// ISS-024: XP Accumulation
// ---------------------------------------------------------------------------

/**
 * Determines whether XP should be awarded for this attempt.
 * XP is only earned if the child has NOT already achieved 3★ on this
 * assessment.
 */
export function shouldAwardXp(childId: string, assessmentId: string): boolean {
  const db = getDb();
  const best = db
    .prepare(
      'SELECT MAX(stars) as best FROM attempts WHERE child_id = ? AND assessment_id = ?',
    )
    .get(childId, assessmentId) as { best: number | null } | undefined;

  return !best || best.best === null || best.best < 3;
}

export function addXp(childId: string, xpEarned: number): number {
  const db = getDb();
  db.prepare('UPDATE children SET xp = xp + ? WHERE id = ?').run(
    xpEarned,
    childId,
  );
  const row = db
    .prepare('SELECT xp FROM children WHERE id = ?')
    .get(childId) as { xp: number };
  return row.xp;
}

// ---------------------------------------------------------------------------
// ISS-025: Rank Tier Evaluation
// ---------------------------------------------------------------------------

export function evaluateRank(
  childId: string,
  totalXp: number,
): { newRank: RankName; changed: boolean } {
  const db = getDb();
  const child = db
    .prepare('SELECT rank FROM children WHERE id = ?')
    .get(childId) as { rank: string };
  const tier = getRankForXp(totalXp);
  const changed = child.rank !== tier.name;
  if (changed) {
    db.prepare('UPDATE children SET rank = ? WHERE id = ?').run(
      tier.name,
      childId,
    );
  }
  return { newRank: tier.name, changed };
}

// ---------------------------------------------------------------------------
// ISS-026: Streak Tracking
// ---------------------------------------------------------------------------

export function updateStreak(
  childId: string,
): { currentStreak: number; bestStreak: number } {
  const db = getDb();
  const child = db
    .prepare(
      'SELECT current_streak, best_streak, last_active_date FROM children WHERE id = ?',
    )
    .get(childId) as {
    current_streak: number;
    best_streak: number;
    last_active_date: string | null;
  };

  const today = new Date().toISOString().slice(0, 10);

  if (child.last_active_date === today) {
    return {
      currentStreak: child.current_streak,
      bestStreak: child.best_streak,
    };
  }

  let newStreak: number;
  if (child.last_active_date) {
    const lastDate = new Date(child.last_active_date + 'T00:00:00Z');
    const todayDate = new Date(today + 'T00:00:00Z');
    const diffDays = Math.round(
      (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    newStreak = diffDays === 1 ? child.current_streak + 1 : 1;
  } else {
    newStreak = 1;
  }

  const newBest = Math.max(newStreak, child.best_streak);

  db.prepare(
    'UPDATE children SET current_streak = ?, best_streak = ?, last_active_date = ? WHERE id = ?',
  ).run(newStreak, newBest, today, childId);

  return { currentStreak: newStreak, bestStreak: newBest };
}

// ---------------------------------------------------------------------------
// ISS-027: Achievement Evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate all known achievement conditions.  Only newly awarded
 * achievements are returned.
 */
export function evaluateAchievements(
  childId: string,
  context: {
    assessmentId: string;
    stars: number;
    durationSeconds: number;
    totalXp: number;
    rankChanged: boolean;
    newRank: string;
    currentStreak: number;
  },
): string[] {
  const db = getDb();
  const newAchievements: string[] = [];

  const hasAchievement = (type: string): boolean => {
    return !!db
      .prepare(
        'SELECT 1 FROM child_achievements WHERE child_id = ? AND type = ?',
      )
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

  // first_mission — first completed attempt
  const attemptCount = (
    db
      .prepare('SELECT COUNT(*) as cnt FROM attempts WHERE child_id = ?')
      .get(childId) as { cnt: number }
  ).cnt;
  if (attemptCount === 1) {
    award('first_mission');
  }

  // perfect_score — 3★ on any assessment
  if (context.stars === 3) {
    award('perfect_score');
  }

  // speed_demon — complete in under 60 seconds
  if (context.durationSeconds < 60) {
    award('speed_demon');
  }

  // rank_up — reach Sidekick rank
  if (context.rankChanged && context.newRank === 'Sidekick') {
    award('rank_up');
  }

  // district_conqueror — all active assessments in a topic scored ≥2★
  const assessment = db
    .prepare('SELECT topic_id FROM assessments WHERE id = ?')
    .get(context.assessmentId) as { topic_id: string } | undefined;

  if (assessment) {
    const topicId = assessment.topic_id;
    const totalActive = (
      db
        .prepare(
          'SELECT COUNT(*) as cnt FROM assessments WHERE topic_id = ? AND active = 1',
        )
        .get(topicId) as { cnt: number }
    ).cnt;

    if (totalActive > 0) {
      const completedWith2Stars = (
        db
          .prepare(
            `SELECT COUNT(DISTINCT att.assessment_id) as cnt
             FROM attempts att
             JOIN assessments a ON att.assessment_id = a.id
             WHERE att.child_id = ?
               AND a.topic_id = ?
               AND a.active = 1
               AND att.stars >= 2`,
          )
          .get(childId, topicId) as { cnt: number }
      ).cnt;

      if (completedWith2Stars >= totalActive) {
        award('district_conqueror');
      }
    }
  }

  return newAchievements;
}

// ---------------------------------------------------------------------------
// Orchestrator — runs all gamification steps inside a transaction
// ---------------------------------------------------------------------------

export interface GamificationResult {
  score: number;
  maxScore: number;
  stars: 1 | 2 | 3;
  xpEarned: number;
  newTotalXp: number;
  newRank: RankName | null;
  currentStreak: number;
  bestStreak: number;
  newAchievements: string[];
}

export function processAttemptGamification(
  childId: string,
  assessmentId: string,
  score: number,
  maxScore: number,
  durationSeconds: number,
  preEvaluatedEarnXp?: boolean,
): GamificationResult {
  const stars = calculateStars(score, maxScore);

  const earnXp = preEvaluatedEarnXp !== undefined ? preEvaluatedEarnXp : shouldAwardXp(childId, assessmentId);
  const xpEarned = earnXp ? calculateXp(score, stars) : 0;

  let newTotalXp = 0;
  let newRank: RankName | null = null;
  let rankChanged = false;

  if (xpEarned > 0) {
    newTotalXp = addXp(childId, xpEarned);
    const rankResult = evaluateRank(childId, newTotalXp);
    rankChanged = rankResult.changed;
    if (rankChanged) newRank = rankResult.newRank;
    if (!rankChanged) newTotalXp = newTotalXp; // keep for response
  } else {
    const child = getDb()
      .prepare('SELECT xp FROM children WHERE id = ?')
      .get(childId) as { xp: number };
    newTotalXp = child.xp;
  }

  const streakResult = updateStreak(childId);

  const newAchievements = evaluateAchievements(childId, {
    assessmentId,
    stars,
    durationSeconds,
    totalXp: newTotalXp,
    rankChanged,
    newRank: rankChanged
      ? newRank!
      : (getDb()
          .prepare('SELECT rank FROM children WHERE id = ?')
          .get(childId) as { rank: string }
        ).rank,
    currentStreak: streakResult.currentStreak,
  });

  return {
    score,
    maxScore,
    stars,
    xpEarned,
    newTotalXp,
    newRank: rankChanged ? newRank : null,
    currentStreak: streakResult.currentStreak,
    bestStreak: streakResult.bestStreak,
    newAchievements,
  };
}
