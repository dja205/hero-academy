/**
 * ISS-019 / ISS-020: Admin CRUD routes for Questions and Assessments
 *
 * All endpoints require `admin` role.
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '@hero-academy/shared';
import type { Difficulty } from '@hero-academy/shared';
import { authenticateToken, requireRole } from '../middleware/auth';
import { getDb } from '../db';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticateToken, requireRole(Role.Admin));

// ---------------------------------------------------------------------------
// Questions CRUD (ISS-019)
// ---------------------------------------------------------------------------

/** POST /api/v1/admin/questions — Create a new question */
router.post('/questions', (req: Request, res: Response) => {
  try {
    const { text, options, correctIndex, explanation, topicId, difficulty } =
      req.body ?? {};

    const errors: { field: string; message: string }[] = [];
    if (!text || typeof text !== 'string')
      errors.push({ field: 'text', message: 'Question text is required' });
    if (!Array.isArray(options) || options.length !== 4)
      errors.push({ field: 'options', message: 'Exactly 4 options required' });
    if (![0, 1, 2, 3].includes(correctIndex))
      errors.push({
        field: 'correctIndex',
        message: 'correctIndex must be 0-3',
      });
    if (!explanation || typeof explanation !== 'string')
      errors.push({
        field: 'explanation',
        message: 'Explanation is required',
      });
    if (!topicId || typeof topicId !== 'string')
      errors.push({ field: 'topicId', message: 'topicId is required' });
    if (!['easy', 'medium', 'hard'].includes(difficulty))
      errors.push({
        field: 'difficulty',
        message: 'difficulty must be easy, medium, or hard',
      });

    if (errors.length) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors },
      });
      return;
    }

    const db = getDb();

    // Verify topic exists
    const topic = db
      .prepare('SELECT id FROM topics WHERE id = ?')
      .get(topicId);
    if (!topic) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Topic not found' },
      });
      return;
    }

    const id = uuidv4();
    db.prepare(
      `INSERT INTO questions (id, topic_id, text, options, correct_index, explanation, difficulty)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, topicId, text, JSON.stringify(options), correctIndex, explanation, difficulty);

    res.status(201).json({
      success: true,
      data: { id, topicId, text, options, correctIndex, explanation, difficulty, active: true },
    });
  } catch (err) {
    console.error('Create question error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

/** GET /api/v1/admin/questions — List with pagination + filters */
router.get('/questions', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const topicId = req.query.topicId as string | undefined;
    const difficulty = req.query.difficulty as Difficulty | undefined;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const offset = (page - 1) * limit;

    let where = 'WHERE active = 1';
    const params: unknown[] = [];

    if (topicId) {
      where += ' AND topic_id = ?';
      params.push(topicId);
    }
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      where += ' AND difficulty = ?';
      params.push(difficulty);
    }

    const total = (
      db.prepare(`SELECT COUNT(*) as cnt FROM questions ${where}`).get(...params) as {
        cnt: number;
      }
    ).cnt;

    const rows = db
      .prepare(
        `SELECT id, topic_id, text, options, correct_index, explanation, difficulty, active, created_at
         FROM questions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset) as Array<{
      id: string;
      topic_id: string;
      text: string;
      options: string;
      correct_index: number;
      explanation: string;
      difficulty: string;
      active: number;
      created_at: string;
    }>;

    const questions = rows.map((r) => ({
      id: r.id,
      topicId: r.topic_id,
      text: r.text,
      options: JSON.parse(r.options),
      correctIndex: r.correct_index,
      explanation: r.explanation,
      difficulty: r.difficulty,
      active: !!r.active,
      createdAt: r.created_at,
    }));

    res.json({
      success: true,
      data: { questions, page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('List questions error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

/** PUT /api/v1/admin/questions/:id — Update question fields */
router.put('/questions/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db
      .prepare('SELECT id FROM questions WHERE id = ? AND active = 1')
      .get(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Question not found' },
      });
      return;
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    const { text, options, correctIndex, explanation, topicId, difficulty } =
      req.body ?? {};

    if (text !== undefined) {
      fields.push('text = ?');
      values.push(text);
    }
    if (options !== undefined) {
      if (!Array.isArray(options) || options.length !== 4) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'options must be an array of 4 strings',
          },
        });
        return;
      }
      fields.push('options = ?');
      values.push(JSON.stringify(options));
    }
    if (correctIndex !== undefined) {
      if (![0, 1, 2, 3].includes(correctIndex)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'correctIndex must be 0-3',
          },
        });
        return;
      }
      fields.push('correct_index = ?');
      values.push(correctIndex);
    }
    if (explanation !== undefined) {
      fields.push('explanation = ?');
      values.push(explanation);
    }
    if (topicId !== undefined) {
      fields.push('topic_id = ?');
      values.push(topicId);
    }
    if (difficulty !== undefined) {
      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'difficulty must be easy, medium, or hard',
          },
        });
        return;
      }
      fields.push('difficulty = ?');
      values.push(difficulty);
    }

    if (fields.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'No fields to update' },
      });
      return;
    }

    values.push(id);
    db.prepare(`UPDATE questions SET ${fields.join(', ')} WHERE id = ?`).run(
      ...values,
    );

    const updated = db
      .prepare(
        'SELECT id, topic_id, text, options, correct_index, explanation, difficulty, active FROM questions WHERE id = ?',
      )
      .get(id) as {
      id: string;
      topic_id: string;
      text: string;
      options: string;
      correct_index: number;
      explanation: string;
      difficulty: string;
      active: number;
    };

    res.json({
      success: true,
      data: {
        id: updated.id,
        topicId: updated.topic_id,
        text: updated.text,
        options: JSON.parse(updated.options),
        correctIndex: updated.correct_index,
        explanation: updated.explanation,
        difficulty: updated.difficulty,
        active: !!updated.active,
      },
    });
  } catch (err) {
    console.error('Update question error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

/** DELETE /api/v1/admin/questions/:id — Soft-delete */
router.delete('/questions/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const result = db
      .prepare('UPDATE questions SET active = 0 WHERE id = ? AND active = 1')
      .run(id);

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Question not found' },
      });
      return;
    }

    res.json({ success: true, data: { message: 'Question deleted' } });
  } catch (err) {
    console.error('Delete question error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

// ---------------------------------------------------------------------------
// Assessments CRUD (ISS-020)
// ---------------------------------------------------------------------------

/** POST /api/v1/admin/assessments — Create assessment */
router.post('/assessments', (req: Request, res: Response) => {
  try {
    const { title, topicId, difficulty, questionIds } = req.body ?? {};

    const errors: { field: string; message: string }[] = [];
    if (!title || typeof title !== 'string')
      errors.push({ field: 'title', message: 'Title is required' });
    if (!topicId || typeof topicId !== 'string')
      errors.push({ field: 'topicId', message: 'topicId is required' });
    if (!['easy', 'medium', 'hard'].includes(difficulty))
      errors.push({
        field: 'difficulty',
        message: 'difficulty must be easy, medium, or hard',
      });
    if (!Array.isArray(questionIds) || questionIds.length === 0)
      errors.push({
        field: 'questionIds',
        message: 'questionIds must be a non-empty array',
      });

    if (errors.length) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors },
      });
      return;
    }

    const db = getDb();

    const topic = db
      .prepare('SELECT id FROM topics WHERE id = ?')
      .get(topicId);
    if (!topic) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Topic not found' },
      });
      return;
    }

    const id = uuidv4();
    const order =
      ((
        db
          .prepare(
            'SELECT MAX("order") as mx FROM assessments WHERE topic_id = ?',
          )
          .get(topicId) as { mx: number | null }
      ).mx ?? -1) + 1;

    db.prepare(
      `INSERT INTO assessments (id, topic_id, title, difficulty, question_ids, "order")
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, topicId, title, difficulty, JSON.stringify(questionIds), order);

    res.status(201).json({
      success: true,
      data: { id, topicId, title, difficulty, questionIds, order, active: true },
    });
  } catch (err) {
    console.error('Create assessment error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

/** GET /api/v1/admin/assessments — List assessments with pagination */
router.get('/assessments', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const offset = (page - 1) * limit;

    const total = (
      db.prepare('SELECT COUNT(*) as cnt FROM assessments WHERE active = 1').get() as { cnt: number }
    ).cnt;

    const rows = db
      .prepare(
        `SELECT id, topic_id, title, difficulty, question_ids, "order", active
         FROM assessments WHERE active = 1 ORDER BY "order" ASC LIMIT ? OFFSET ?`,
      )
      .all(limit, offset) as Array<{
      id: string;
      topic_id: string;
      title: string;
      difficulty: string;
      question_ids: string;
      order: number;
      active: number;
    }>;

    const assessments = rows.map((r) => ({
      id: r.id,
      topicId: r.topic_id,
      title: r.title,
      difficulty: r.difficulty,
      questionIds: JSON.parse(r.question_ids),
      order: r.order,
      active: !!r.active,
    }));

    res.json({ success: true, data: { assessments, total, page, limit } });
  } catch (err) {
    console.error('List assessments error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

/** PUT /api/v1/admin/assessments/:id — Update including questionIds reordering */
router.put('/assessments/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db
      .prepare('SELECT id FROM assessments WHERE id = ? AND active = 1')
      .get(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Assessment not found' },
      });
      return;
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    const { title, topicId, difficulty, questionIds, order } = req.body ?? {};

    if (title !== undefined) {
      fields.push('title = ?');
      values.push(title);
    }
    if (topicId !== undefined) {
      fields.push('topic_id = ?');
      values.push(topicId);
    }
    if (difficulty !== undefined) {
      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'difficulty must be easy, medium, or hard',
          },
        });
        return;
      }
      fields.push('difficulty = ?');
      values.push(difficulty);
    }
    if (questionIds !== undefined) {
      if (!Array.isArray(questionIds)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'questionIds must be an array',
          },
        });
        return;
      }
      fields.push('question_ids = ?');
      values.push(JSON.stringify(questionIds));
    }
    if (order !== undefined) {
      fields.push('"order" = ?');
      values.push(order);
    }

    if (fields.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'No fields to update' },
      });
      return;
    }

    values.push(id);
    db.prepare(`UPDATE assessments SET ${fields.join(', ')} WHERE id = ?`).run(
      ...values,
    );

    const updated = db
      .prepare(
        'SELECT id, topic_id, title, difficulty, question_ids, "order", active FROM assessments WHERE id = ?',
      )
      .get(id) as {
      id: string;
      topic_id: string;
      title: string;
      difficulty: string;
      question_ids: string;
      order: number;
      active: number;
    };

    res.json({
      success: true,
      data: {
        id: updated.id,
        topicId: updated.topic_id,
        title: updated.title,
        difficulty: updated.difficulty,
        questionIds: JSON.parse(updated.question_ids),
        order: updated.order,
        active: !!updated.active,
      },
    });
  } catch (err) {
    console.error('Update assessment error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

/** DELETE /api/v1/admin/assessments/:id — Soft-delete */
router.delete('/assessments/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const result = db
      .prepare(
        'UPDATE assessments SET active = 0 WHERE id = ? AND active = 1',
      )
      .run(id);

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Assessment not found' },
      });
      return;
    }

    res.json({ success: true, data: { message: 'Assessment deleted' } });
  } catch (err) {
    console.error('Delete assessment error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

// ---------------------------------------------------------------------------
// User Management (ISS — Tyr P1-09)
// ---------------------------------------------------------------------------

/** GET /api/v1/admin/users — Paginated user list with search */
router.get('/users', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const offset = (page - 1) * limit;
    const search = (req.query.search as string) || '';

    let parents: any[];
    let total: number;

    if (search) {
      parents = db
        .prepare(
          'SELECT id, email, name, subscription_status, subscription_plan, created_at FROM parents WHERE email LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        )
        .all(`%${search}%`, limit, offset);
      total = (
        db.prepare('SELECT COUNT(*) as cnt FROM parents WHERE email LIKE ?').get(`%${search}%`) as { cnt: number }
      ).cnt;
    } else {
      parents = db
        .prepare(
          'SELECT id, email, name, subscription_status, subscription_plan, created_at FROM parents ORDER BY created_at DESC LIMIT ? OFFSET ?',
        )
        .all(limit, offset);
      total = (db.prepare('SELECT COUNT(*) as cnt FROM parents').get() as { cnt: number }).cnt;
    }

    const users = parents.map((p: any) => {
      const children = db
        .prepare(
          'SELECT id, name, hero_name, xp, rank, created_at FROM children WHERE parent_id = ? AND (active IS NULL OR active = 1)',
        )
        .all(p.id);
      return { ...p, children };
    });

    res.json({ success: true, data: { users, total, page, limit } });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

/** PUT /api/v1/admin/users/:id/suspend — Suspend a parent account */
router.put('/users/:id/suspend', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const parent = db.prepare('SELECT id FROM parents WHERE id = ?').get(id);
    if (!parent) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    db.prepare('UPDATE parents SET subscription_status = ? WHERE id = ?').run('suspended', id);
    res.json({ success: true, data: { message: 'User suspended' } });
  } catch (err) {
    console.error('Suspend user error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

/** PUT /api/v1/admin/users/:id/unsuspend — Unsuspend a parent account */
router.put('/users/:id/unsuspend', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const parent = db.prepare('SELECT id FROM parents WHERE id = ?').get(id);
    if (!parent) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    db.prepare('UPDATE parents SET subscription_status = ? WHERE id = ?').run('active', id);
    res.json({ success: true, data: { message: 'User unsuspended' } });
  } catch (err) {
    console.error('Unsuspend user error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

export { router as adminRouter };
