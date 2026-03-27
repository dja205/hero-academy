-- Email verification and password reset support

ALTER TABLE parents ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;

-- Verification tokens (for email verification flow)
CREATE TABLE IF NOT EXISTS verification_tokens (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expires_at  DATETIME NOT NULL,
  used        INTEGER NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expires_at  DATETIME NOT NULL,
  used        INTEGER NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_parent ON verification_tokens(parent_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_parent ON password_reset_tokens(parent_id);
