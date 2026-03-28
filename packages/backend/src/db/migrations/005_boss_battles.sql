-- Boss Battles: boss definitions and attempt tracking
-- ISS-BB-002: DB Migration
-- ISS-BB-012: Seed Data

CREATE TABLE IF NOT EXISTS boss_battles (
  id             TEXT PRIMARY KEY,
  subject_id     TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  emoji          TEXT NOT NULL DEFAULT '🐉',
  hp             INTEGER NOT NULL DEFAULT 10,
  question_count INTEGER NOT NULL DEFAULT 20,
  active         INTEGER NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL DEFAULT (datetime('now')),
  UNIQUE(subject_id)
);

CREATE TABLE IF NOT EXISTS boss_attempts (
  id               TEXT PRIMARY KEY,
  child_id         TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  boss_id          TEXT NOT NULL REFERENCES boss_battles(id) ON DELETE CASCADE,
  attempt_token    TEXT NOT NULL UNIQUE,
  outcome          TEXT NOT NULL CHECK (outcome IN ('victory', 'defeat', 'abandoned')),
  lives_remaining  INTEGER NOT NULL DEFAULT 0,
  boss_hp_final    INTEGER NOT NULL DEFAULT 0,
  xp_earned        INTEGER NOT NULL DEFAULT 0,
  score            INTEGER NOT NULL DEFAULT 0,
  max_score        INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at       DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_boss_attempts_child ON boss_attempts(child_id);
CREATE INDEX IF NOT EXISTS idx_boss_attempts_boss  ON boss_attempts(boss_id);
CREATE INDEX IF NOT EXISTS idx_boss_battles_subject ON boss_battles(subject_id);

-- Ensure Mathropolis subject exists for seed (idempotent)
-- Use REPLACE to handle case where subject-maths exists with different zone_name
INSERT OR REPLACE INTO subjects (id, name, zone_name, colour)
VALUES ('subject-maths', 'Maths', 'Mathropolis', '#3b82f6');

-- Seed: Mathropolis boss
INSERT OR IGNORE INTO boss_battles (id, subject_id, name, description, emoji, hp, question_count)
SELECT
  'boss-mathropolis',
  s.id,
  'The Number Dragon',
  'A fearsome dragon who guards all of Mathropolis. Defeat it to conquer the zone!',
  '🐲',
  10,
  20
FROM subjects s
WHERE s.zone_name = 'Mathropolis'
LIMIT 1;
