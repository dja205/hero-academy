import { cleanEnv, str, num } from 'envalid';

export const config = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: num({ default: 3001 }),
  DATABASE_PATH: str({ default: './data/hero-academy.db' }),
  JWT_ACCESS_SECRET: str({ default: 'dev-access-secret-change-in-production' }),
  JWT_REFRESH_SECRET: str({ default: 'dev-refresh-secret-change-in-production' }),
  JWT_ACCESS_EXPIRES_IN: str({ default: '15m' }),
  JWT_REFRESH_EXPIRES_IN: str({ default: '7d' }),
  STRIPE_SECRET_KEY: str({ default: 'sk_test_placeholder' }),
  STRIPE_WEBHOOK_SECRET: str({ default: 'whsec_placeholder' }),
  FRONTEND_URL: str({ default: 'http://localhost:5173' }),
  // ISS-055: 'auto' → true in production, false otherwise. Set 'true'/'false' to override.
  SECURE_COOKIES: str({ default: 'auto' }),
});
