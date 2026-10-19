// Выполняется до импорта приложения: env.ts читает process.env при загрузке
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db'; // относительно prisma/schema.prisma
process.env.JWT_ACCESS_SECRET = 'test-access-secret-test-access-secret-0001';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-test-refresh-secret-02';
process.env.BCRYPT_ROUNDS = '10';
process.env.CORS_ORIGINS = 'http://localhost:5173';
