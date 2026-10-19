import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/src/tests/**/*.test.ts'],
    globalSetup: ['server/src/tests/globalSetup.ts'],
    setupFiles: ['server/src/tests/setup.ts'],
    fileParallelism: false, // общая тестовая SQLite-БД
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
