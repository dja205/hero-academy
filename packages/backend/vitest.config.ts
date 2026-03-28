import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    exclude: ['dist/**', 'node_modules/**'],
    env: {
      DATABASE_PATH: ':memory:',
      NODE_ENV: 'test',
      JWT_ACCESS_SECRET: 'test-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      FRONTEND_URL: 'http://localhost:5173',
    },
  },
});
