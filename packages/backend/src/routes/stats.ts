/**
 * ISS-028: Stats Aggregation API
 *
 * Returns computed statistics for a child profile.
 * Child can only view their own stats (JWT sub must match param).
 */

import { Router, Request, Response } from 'express';
import { Role } from '@hero-academy/shared';
import type { RankName } from '@hero-academy/shared';
import { authenticateToken, requireRole } from '../middleware/auth';
import { getDb } from '../db';

const router = Router();

router.use(authenticateToken, requireRole(Role.Child, Role.Parent));

/** GET /api/v1/children/:childId/stats */
router.get('/:childId/stats', (req: Request, res: Response) => {
  try {
    const { childId } = req.params;

    // Children can only view their own stats
    if (req.user!.role === Role.Child && req.user!.sub !== childId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only view your own stats' },
      });
      return;
    }

    // Parents can only view their own children's stats
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

    const db = getDb();

    const child = db
      .prepare(
        'SELECT xp, rank, current_streak, best_streak FROM children WHERE id = ?',
      )
      .get(childId) as
      | { xp: number; rank: string; current_streak: number; best_streak: number }
      | undefined;

    if (!child) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Child not found' },
      });
      return;
    }

    // Total missions (distinct assessments attempted)
    const totalMissions = (
      db
        .prepare(
          'SELECT COUNT(*) as cnt FROM attempts WHERE child_id = ?',
        )
        .get(childId) as { cnt: number }
    ).cnt;

    // Average score
    const avgRow = db
      .prepare(
        `SELECT AVG(CAST(score AS REAL) / CAST(max_score AS REAL) * 100) as avg_pct
         FROM attempts WHERE child_id = ? AND max_score > 0`,
      )
      .get(childId) as { avg_pct: number | null };
    const avgScore = avgRow.avg_pct !== null ? Math.round(avgRow.avg_pct * 10) / 10 : 0;

    // Days played (distinct dates)
    const daysPlayed = (
      db
        .prepare(
          `SELECT COUNT(DISTINCT date(completed_at)) as cnt
           FROM attempts WHERE child_id = ?`,
        )
        .get(childId) as { cnt: number }
    ).cnt;

    // Strongest & weakest districts (by avg score, min 1 attempt)
    const districtScores = db
      .prepare(
        `SELECT t.district_name,
                AVG(CAST(att.score AS REAL) / CAST(att.max_score AS REAL)) as avg_pct
         FROM attempts att
         JOIN assessments a ON att.assessment_id = a.id
         JOIN topics t ON a.topic_id = t.id
         WHERE att.child_id = ? AND att.max_score > 0
         GROUP BY t.district_name
         HAVING COUNT(*) >= 1
         ORDER BY avg_pct DESC`,
      )
      .all(childId) as Array<{ district_name: string; avg_pct: number }>;

    const strongestDistrict =
      districtScores.length > 0 ? districtScores[0].district_name : null;
    const weakestDistrict =
      districtScores.length > 0
        ? districtScores[districtScores.length - 1].district_name
        : null;

    res.json({
      success: true,
      data: {
        totalMissions,
        avgScore,
        currentStreak: child.current_streak,
        bestStreak: child.best_streak,
        daysPlayed,
        strongestDistrict,
        weakestDistrict,
        totalXp: child.xp,
        rank: child.rank as RankName,
      },
    });
  } catch (err) {
    console.error('Stats aggregation error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

export { router as statsRouter };
