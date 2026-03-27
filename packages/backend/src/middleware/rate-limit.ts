import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// express-rate-limit based limiters (ISS-059)
// ---------------------------------------------------------------------------

/** Login endpoints: 10 requests per 15 minutes per IP */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
  },
});

/** Registration: 5 requests per hour per IP */
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many registration attempts, please try again later' },
  },
});

// ---------------------------------------------------------------------------
// In-memory PIN rate limiter (ISS-017)
// ---------------------------------------------------------------------------

interface PinAttempt {
  count: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

const pinAttempts = new Map<string, PinAttempt>();

const PIN_MAX_ATTEMPTS = 5;
const PIN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const PIN_LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Middleware: blocks child PIN login when too many failures have occurred
 * for the given `childId`.
 */
export function pinRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const childId: string | undefined = req.body?.childId;
  if (!childId) {
    next();
    return;
  }

  const now = Date.now();
  const attempt = pinAttempts.get(childId);

  if (attempt) {
    // Currently blocked
    if (attempt.blockedUntil && now < attempt.blockedUntil) {
      const retryAfter = Math.ceil((attempt.blockedUntil - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many PIN attempts. Please try again later.' },
        retryAfter,
      });
      return;
    }

    // Window expired — reset
    if (now - attempt.firstAttempt > PIN_WINDOW_MS) {
      pinAttempts.delete(childId);
    }
  }

  next();
}

/** Record a failed PIN attempt for the given child. */
export function recordPinFailure(childId: string): void {
  const now = Date.now();
  const attempt = pinAttempts.get(childId) || { count: 0, firstAttempt: now, blockedUntil: null };

  attempt.count++;

  if (attempt.count >= PIN_MAX_ATTEMPTS) {
    attempt.blockedUntil = now + PIN_LOCKOUT_MS;
  }

  pinAttempts.set(childId, attempt);
}

/** Clear PIN attempt counter (called on successful login). */
export function resetPinAttempts(childId: string): void {
  pinAttempts.delete(childId);
}
