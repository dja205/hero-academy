/**
 * ISS-055: HTTPS & Secure Cookies
 * Helmet security headers, secure cookie defaults, trust-proxy.
 */

import { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { config } from '../config';

export function applySecurityMiddleware(app: Application): void {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'"],
        },
      },
    }),
  );

  if (config.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  const secureCookies =
    config.SECURE_COOKIES === 'true' ||
    (config.SECURE_COOKIES === 'auto' && config.NODE_ENV === 'production');

  // Intercept res.cookie to enforce secure defaults on every cookie
  app.use((_req: Request, res: Response, next: NextFunction) => {
    const originalCookie = res.cookie.bind(res);
    (res as any).cookie = (name: string, value: string, options?: any) => {
      return originalCookie(name, value, {
        ...options,
        secure: secureCookies ? true : (options?.secure ?? false),
        sameSite: options?.sameSite ?? 'lax',
        httpOnly: options?.httpOnly !== false,
      });
    };
    next();
  });
}
