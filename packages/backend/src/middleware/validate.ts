import { Request, Response, NextFunction } from 'express';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldError {
  field: string;
  message: string;
}

function fail(res: Response, errors: FieldError[]): void {
  res.status(400).json({
    success: false,
    error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors },
  });
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

export function validateRegistration(req: Request, res: Response, next: NextFunction): void {
  const errors: FieldError[] = [];
  const { email, password, name } = req.body ?? {};

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  errors.length ? fail(res, errors) : next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction): void {
  const errors: FieldError[] = [];
  const { email, password } = req.body ?? {};

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }
  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  errors.length ? fail(res, errors) : next();
}

export function validateChildLogin(req: Request, res: Response, next: NextFunction): void {
  const errors: FieldError[] = [];
  const { childId, pin } = req.body ?? {};

  if (!childId || typeof childId !== 'string') {
    errors.push({ field: 'childId', message: 'Child ID is required' });
  }
  if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    errors.push({ field: 'pin', message: 'PIN must be exactly 4 digits' });
  }

  errors.length ? fail(res, errors) : next();
}

export function validateVerifyEmail(req: Request, res: Response, next: NextFunction): void {
  const errors: FieldError[] = [];
  const { token } = req.body ?? {};

  if (!token || typeof token !== 'string') {
    errors.push({ field: 'token', message: 'Verification token is required' });
  }

  errors.length ? fail(res, errors) : next();
}

export function validateForgotPassword(req: Request, res: Response, next: NextFunction): void {
  const errors: FieldError[] = [];
  const { email } = req.body ?? {};

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }

  errors.length ? fail(res, errors) : next();
}

export function validateResetPassword(req: Request, res: Response, next: NextFunction): void {
  const errors: FieldError[] = [];
  const { token, password } = req.body ?? {};

  if (!token || typeof token !== 'string') {
    errors.push({ field: 'token', message: 'Reset token is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
  }

  errors.length ? fail(res, errors) : next();
}
