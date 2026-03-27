import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { getDb } from '../db';
import { Role } from '@hero-academy/shared';
import type { JwtPayload } from '@hero-academy/shared';

const BCRYPT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// Password / PIN hashing
// ---------------------------------------------------------------------------

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

export function comparePassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

export function generateAccessToken(payload: { sub: string; role: Role; parentId?: string }): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
}

// ---------------------------------------------------------------------------
// Refresh tokens
// Cookie value format: "<tokenId>.<randomSecret>"
// DB stores bcrypt(randomSecret); lookup is by tokenId (PK).
// ---------------------------------------------------------------------------

export function createRefreshToken(userId: string, userType: string): string {
  const db = getDb();
  const tokenId = uuidv4();
  const secret = crypto.randomBytes(32).toString('hex');
  const tokenHash = bcrypt.hashSync(secret, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO refresh_tokens (id, user_id, user_type, token_hash, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(tokenId, userId, userType, tokenHash, expiresAt);

  return `${tokenId}.${secret}`;
}

export function verifyRefreshToken(
  rawToken: string,
): { id: string; userId: string; userType: string } | null {
  const db = getDb();
  const dotIdx = rawToken.indexOf('.');
  if (dotIdx === -1) return null;

  const tokenId = rawToken.substring(0, dotIdx);
  const secret = rawToken.substring(dotIdx + 1);

  const row = db
    .prepare(
      `SELECT id, user_id, user_type, token_hash, expires_at, revoked
       FROM refresh_tokens WHERE id = ?`,
    )
    .get(tokenId) as
    | { id: string; user_id: string; user_type: string; token_hash: string; expires_at: string; revoked: number }
    | undefined;

  if (!row) return null;
  if (row.revoked) return null;
  if (new Date(row.expires_at) < new Date()) return null;
  if (!bcrypt.compareSync(secret, row.token_hash)) return null;

  return { id: row.id, userId: row.user_id, userType: row.user_type };
}

export function revokeRefreshToken(tokenId: string): void {
  getDb().prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(tokenId);
}

export function revokeAllUserRefreshTokens(userId: string, userType: string): void {
  getDb()
    .prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ? AND user_type = ?')
    .run(userId, userType);
}

// ---------------------------------------------------------------------------
// Deterministic SHA-256 helper (for one-time-use tokens)
// ---------------------------------------------------------------------------

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// ---------------------------------------------------------------------------
// Email verification tokens
// ---------------------------------------------------------------------------

export function createVerificationToken(parentId: string): string {
  const db = getDb();
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const id = uuidv4();

  db.prepare(
    `INSERT INTO verification_tokens (id, parent_id, token, expires_at)
     VALUES (?, ?, ?, ?)`,
  ).run(id, parentId, tokenHash, expiresAt);

  return token;
}

export function verifyEmailToken(rawToken: string): { parentId: string } | null {
  const db = getDb();
  const tokenHash = sha256(rawToken);

  const row = db
    .prepare(
      `SELECT id, parent_id, expires_at, used
       FROM verification_tokens WHERE token = ?`,
    )
    .get(tokenHash) as
    | { id: string; parent_id: string; expires_at: string; used: number }
    | undefined;

  if (!row) return null;
  if (row.used) return null;
  if (new Date(row.expires_at) < new Date()) return null;

  db.transaction(() => {
    db.prepare('UPDATE verification_tokens SET used = 1 WHERE id = ?').run(row.id);
    db.prepare('UPDATE parents SET email_verified = 1 WHERE id = ?').run(row.parent_id);
  })();

  return { parentId: row.parent_id };
}

// ---------------------------------------------------------------------------
// Password reset tokens
// ---------------------------------------------------------------------------

export function createPasswordResetToken(email: string): string | null {
  const db = getDb();
  const parent = db.prepare('SELECT id FROM parents WHERE email = ?').get(email) as
    | { id: string }
    | undefined;
  if (!parent) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  const id = uuidv4();

  db.prepare(
    `INSERT INTO password_reset_tokens (id, parent_id, token, expires_at)
     VALUES (?, ?, ?, ?)`,
  ).run(id, parent.id, tokenHash, expiresAt);

  return token;
}

export function resetPassword(rawToken: string, newPassword: string): boolean {
  const db = getDb();
  const tokenHash = sha256(rawToken);

  const row = db
    .prepare(
      `SELECT id, parent_id, expires_at, used
       FROM password_reset_tokens WHERE token = ?`,
    )
    .get(tokenHash) as
    | { id: string; parent_id: string; expires_at: string; used: number }
    | undefined;

  if (!row) return false;
  if (row.used) return false;
  if (new Date(row.expires_at) < new Date()) return false;

  const passwordHash = hashPassword(newPassword);

  db.transaction(() => {
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(row.id);
    db.prepare('UPDATE parents SET password_hash = ? WHERE id = ?').run(passwordHash, row.parent_id);
    db.prepare(
      'UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ? AND user_type = ?',
    ).run(row.parent_id, 'parent');
  })();

  return true;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

interface RegisterParentInput {
  email: string;
  password: string;
  name: string;
}

export function registerParent(
  input: RegisterParentInput,
): { id: string; email: string; name: string } {
  const db = getDb();

  const existing = db.prepare('SELECT id FROM parents WHERE email = ?').get(input.email);
  if (existing) {
    const err: any = new Error('Email already registered');
    err.statusCode = 409;
    err.code = 'DUPLICATE_EMAIL';
    throw err;
  }

  const id = uuidv4();
  const passwordHash = hashPassword(input.password);

  db.prepare(
    `INSERT INTO parents (id, email, password_hash, name)
     VALUES (?, ?, ?, ?)`,
  ).run(id, input.email, passwordHash, input.name);

  const verificationToken = createVerificationToken(id);
  console.log(`📧 [MVP] Email verification token for ${input.email}: ${verificationToken}`);

  return { id, email: input.email, name: input.name };
}

// ---------------------------------------------------------------------------
// Login — Parent
// ---------------------------------------------------------------------------

interface LoginResult {
  accessToken: string;
  refreshToken: string;
}

export function loginParent(
  email: string,
  password: string,
): (LoginResult & { parent: { id: string; email: string; name: string } }) | null {
  const db = getDb();
  const parent = db
    .prepare('SELECT id, email, password_hash, name FROM parents WHERE email = ?')
    .get(email) as
    | { id: string; email: string; password_hash: string; name: string }
    | undefined;

  if (!parent) return null;
  if (!comparePassword(password, parent.password_hash)) return null;

  const accessToken = generateAccessToken({ sub: parent.id, role: Role.Parent });
  const refreshToken = createRefreshToken(parent.id, 'parent');

  return {
    accessToken,
    refreshToken,
    parent: { id: parent.id, email: parent.email, name: parent.name },
  };
}

// ---------------------------------------------------------------------------
// Login — Admin
// ---------------------------------------------------------------------------

export function loginAdmin(
  email: string,
  password: string,
): (LoginResult & { admin: { id: string; email: string; name: string } }) | null {
  const db = getDb();
  const admin = db
    .prepare('SELECT id, email, password_hash, name FROM admins WHERE email = ?')
    .get(email) as
    | { id: string; email: string; password_hash: string; name: string }
    | undefined;

  if (!admin) return null;
  if (!comparePassword(password, admin.password_hash)) return null;

  const accessToken = generateAccessToken({ sub: admin.id, role: Role.Admin });
  const refreshToken = createRefreshToken(admin.id, 'admin');

  return {
    accessToken,
    refreshToken,
    admin: { id: admin.id, email: admin.email, name: admin.name },
  };
}

// ---------------------------------------------------------------------------
// Login — Child (PIN-based, 2 h access token, no refresh token)
// ---------------------------------------------------------------------------

export function loginChild(
  childId: string,
  pin: string,
): { accessToken: string } | null {
  const db = getDb();
  const child = db
    .prepare('SELECT id, parent_id, pin_hash FROM children WHERE id = ?')
    .get(childId) as
    | { id: string; parent_id: string; pin_hash: string }
    | undefined;

  if (!child) return null;
  if (!comparePassword(pin, child.pin_hash)) return null;

  const accessToken = jwt.sign(
    { sub: child.id, role: Role.Child, parentId: child.parent_id },
    config.JWT_ACCESS_SECRET,
    { expiresIn: '2h' } as SignOptions,
  );

  return { accessToken };
}
