import { execSync } from 'node:child_process';

/** Чистая тестовая БД перед прогоном (SQLite-файл prisma/test.db). */
export default function setup() {
  execSync('npx prisma db push --skip-generate --force-reset --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
  });
}
