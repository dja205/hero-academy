import { Router, Request, Response } from 'express';
import { Role } from '@hero-academy/shared';
import {
  registerParent,
  verifyEmailToken,
  loginParent,
  loginAdmin,
  loginChild,
  generateAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  createPasswordResetToken,
  resetPassword as resetPasswordService,
} from '../services/auth';
import { authenticateToken } from '../middleware/auth';
import {
  authRateLimiter,
  registrationRateLimiter,
  pinRateLimiter,
  recordPinFailure,
  resetPinAttempts,
} from '../middleware/rate-limit';
import {
  validateRegistration,
  validateLogin,
  validateChildLogin,
  validateVerifyEmail,
  validateForgotPassword,
  validateResetPassword,
} from '../middleware/validate';

const router = Router();

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ---------------------------------------------------------------------------
// POST /register — Parent registration (ISS-009)
// ---------------------------------------------------------------------------
router.post(
  '/register',
  registrationRateLimiter,
  validateRegistration,
  (req: Request, res: Response) => {
    try {
      const parent = registerParent(req.body);
      res.status(201).json({ success: true, data: parent });
    } catch (err: any) {
      if (err.statusCode === 409) {
        res.status(409).json({
          success: false,
          error: { code: err.code, message: 'Email already registered' },
        });
        return;
      }
      console.error('Registration error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  },
);

// ---------------------------------------------------------------------------
// POST /verify-email — Email verification (ISS-010)
// ---------------------------------------------------------------------------
router.post('/verify-email', validateVerifyEmail, (req: Request, res: Response) => {
  try {
    const result = verifyEmailToken(req.body.token);
    if (!result) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired verification token' },
      });
      return;
    }
    res.json({ success: true, data: { message: 'Email verified successfully' } });
  } catch (err) {
    console.error('Verify-email error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

// ---------------------------------------------------------------------------
// POST /parent-login — Parent login with JWT (ISS-011)
// ---------------------------------------------------------------------------
router.post(
  '/parent-login',
  authRateLimiter,
  validateLogin,
  (req: Request, res: Response) => {
    try {
      const result = loginParent(req.body.email, req.body.password);
      if (!result) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        });
        return;
      }
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTS);
      res.json({
        success: true,
        data: { accessToken: result.accessToken, parent: result.parent },
      });
    } catch (err) {
      console.error('Parent-login error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  },
);

// ---------------------------------------------------------------------------
// POST /admin-login — Admin login (ISS-015)
// ---------------------------------------------------------------------------
router.post(
  '/admin-login',
  authRateLimiter,
  validateLogin,
  (req: Request, res: Response) => {
    try {
      const result = loginAdmin(req.body.email, req.body.password);
      if (!result) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        });
        return;
      }
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTS);
      res.json({
        success: true,
        data: { accessToken: result.accessToken, admin: result.admin },
      });
    } catch (err) {
      console.error('Admin-login error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  },
);

// ---------------------------------------------------------------------------
// POST /child-login — Child PIN login (ISS-014, ISS-017)
// ---------------------------------------------------------------------------
router.post(
  '/child-login',
  authRateLimiter,
  pinRateLimiter,
  validateChildLogin,
  (req: Request, res: Response) => {
    try {
      const result = loginChild(req.body.childId, req.body.pin);
      if (!result) {
        recordPinFailure(req.body.childId);
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid PIN' },
        });
        return;
      }
      resetPinAttempts(req.body.childId);
      res.json({ success: true, data: { accessToken: result.accessToken } });
    } catch (err) {
      console.error('Child-login error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  },
);

// ---------------------------------------------------------------------------
// POST /refresh — Token refresh with rotation (ISS-012)
// ---------------------------------------------------------------------------
router.post('/refresh', (req: Request, res: Response) => {
  try {
    const rawToken: string | undefined = req.cookies?.refreshToken;
    if (!rawToken) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' },
      });
      return;
    }

    const tokenData = verifyRefreshToken(rawToken);
    if (!tokenData) {
      res.clearCookie('refreshToken', REFRESH_COOKIE_OPTS);
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' },
      });
      return;
    }

    // Revoke the old token (rotation)
    revokeRefreshToken(tokenData.id);

    // Map DB user_type to Role enum
    const roleMap: Record<string, Role> = {
      parent: Role.Parent,
      admin: Role.Admin,
      child: Role.Child,
    };
    const role = roleMap[tokenData.userType] ?? Role.Parent;

    const accessToken = generateAccessToken({ sub: tokenData.userId, role });
    const newRefreshToken = createRefreshToken(tokenData.userId, tokenData.userType);

    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTS);
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    console.error('Token-refresh error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

// ---------------------------------------------------------------------------
// POST /forgot-password — Request password reset (ISS-013)
// ---------------------------------------------------------------------------
router.post(
  '/forgot-password',
  authRateLimiter,
  validateForgotPassword,
  (req: Request, res: Response) => {
    try {
      const token = createPasswordResetToken(req.body.email);
      if (token) {
        console.log(`🔑 [MVP] Password reset token for ${req.body.email}: ${token}`);
      }
      // Always return success so we don't reveal whether the email exists
      res.json({
        success: true,
        data: { message: 'If the email exists, a reset link has been sent' },
      });
    } catch (err) {
      console.error('Forgot-password error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  },
);

// ---------------------------------------------------------------------------
// POST /reset-password — Reset password with token (ISS-013)
// ---------------------------------------------------------------------------
router.post('/reset-password', validateResetPassword, (req: Request, res: Response) => {
  try {
    const ok = resetPasswordService(req.body.token, req.body.password);
    if (!ok) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset token' },
      });
      return;
    }
    res.json({ success: true, data: { message: 'Password reset successfully' } });
  } catch (err) {
    console.error('Reset-password error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

// ---------------------------------------------------------------------------
// POST /logout — Logout with token revocation (ISS-018)
// ---------------------------------------------------------------------------
router.post('/logout', authenticateToken, (req: Request, res: Response) => {
  try {
    const rawToken: string | undefined = req.cookies?.refreshToken;
    if (rawToken) {
      const tokenData = verifyRefreshToken(rawToken);
      if (tokenData) {
        revokeRefreshToken(tokenData.id);
      }
    }
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTS);
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
});

export { router as authRouter };
