import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { prisma } from '../db.js';
import { PASSWORD, cookiesOf } from './helpers.js';

const app = createApp();
const email = `auth-${Date.now()}@test.ru`;
let accessToken = '';
let refresh = '';
let csrf = '';

afterAll(() => prisma.$disconnect());

describe('auth', () => {
  it('регистрирует пользователя, не отдаёт хеш пароля, ставит httpOnly refresh-cookie', async () => {
    const res = await request(app).post('/api/auth/register').send({ email, password: PASSWORD, name: 'Тест Тестов' });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email, role: 'CLIENT' });
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    expect((res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('refresh_token='))).toMatch(/HttpOnly/i);
    accessToken = res.body.accessToken;
    const c = cookiesOf(res);
    refresh = c.refresh_token ?? '';
    csrf = c.csrf_token ?? '';
    expect(refresh && csrf).toBeTruthy();
  });

  it('отклоняет дубликат email (409) и слабый пароль (400)', async () => {
    expect((await request(app).post('/api/auth/register').send({ email, password: PASSWORD, name: 'Дубль' })).status).toBe(409);
    const weak = await request(app).post('/api/auth/register').send({ email: `w-${email}`, password: 'short', name: 'Слабый' });
    expect(weak.status).toBe(400);
    expect(weak.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('логин: неверный пароль → 401, верный → токен', async () => {
    expect((await request(app).post('/api/auth/login').send({ email, password: 'WrongPass1' })).status).toBe(401);
    const ok = await request(app).post('/api/auth/login').send({ email: email.toUpperCase(), password: PASSWORD });
    expect(ok.status).toBe(200);
    expect(ok.body.accessToken).toBeTruthy();
  });

  it('GET /me: с токеном — профиль, без — 401', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it('refresh без CSRF-заголовка → 403', async () => {
    const res = await request(app).post('/api/auth/refresh').set('Cookie', `refresh_token=${refresh}; csrf_token=${csrf}`);
    expect(res.status).toBe(403);
  });

  it('refresh ротирует токен, а старый больше не работает', async () => {
    const res = await request(app).post('/api/auth/refresh').set('Cookie', `refresh_token=${refresh}; csrf_token=${csrf}`).set('X-CSRF-Token', csrf);
    expect(res.status).toBe(200);
    const next = cookiesOf(res).refresh_token;
    expect(next).toBeTruthy();
    expect(next).not.toBe(refresh);

    const reuse = await request(app).post('/api/auth/refresh').set('Cookie', `refresh_token=${refresh}; csrf_token=${csrf}`).set('X-CSRF-Token', csrf);
    expect(reuse.status).toBe(401);
    refresh = next ?? '';
    csrf = cookiesOf(res).csrf_token ?? csrf;
  });

  it('logout отзывает refresh-токен', async () => {
    const out = await request(app).post('/api/auth/logout').set('Cookie', `refresh_token=${refresh}; csrf_token=${csrf}`).set('X-CSRF-Token', csrf);
    expect(out.status).toBe(204);
    const again = await request(app).post('/api/auth/refresh').set('Cookie', `refresh_token=${refresh}; csrf_token=${csrf}`).set('X-CSRF-Token', csrf);
    expect(again.status).toBe(401);
  });
});
