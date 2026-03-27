-- Hero Academy Initial Schema

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name        TEXT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Parents (subscribers)
CREATE TABLE IF NOT EXISTS parents (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  name            TEXT NOT NULL,
  stripe_customer_id TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'inactive',
  subscription_plan   TEXT,
  subscription_ends_at DATETIME,
  created_at      DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  user_type   TEXT NOT NULL CHECK (user_type IN ('parent', 'child', 'admin')),
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  DATETIME NOT NULL,
  revoked     INTEGER NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Children profiles
CREATE TABLE IF NOT EXISTS children (
  id            TEXT PRIMARY KEY,
  parent_id     TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  hero_name     TEXT NOT NULL,
  avatar_config TEXT NOT NULL DEFAULT '{"costume":1,"mask":1}',
  pin_hash      TEXT NOT NULL,
  xp            INTEGER NOT NULL DEFAULT 0,
  rank          TEXT NOT NULL DEFAULT 'Recruit',
  created_at    DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Subjects (e.g. Maths)
CREATE TABLE IF NOT EXISTS subjects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  zone_name   TEXT NOT NULL,
  colour      TEXT NOT NULL,
  "order"     INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1
);

-- Topics / Districts (e.g. Number Tower)
CREATE TABLE IF NOT EXISTS topics (
  id            TEXT PRIMARY KEY,
  subject_id    TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  district_name TEXT NOT NULL,
  colour        TEXT NOT NULL,
  "order"       INTEGER NOT NULL DEFAULT 0,
  active        INTEGER NOT NULL DEFAULT 1
);

-- Assessments / Missions
CREATE TABLE IF NOT EXISTS assessments (
  id            TEXT PRIMARY KEY,
  topic_id      TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  difficulty    TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_ids  TEXT NOT NULL DEFAULT '[]',
  "order"       INTEGER NOT NULL DEFAULT 0,
  active        INTEGER NOT NULL DEFAULT 1
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id            TEXT PRIMARY KEY,
  topic_id      TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  text          TEXT NOT NULL,
  options       TEXT NOT NULL,
  correct_index INTEGER NOT NULL CHECK (correct_index IN (0,1,2,3)),
  explanation   TEXT NOT NULL,
  difficulty    TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Attempts
CREATE TABLE IF NOT EXISTS attempts (
  id                TEXT PRIMARY KEY,
  child_id          TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  assessment_id     TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  answers           TEXT NOT NULL DEFAULT '[]',
  score             INTEGER NOT NULL DEFAULT 0,
  max_score         INTEGER NOT NULL DEFAULT 10,
  stars             INTEGER NOT NULL DEFAULT 1 CHECK (stars IN (1,2,3)),
  xp_earned         INTEGER NOT NULL DEFAULT 0,
  duration_seconds  INTEGER NOT NULL DEFAULT 0,
  completed_at      DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Achievements earned by children
CREATE TABLE IF NOT EXISTS child_achievements (
  id          TEXT PRIMARY KEY,
  child_id    TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  earned_at   DATETIME NOT NULL DEFAULT (datetime('now')),
  UNIQUE(child_id, type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_children_parent ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_assessments_topic ON assessments(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_attempts_child ON attempts(child_id);
CREATE INDEX IF NOT EXISTS idx_attempts_assessment ON attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id, user_type);
