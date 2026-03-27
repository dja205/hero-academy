/**
 * Parent Profile Endpoint (P2-02)
 *
 * Provides the logged-in parent's profile data for the DashboardPage.
 */

import { Router, Request, Response } from 'express';
import { Role } from '@hero-academy/shared';
import { authenticateToken, requireRole } from '../middleware/auth';
import { getDb } from '../db';

const router = Router();

/** GET /api/v1/parent/profile */
router.get(
  '/profile',
  authenticateToken,
  requireRole(Role.Parent),
  (req: Request, res: Response) => {
    try {
      const db = getDb();
      const parent = db
        .prepare(
          'SELECT id, email, name, subscription_status, subscription_plan, created_at FROM parents WHERE id = ?',
        )
        .get(req.user!.sub);

      if (!parent) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Parent not found' },
        });
        return;
      }

      res.json({ success: true, data: { parent } });
    } catch (err) {
      console.error('Get parent profile error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  },
);

export { router as parentRouter };
