-- ISS-026: Streak tracking columns for children

ALTER TABLE children ADD COLUMN current_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE children ADD COLUMN best_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE children ADD COLUMN last_active_date TEXT;

-- Idempotent index to speed up attempt-dedup lookups
CREATE INDEX IF NOT EXISTS idx_attempts_child_assessment ON attempts(child_id, assessment_id);
