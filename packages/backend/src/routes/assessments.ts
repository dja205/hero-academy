/**
 * ISS-021: Topic-Based Assessment Fetch (Child)
 *
 * Returns active assessments for a topic with answer-stripped questions.
 */

import { Router, Request, Response } from 'express';
import { Role } from '@hero-academy/shared';
import { authenticateToken, requireRole } from '../middleware/auth';
import { getDb } from '../db';
import { checkSubscription } from '../services/subscription';

const router = Router();

router.use(authenticateToken, requireRole(Role.Child));

/** GET /api/v1/assessments?topicId=<id> */
router.get('/', (req: Request, res: Response) => {
  try {
    const topicId = req.query.topicId as string | undefined;

    if (!topicId) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'topicId query parameter is required' },
      });
      return;
    }

    // Subscription gating (MVP no-op)
    const parentId = req.user!.parentId!;
    const sub = checkSubscription(parentId);
    if (!sub.allowed) {
      res.status(403).json({
        success: false,
        error: { code: 'SUBSCRIPTION_REQUIRED', message: 'Subscription required' },
      });
      return;
    }

    const db = getDb();

    const assessmentRows = db
      .prepare(
        `SELECT id, title, difficulty, question_ids
         FROM assessments
         WHERE topic_id = ? AND active = 1
         ORDER BY "order" ASC`,
      )
      .all(topicId) as Array<{
      id: string;
      title: string;
      difficulty: string;
      question_ids: string;
    }>;

    const assessments = assessmentRows.map((a) => {
      const questionIds: string[] = JSON.parse(a.question_ids);

      // Fetch questions and strip answers
      const questions = questionIds
        .map((qid) => {
          const q = db
            .prepare(
              'SELECT id, text, options FROM questions WHERE id = ? AND active = 1',
            )
            .get(qid) as
            | { id: string; text: string; options: string }
            | undefined;

          if (!q) return null;
          return {
            id: q.id,
            text: q.text,
            options: JSON.parse(q.options),
          };
        })
        .filter(Boolean);

      return {
        id: a.id,
        title: a.title,
        difficulty: a.difficulty,
        questions,
      };
    });

    res.json({ success: true, data: { assessments } });
  } catch (err) {
    console.error('Fetch assessments error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

export { router as assessmentsRouter };
