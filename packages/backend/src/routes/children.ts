/**
 * ISS-052: Child Management Endpoints (Parent)
 * ISS-057: Data-privacy — pin_hash and parent PII never exposed.
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '@hero-academy/shared';
import { authenticateToken, requireRole } from '../middleware/auth';
import { getDb } from '../db';
import { hashPassword } from '../services/auth';

const router = Router();

const MAX_CHILDREN = 4;

/** Strip pin_hash and parent-sensitive fields from a child DB row. */
function sanitizeChild(row: any) {
  return {
    id: row.id,
    name: row.name,
    heroName: row.hero_name,
    avatarConfig:
      typeof row.avatar_config === 'string'
        ? JSON.parse(row.avatar_config)
        : row.avatar_config,
    xp: row.xp,
    rank: row.rank,
    createdAt: row.created_at,
  };
}

// ── POST / — create child ────────────────────────────────────────────
router.post(
  '/',
  authenticateToken,
  requireRole(Role.Parent),
  (req: Request, res: Response) => {
    try {
      const parentId = req.user!.sub;
      const { name, heroName, avatarConfig, pin } = req.body ?? {};

      const errors: { field: string; message: string }[] = [];
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push({ field: 'name', message: 'Name is required' });
      }
      if (!heroName || typeof heroName !== 'string' || heroName.trim().length === 0) {
        errors.push({ field: 'heroName', message: 'Hero name is required' });
      }
      if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
        errors.push({ field: 'pin', message: 'PIN must be exactly 4 digits' });
      }
      if (avatarConfig) {
        if (
          ![1, 2, 3].includes(avatarConfig.costume) ||
          ![1, 2].includes(avatarConfig.mask)
        ) {
          errors.push({ field: 'avatarConfig', message: 'Invalid avatar configuration' });
        }
      }
      if (errors.length) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors },
        });
        return;
      }

      const db = getDb();

      const count = (
        db
          .prepare('SELECT COUNT(*) as cnt FROM children WHERE parent_id = ? AND active = 1')
          .get(parentId) as { cnt: number }
      ).cnt;

      if (count >= MAX_CHILDREN) {
        res.status(400).json({
          success: false,
          error: {
            code: 'LIMIT_REACHED',
            message: `Maximum of ${MAX_CHILDREN} children per account`,
          },
        });
        return;
      }

      const id = uuidv4();
      const pinHash = hashPassword(pin);
      const avatarJson = JSON.stringify(avatarConfig || { costume: 1, mask: 1 });

      db.prepare(
        `INSERT INTO children (id, parent_id, name, hero_name, avatar_config, pin_hash)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(id, parentId, name.trim(), heroName.trim(), avatarJson, pinHash);

      const child = db.prepare('SELECT * FROM children WHERE id = ?').get(id);
      res.status(201).json({ success: true, data: { child: sanitizeChild(child) } });
    } catch (err) {
      console.error('Create child error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  },
);

// ── GET / — list parent's children ───────────────────────────────────
router.get(
  '/',
  authenticateToken,
  requireRole(Role.Parent),
  (req: Request, res: Response) => {
    try {
      const parentId = req.user!.sub;
      const db = getDb();

      const rows = db
        .prepare(
          'SELECT * FROM children WHERE parent_id = ? AND active = 1 ORDER BY created_at ASC',
        )
        .all(parentId);

      res.json({
        success: true,
        data: { children: (rows as any[]).map(sanitizeChild) },
      });
    } catch (err) {
      console.error('List children error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  },
);

// ── GET /me — child self-service profile ─────────────────────────────
router.get(
  '/me',
  authenticateToken,
  requireRole(Role.Child),
  (req: Request, res: Response) => {
    try {
      const db = getDb();
      const child = db
        .prepare('SELECT * FROM children WHERE id = ?')
        .get(req.user!.sub);

      if (!child) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Child not found' },
        });
        return;
      }

      res.json({ success: true, data: { child: sanitizeChild(child) } });
    } catch (err) {
      console.error('Get child (self) error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  },
);

// ── GET /:id — single child detail (parent only) ────────────────────
router.get(
  '/:id',
  authenticateToken,
  requireRole(Role.Parent),
  (req: Request, res: Response) => {
    try {
      const parentId = req.user!.sub;
      const db = getDb();

      const child = db
        .prepare(
          'SELECT * FROM children WHERE id = ? AND parent_id = ? AND active = 1',
        )
        .get(req.params.id, parentId);

      if (!child) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Child not found' },
        });
        return;
      }

      res.json({ success: true, data: { child: sanitizeChild(child) } });
    } catch (err) {
      console.error('Get child error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  },
);

// ── PUT /:id — update child profile (not PIN) ───────────────────────
router.put(
  '/:id',
  authenticateToken,
  requireRole(Role.Parent),
  (req: Request, res: Response) => {
    try {
      const parentId = req.user!.sub;
      const db = getDb();

      const existing = db
        .prepare(
          'SELECT id FROM children WHERE id = ? AND parent_id = ? AND active = 1',
        )
        .get(req.params.id, parentId);

      if (!existing) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Child not found' },
        });
        return;
      }

      const { name, heroName, avatarConfig } = req.body ?? {};
      const updates: string[] = [];
      const values: unknown[] = [];

      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
          res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Name must be a non-empty string' },
          });
          return;
        }
        updates.push('name = ?');
        values.push(name.trim());
      }

      if (heroName !== undefined) {
        if (typeof heroName !== 'string' || heroName.trim().length === 0) {
          res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Hero name must be a non-empty string' },
          });
          return;
        }
        updates.push('hero_name = ?');
        values.push(heroName.trim());
      }

      if (avatarConfig !== undefined) {
        if (
          ![1, 2, 3].includes(avatarConfig?.costume) ||
          ![1, 2].includes(avatarConfig?.mask)
        ) {
          res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid avatar configuration' },
          });
          return;
        }
        updates.push('avatar_config = ?');
        values.push(JSON.stringify(avatarConfig));
      }

      if (updates.length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'No fields to update' },
        });
        return;
      }

      values.push(req.params.id);
      db.prepare(`UPDATE children SET ${updates.join(', ')} WHERE id = ?`).run(
        ...values,
      );

      const child = db
        .prepare('SELECT * FROM children WHERE id = ?')
        .get(req.params.id);
      res.json({ success: true, data: { child: sanitizeChild(child) } });
    } catch (err) {
      console.error('Update child error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  },
);

// ── PUT /:id/pin — reset child PIN ──────────────────────────────────
router.put(
  '/:id/pin',
  authenticateToken,
  requireRole(Role.Parent),
  (req: Request, res: Response) => {
    try {
      const parentId = req.user!.sub;
      const db = getDb();

      const existing = db
        .prepare(
          'SELECT id FROM children WHERE id = ? AND parent_id = ? AND active = 1',
        )
        .get(req.params.id, parentId);

      if (!existing) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Child not found' },
        });
        return;
      }

      const { pin } = req.body ?? {};
      if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'PIN must be exactly 4 digits' },
        });
        return;
      }

      const pinHash = hashPassword(pin);
      db.prepare('UPDATE children SET pin_hash = ? WHERE id = ?').run(
        pinHash,
        req.params.id,
      );

      res.json({ success: true, data: { message: 'PIN updated successfully' } });
    } catch (err) {
      console.error('Reset PIN error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  },
);

// ── DELETE /:id — soft-delete child ──────────────────────────────────
router.delete(
  '/:id',
  authenticateToken,
  requireRole(Role.Parent),
  (req: Request, res: Response) => {
    try {
      const parentId = req.user!.sub;
      const db = getDb();

      const existing = db
        .prepare(
          'SELECT id FROM children WHERE id = ? AND parent_id = ? AND active = 1',
        )
        .get(req.params.id, parentId);

      if (!existing) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Child not found' },
        });
        return;
      }

      db.prepare('UPDATE children SET active = 0 WHERE id = ?').run(req.params.id);

      res.json({ success: true, data: { message: 'Child removed successfully' } });
    } catch (err) {
      console.error('Delete child error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  },
);

export { router as childrenRouter };
