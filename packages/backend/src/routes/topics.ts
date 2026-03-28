/**
 * ISS-053: Topics and Zones Endpoints
 * Returns topic/zone data with optional child-specific unlock state and progress.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Role } from '@hero-academy/shared';
import { verifyAccessToken } from '../services/auth';
import { getDb } from '../db';
import { config } from '../config';

interface TopicRow {
  id: string;
  subject_id: string;
  name: string;
  district_name: string;
  colour: string;
  order: number;
}

interface SubjectRow {
  id: string;
  name: string;
  zone_name: string;
  colour: string;
  order: number;
}

/** Populate req.user when a valid token is present but do NOT reject anonymous. */
function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      /* proceed unauthenticated */
    }
  }
  next();
}

function getTopicProgress(db: any, topicId: string, childId: string) {
  const total = (
    db
      .prepare('SELECT COUNT(*) as cnt FROM assessments WHERE topic_id = ? AND active = 1')
      .get(topicId) as { cnt: number }
  ).cnt;

  const completed = (
    db
      .prepare(
        `SELECT COUNT(DISTINCT att.assessment_id) as cnt
         FROM attempts att
         JOIN assessments a ON att.assessment_id = a.id
         WHERE a.topic_id = ? AND att.child_id = ?`,
      )
      .get(topicId, childId) as { cnt: number }
  ).cnt;

  const starCounts = db
    .prepare(
      `SELECT
         SUM(CASE WHEN best = 1 THEN 1 ELSE 0 END) as oneStar,
         SUM(CASE WHEN best = 2 THEN 1 ELSE 0 END) as twoStar,
         SUM(CASE WHEN best = 3 THEN 1 ELSE 0 END) as threeStar
       FROM (
         SELECT MAX(att.stars) as best
         FROM attempts att
         JOIN assessments a ON att.assessment_id = a.id
         WHERE a.topic_id = ? AND att.child_id = ?
         GROUP BY att.assessment_id
       )`,
    )
    .get(topicId, childId) as {
    oneStar: number | null;
    twoStar: number | null;
    threeStar: number | null;
  };

  return {
    completed,
    total,
    stars: {
      one: starCounts.oneStar ?? 0,
      two: starCounts.twoStar ?? 0,
      three: starCounts.threeStar ?? 0,
    },
  };
}

function isTopicUnlocked(
  db: any,
  topic: TopicRow,
  allTopics: TopicRow[],
  childId: string,
): boolean {
  // Debug mode: all districts unlocked
  if (config.DEBUG_UNLOCK_ALL === 'true') return true;

  const subjectTopics = allTopics
    .filter((t) => t.subject_id === topic.subject_id)
    .sort((a, b) => a.order - b.order);

  const idx = subjectTopics.findIndex((t) => t.id === topic.id);
  if (idx <= 0) return true; // first topic always unlocked

  const priorTopic = subjectTopics[idx - 1];
  const qualifying = db
    .prepare(
      `SELECT 1 FROM attempts att
       JOIN assessments a ON att.assessment_id = a.id
       WHERE a.topic_id = ? AND att.child_id = ? AND att.stars >= 2
       LIMIT 1`,
    )
    .get(priorTopic.id, childId);

  return !!qualifying;
}

// ─────────────────────────────────────────────────────────────────────
// GET /api/v1/topics
// ─────────────────────────────────────────────────────────────────────
const topicsRouter = Router();

topicsRouter.get('/', optionalAuth, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const childId = req.user?.role === Role.Child ? req.user.sub : null;

    const topics = db
      .prepare(
        `SELECT t.*, s.name as subject_name, s.zone_name
         FROM topics t
         JOIN subjects s ON t.subject_id = s.id
         WHERE t.active = 1 AND s.active = 1
         ORDER BY s."order" ASC, t."order" ASC`,
      )
      .all() as Array<TopicRow & { subject_name: string; zone_name: string }>;

    const allTopicRows = db
      .prepare('SELECT * FROM topics WHERE active = 1')
      .all() as TopicRow[];

    const result = topics.map((t) => {
      const base: Record<string, unknown> = {
        id: t.id,
        name: t.name,
        districtName: t.district_name,
        colour: t.colour,
        order: t.order,
        subjectId: t.subject_id,
        subjectName: t.subject_name,
        zoneName: t.zone_name,
      };

      if (childId) {
        base.unlocked = isTopicUnlocked(db, t, allTopicRows, childId);
        base.progress = getTopicProgress(db, t.id, childId);
      }

      return base;
    });

    res.json({ success: true, data: { topics: result } });
  } catch (err) {
    console.error('Fetch topics error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/v1/zones
// ─────────────────────────────────────────────────────────────────────
const zonesRouter = Router();

zonesRouter.get('/', optionalAuth, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const childId = req.user?.role === Role.Child ? req.user.sub : null;

    const subjects = db
      .prepare('SELECT * FROM subjects WHERE active = 1 ORDER BY "order" ASC')
      .all() as SubjectRow[];

    const allTopicRows = db
      .prepare('SELECT * FROM topics WHERE active = 1')
      .all() as TopicRow[];

    const zones = subjects.map((s) => {
      const subjectTopics = allTopicRows
        .filter((t) => t.subject_id === s.id)
        .sort((a, b) => a.order - b.order)
        .map((t) => {
          const base: Record<string, unknown> = {
            id: t.id,
            name: t.name,
            districtName: t.district_name,
            colour: t.colour,
            order: t.order,
          };

          if (childId) {
            base.unlocked = isTopicUnlocked(db, t, allTopicRows, childId);
            base.progress = getTopicProgress(db, t.id, childId);
          }

          return base;
        });

      return {
        id: s.id,
        name: s.name,
        zoneName: s.zone_name,
        colour: s.colour,
        order: s.order,
        topics: subjectTopics,
      };
    });

    res.json({ success: true, data: { zones } });
  } catch (err) {
    console.error('Fetch zones error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

export { topicsRouter, zonesRouter };
