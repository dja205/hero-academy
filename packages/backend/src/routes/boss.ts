/**
 * ISS-BB-003 / ISS-BB-004 / ISS-BB-005: Boss Battle Routes
 *
 * Three endpoints for boss battles:
 *   GET  /api/v1/boss/:subjectId/status     — boss status & unlock check
 *   GET  /api/v1/boss/:subjectId/questions   — fetch question pool
 *   POST /api/v1/boss/:subjectId/attempt     — submit boss attempt
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '@hero-academy/shared';
import { authenticateToken, requireRole } from '../middleware/auth';
import { getDb } from '../db';
import {
  getBossForZone,
  isBossUnlocked,
  buildBossQuestionPool,
  processBossVictory,
} from '../services/boss';
import type { BossQuestion } from '../services/boss';

const router = Router();
router.use(authenticateToken, requireRole(Role.Child));

// In-memory cache: attemptToken → question IDs (in order served)
// Entries expire after 1 hour.
const questionPoolCache = new Map<string, { questionIds: string[]; createdAt: number }>();

function cleanPoolCache() {
  const oneHour = 60 * 60 * 1000;
  const now = Date.now();
  for (const [key, val] of questionPoolCache) {
    if (now - val.createdAt > oneHour) {
      questionPoolCache.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/boss/:subjectId/status
// ---------------------------------------------------------------------------

router.get('/:subjectId/status', async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params;
    const childId = req.user!.sub;
    const db = getDb();

    // Check subject exists
    const subject = db
      .prepare('SELECT id FROM subjects WHERE id = ?')
      .get(subjectId);

    if (!subject) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Subject not found' },
      });
      return;
    }

    const boss = getBossForZone(subjectId);
    if (!boss) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No boss found for this zone' },
      });
      return;
    }

    const unlocked = await isBossUnlocked(childId, subjectId);

    // Last attempt
    const lastAttemptRow = db
      .prepare(
        `SELECT outcome, created_at as completedAt
         FROM boss_attempts
         WHERE child_id = ? AND boss_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
      )
      .get(childId, boss.id as string) as { outcome: string; completedAt: string } | undefined;

    // Already conquered?
    const conquered = db
      .prepare(
        "SELECT 1 FROM boss_attempts WHERE child_id = ? AND boss_id = ? AND outcome = 'victory' LIMIT 1",
      )
      .get(childId, boss.id as string);

    res.json({
      success: true,
      data: {
        boss: {
          id: boss.id,
          name: boss.name,
          emoji: boss.emoji,
          hp: boss.hp,
          description: boss.description,
          questionCount: boss.question_count,
        },
        unlocked,
        lastAttempt: lastAttemptRow
          ? { outcome: lastAttemptRow.outcome, completedAt: lastAttemptRow.completedAt }
          : null,
        alreadyConquered: !!conquered,
      },
    });
  } catch (err) {
    console.error('Boss status error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/v1/boss/:subjectId/questions
// ---------------------------------------------------------------------------

router.get('/:subjectId/questions', async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params;
    const childId = req.user!.sub;

    const boss = getBossForZone(subjectId);
    if (!boss) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No boss found for this zone' },
      });
      return;
    }

    const unlocked = await isBossUnlocked(childId, subjectId);
    if (!unlocked) {
      res.status(403).json({
        success: false,
        error: { code: 'BOSS_LOCKED', message: 'Complete all districts to unlock the boss' },
      });
      return;
    }

    let questions: BossQuestion[];
    try {
      questions = await buildBossQuestionPool(subjectId, (boss.question_count as number) || 20);
    } catch {
      res.status(400).json({
        success: false,
        error: { code: 'INSUFFICIENT_QUESTIONS', message: 'Not enough questions for boss battle' },
      });
      return;
    }

    const attemptToken = uuidv4();

    // Cache question IDs for server-side re-scoring on attempt submission
    cleanPoolCache();
    questionPoolCache.set(attemptToken, {
      questionIds: questions.map((q) => q.id),
      createdAt: Date.now(),
    });

    res.json({
      success: true,
      data: {
        attemptToken,
        bossId: boss.id,
        questions: questions.map((q) => ({
          id: q.id,
          text: q.text,
          options: q.options,
          difficulty: q.difficulty,
          correct_index: q.correct_index,
        })),
      },
    });
  } catch (err) {
    console.error('Boss questions error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

// ---------------------------------------------------------------------------
// POST /api/v1/boss/:subjectId/attempt
// ---------------------------------------------------------------------------

router.post('/:subjectId/attempt', async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params;
    const childId = req.user!.sub;
    const {
      attemptToken,
      bossId,
      answers,
      durationSeconds,
    } = req.body ?? {};

    const db = getDb();

    // Validate
    if (!attemptToken || !bossId || !Array.isArray(answers)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
      });
      return;
    }

    // Duplicate check
    const dup = db
      .prepare('SELECT id FROM boss_attempts WHERE attempt_token = ?')
      .get(attemptToken);
    if (dup) {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE', message: 'Attempt already submitted' },
      });
      return;
    }

    // Fetch boss
    const boss = getBossForZone(subjectId);
    if (!boss) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Boss not found' },
      });
      return;
    }

    // Retrieve the cached question IDs for this attempt
    const cached = questionPoolCache.get(attemptToken);
    if (!cached) {
      res.status(400).json({
        success: false,
        error: { code: 'EXPIRED_TOKEN', message: 'Attempt token expired or invalid' },
      });
      return;
    }

    const questionIds = cached.questionIds;
    questionPoolCache.delete(attemptToken);

    // Fetch question data for re-scoring
    const questionsData = questionIds.map((qid) => {
      return db
        .prepare('SELECT id, correct_index, difficulty FROM questions WHERE id = ?')
        .get(qid) as { id: string; correct_index: number; difficulty: string } | undefined;
    });

    // Server re-scoring: score ALL answers, compute total damage and wrong count
    let totalDamage = 0;
    let wrongCount = 0;
    let score = 0;
    const maxScore = Math.min(answers.length, questionIds.length);

    for (let i = 0; i < maxScore; i++) {
      const q = questionsData[i];
      if (!q) continue;

      if (answers[i] === q.correct_index) {
        score++;
        const damage = q.difficulty === 'hard' ? 3 : q.difficulty === 'medium' ? 2 : 1;
        totalDamage += damage;
      } else {
        wrongCount++;
      }
    }

    // Server determines outcome based on totals
    const bossHpFinal = Math.max(0, (boss.hp as number) - totalDamage);
    const outcome = bossHpFinal <= 0 ? 'victory' : 'defeat';
    // Use client-reported livesRemaining for the record
    const livesRemaining = req.body.livesRemaining ?? Math.max(0, 3 - wrongCount);

    // Process in a transaction
    const result = db.transaction(() => {
      let xpEarned = 0;
      let gamification: {
          xpEarned: number;
          newTotalXp: number;
          currentRank: string;
          newRank: string | null;
          currentStreak: number;
          bestStreak: number;
          newAchievements: string[];
        } | null = null;

      if (outcome === 'victory') {
        // processBossVictory is async but uses sync DB calls; call synchronously
        // We'll inline the logic here to keep it in the transaction
        const awardXp = !db
          .prepare("SELECT 1 FROM boss_attempts WHERE child_id = ? AND boss_id = ? AND outcome = 'victory' LIMIT 1")
          .get(childId, bossId);

        xpEarned = awardXp ? 660 : 0; // calculateXp(20, 3) * 3

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
        let newTotalXp = child.xp;

        if (xpEarned > 0) {
          db.prepare('UPDATE children SET xp = xp + ? WHERE id = ?').run(xpEarned, childId);
          newTotalXp = child.xp + xpEarned;
        }

        // Evaluate rank
        const { getRankForXp } = require('@hero-academy/shared');
        const tier = getRankForXp(newTotalXp);
        let newRank: string | null = null;
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

        // Achievements
        const newAchievements: string[] = [];
        const { v4: achUuid } = require('uuid');

        const hasAch = (type: string): boolean =>
          !!db.prepare('SELECT 1 FROM child_achievements WHERE child_id = ? AND type = ?').get(childId, type);

        const awardAch = (type: string) => {
          if (hasAch(type)) return;
          db.prepare('INSERT INTO child_achievements (id, child_id, type) VALUES (?, ?, ?)').run(achUuid(), childId, type);
          newAchievements.push(type);
        };

        awardAch('boss_slayer');

        // Zone-specific achievement
        const bossRow = db
          .prepare('SELECT bb.id, s.zone_name FROM boss_battles bb JOIN subjects s ON bb.subject_id = s.id WHERE bb.id = ?')
          .get(bossId) as { id: string; zone_name: string } | undefined;
        if (bossRow && bossRow.zone_name === 'Mathropolis') {
          awardAch('zone_conquered_mathropolis');
        }

        gamification = {
          xpEarned,
          newTotalXp,
          currentRank,
          newRank,
          currentStreak,
          bestStreak,
          newAchievements,
        };
      } else {
        // Defeat — still update streak
        const child = db
          .prepare('SELECT xp, rank, current_streak, best_streak, last_active_date FROM children WHERE id = ?')
          .get(childId) as {
            xp: number;
            rank: string;
            current_streak: number;
            best_streak: number;
            last_active_date: string | null;
          };

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

        gamification = {
          xpEarned: 0,
          newTotalXp: child.xp,
          currentRank: child.rank,
          newRank: null,
          currentStreak,
          bestStreak,
          newAchievements: [],
        };
      }

      // Record the boss_attempt
      const attemptId = uuidv4();
      db.prepare(
        `INSERT INTO boss_attempts (id, child_id, boss_id, attempt_token, outcome, lives_remaining, boss_hp_final, duration_seconds, xp_earned, score, max_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        attemptId,
        childId,
        bossId,
        attemptToken,
        outcome,
        livesRemaining,
        bossHpFinal,
        durationSeconds || 0,
        gamification!.xpEarned,
        score,
        maxScore,
      );

      return gamification!;
    })();

    res.status(201).json({
      success: true,
      data: {
        outcome,
        score,
        maxScore,
        bossHpFinal,
        livesRemaining,
        xpEarned: result.xpEarned,
        newTotalXp: result.newTotalXp,
        currentRank: result.currentRank,
        newRank: result.newRank,
        currentStreak: result.currentStreak,
        bestStreak: result.bestStreak,
        newAchievements: result.newAchievements,
      },
    });
  } catch (err) {
    console.error('Boss attempt error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

export { router as bossRouter };
