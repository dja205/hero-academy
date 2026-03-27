/**
 * ISS-022: Attempt Submission and Scoring
 *
 * Scores answers against the question bank, then triggers
 * gamification (XP, rank, streak, achievements) in a transaction.
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Role, calculateStars } from '@hero-academy/shared';
import { authenticateToken, requireRole } from '../middleware/auth';
import { getDb } from '../db';
import { processAttemptGamification } from '../services/gamification';

const router = Router();

router.use(authenticateToken, requireRole(Role.Child));

/** POST /api/v1/attempts */
router.post('/', (req: Request, res: Response) => {
  try {
    const { assessmentId, answers, durationSeconds, attemptId } =
      req.body ?? {};
    const childId = req.user!.sub;

    // ---- Validation --------------------------------------------------
    const errors: { field: string; message: string }[] = [];
    if (!assessmentId || typeof assessmentId !== 'string')
      errors.push({ field: 'assessmentId', message: 'assessmentId is required' });
    if (!Array.isArray(answers))
      errors.push({ field: 'answers', message: 'answers must be an array' });
    if (typeof durationSeconds !== 'number' || durationSeconds < 0)
      errors.push({ field: 'durationSeconds', message: 'durationSeconds must be a non-negative number' });

    if (errors.length) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors },
      });
      return;
    }

    const db = getDb();

    // ---- Duplicate guard (client-supplied UUID) ----------------------
    const clientId = attemptId && typeof attemptId === 'string' ? attemptId : null;
    if (clientId) {
      const dup = db
        .prepare('SELECT id FROM attempts WHERE id = ?')
        .get(clientId);
      if (dup) {
        res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE', message: 'Attempt already submitted' },
        });
        return;
      }
    }

    // ---- Fetch assessment + questions --------------------------------
    const assessment = db
      .prepare(
        'SELECT id, question_ids FROM assessments WHERE id = ? AND active = 1',
      )
      .get(assessmentId) as
      | { id: string; question_ids: string }
      | undefined;

    if (!assessment) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Assessment not found' },
      });
      return;
    }

    const questionIds: string[] = JSON.parse(assessment.question_ids);
    const maxScore = questionIds.length;

    // ---- Score -------------------------------------------------------
    let score = 0;
    for (let i = 0; i < questionIds.length; i++) {
      const q = db
        .prepare('SELECT correct_index FROM questions WHERE id = ?')
        .get(questionIds[i]) as { correct_index: number } | undefined;

      if (q && answers[i] === q.correct_index) {
        score++;
      }
    }

    // ---- Persist + gamification (all inside one transaction) ---------
    const id = clientId ?? uuidv4();
    const stars = calculateStars(score, maxScore);

    const result = db.transaction(() => {
      // Insert attempt first so gamification queries (e.g. first_mission count) see it
      db.prepare(
        `INSERT INTO attempts (id, child_id, assessment_id, answers, score, max_score, stars, xp_earned, duration_seconds)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      ).run(id, childId, assessmentId, JSON.stringify(answers), score, maxScore, stars, durationSeconds);

      // Run gamification (XP, rank, streak, achievements)
      const gamification = processAttemptGamification(
        childId,
        assessmentId,
        score,
        maxScore,
        durationSeconds,
      );

      // Back-fill actual XP earned on the attempt row
      db.prepare('UPDATE attempts SET xp_earned = ? WHERE id = ?').run(
        gamification.xpEarned,
        id,
      );

      return gamification;
    })();

    res.status(201).json({
      success: true,
      data: {
        attemptId: id,
        score: result.score,
        maxScore: result.maxScore,
        stars: result.stars,
        xpEarned: result.xpEarned,
        newTotalXp: result.newTotalXp,
        newRank: result.newRank,
        currentStreak: result.currentStreak,
        bestStreak: result.bestStreak,
        newAchievements: result.newAchievements,
      },
    });
  } catch (err) {
    console.error('Attempt submission error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

export { router as attemptsRouter };
