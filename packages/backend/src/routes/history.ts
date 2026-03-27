/**
 * ISS-054: Attempt History Endpoints
 * Paginated history and single-attempt detail for children.
 * Answers hidden in list view; included in detail view.
 */

import { Router, Request, Response } from 'express';
import { Role } from '@hero-academy/shared';
import { authenticateToken, requireRole } from '../middleware/auth';
import { getDb } from '../db';

// ─────────────────────────────────────────────────────────────────────
// GET /api/v1/children/:childId/attempts
// ─────────────────────────────────────────────────────────────────────
const childHistoryRouter = Router();

childHistoryRouter.get(
  '/:childId/attempts',
  authenticateToken,
  requireRole(Role.Child, Role.Parent),
  (req: Request, res: Response) => {
    try {
      const { childId } = req.params;

      // Children can only view their own history
      if (req.user!.role === Role.Child && req.user!.sub !== childId) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only view your own history' },
        });
        return;
      }

      // Parents can only view their own children's history
      if (req.user!.role === Role.Parent) {
        const db = getDb();
        const owns = db
          .prepare('SELECT 1 FROM children WHERE id = ? AND parent_id = ?')
          .get(childId, req.user!.sub);
        if (!owns) {
          res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Not your child' },
          });
          return;
        }
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const offset = (page - 1) * limit;

      const db = getDb();

      const total = (
        db
          .prepare('SELECT COUNT(*) as cnt FROM attempts WHERE child_id = ?')
          .get(childId) as { cnt: number }
      ).cnt;

      const rows = db
        .prepare(
          `SELECT att.id, att.assessment_id, att.score, att.max_score, att.stars,
                  att.xp_earned, att.duration_seconds, att.completed_at,
                  a.title as assessment_title, t.district_name
           FROM attempts att
           JOIN assessments a ON att.assessment_id = a.id
           JOIN topics t ON a.topic_id = t.id
           WHERE att.child_id = ?
           ORDER BY att.completed_at DESC
           LIMIT ? OFFSET ?`,
        )
        .all(childId, limit, offset) as any[];

      const attempts = rows.map((r: any) => ({
        id: r.id,
        assessmentId: r.assessment_id,
        assessmentTitle: r.assessment_title,
        districtName: r.district_name,
        score: r.score,
        maxScore: r.max_score,
        stars: r.stars,
        xpEarned: r.xp_earned,
        durationSeconds: r.duration_seconds,
        completedAt: r.completed_at,
      }));

      res.json({ success: true, data: { attempts, total, page, limit } });
    } catch (err) {
      console.error('Fetch attempt history error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  },
);

// ─────────────────────────────────────────────────────────────────────
// GET /api/v1/attempts/:id
// ─────────────────────────────────────────────────────────────────────
const attemptDetailRouter = Router();

attemptDetailRouter.get(
  '/:id',
  authenticateToken,
  requireRole(Role.Child),
  (req: Request, res: Response) => {
    try {
      const db = getDb();

      const row = db
        .prepare(
          `SELECT att.*, a.title as assessment_title, a.topic_id,
                  t.district_name
           FROM attempts att
           JOIN assessments a ON att.assessment_id = a.id
           JOIN topics t ON a.topic_id = t.id
           WHERE att.id = ?`,
        )
        .get(req.params.id) as any;

      if (!row) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Attempt not found' },
        });
        return;
      }

      if (row.child_id !== req.user!.sub) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only view your own attempts' },
        });
        return;
      }

      const attempt = {
        id: row.id,
        assessmentId: row.assessment_id,
        assessmentTitle: row.assessment_title,
        districtName: row.district_name,
        topicId: row.topic_id,
        answers: JSON.parse(row.answers),
        score: row.score,
        maxScore: row.max_score,
        stars: row.stars,
        xpEarned: row.xp_earned,
        durationSeconds: row.duration_seconds,
        completedAt: row.completed_at,
      };

      res.json({ success: true, data: { attempt } });
    } catch (err) {
      console.error('Fetch attempt detail error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  },
);

export { childHistoryRouter, attemptDetailRouter };
