import { createApp } from './app.js';
import { env } from './env.js';
import { prisma } from './db.js';

const app = createApp();
const server = app.listen(env.PORT, () => console.log(`🚀 404style API: http://localhost:${env.PORT}/api  [${env.NODE_ENV}]`));

const shutdown = (signal: string) => {
  console.log(`${signal}: останавливаем сервер…`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (e) => console.error('unhandledRejection', e));
