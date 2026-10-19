import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { prisma } from '../db.js';
import { makeUser, tokenFor } from './helpers.js';

const app = createApp();
const stamp = Date.now();
const emails = { admin: `adm-${stamp}@t.ru`, manager: `mgr-${stamp}@t.ru`, client: `cli-${stamp}@t.ru` };
const tokens = { admin: '', manager: '', client: '' };
const validOrder = { name: 'Анна', email: 'anna@test.ru', phone: '+7 (999) 000-11-22', projectType: 'Лендинг', budget: 'до 50 000 ₽', deadline: '14 дней', message: 'Нужен лендинг для кофейни' };
let orderId = '';

beforeAll(async () => {
  await makeUser('ADMIN', emails.admin);
  await makeUser('MANAGER', emails.manager);
  await makeUser('CLIENT', emails.client);
  tokens.admin = await tokenFor(app, emails.admin);
  tokens.manager = await tokenFor(app, emails.manager);
  tokens.client = await tokenFor(app, emails.client);
});
afterAll(() => prisma.$disconnect());

describe('публичные заявки', () => {
  it('гостевая заявка создаётся, цену считает сервер', async () => {
    const res = await request(app).post('/api/orders').send({ ...validOrder, calculator: { type: 'landing', extras: ['seo'], urgency: 'normal' } });
    expect(res.status).toBe(201);
    orderId = res.body.id;
    const row = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(row.userId).toBeNull();
    expect((row.calculatorData as { total: number }).total).toBe(38_000);
  });

  it('невалидная заявка → 400 с деталями по полям', async () => {
    const res = await request(app).post('/api/orders').send({ ...validOrder, email: 'не-email', phone: '123' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details)).toEqual(expect.arrayContaining(['email', 'phone']));
  });

  it('honeypot: бот получает 201, но заявка не сохраняется', async () => {
    const before = await prisma.order.count();
    const res = await request(app).post('/api/orders').send({ ...validOrder, website: 'http://spam.bot' });
    expect(res.status).toBe(201);
    expect(await prisma.order.count()).toBe(before);
  });

  it('заявка авторизованного клиента привязывается к аккаунту', async () => {
    const res = await request(app).post('/api/orders').set('Authorization', `Bearer ${tokens.client}`).send(validOrder);
    expect(res.status).toBe(201);
    const mine = await request(app).get('/api/me/orders').set('Authorization', `Bearer ${tokens.client}`);
    expect(mine.status).toBe(200);
    expect(mine.body.items).toHaveLength(1);
  });

  it('POST /calculate считает без сохранения', async () => {
    const res = await request(app).post('/api/calculate').send({ type: 'shop', extras: ['crm'], urgency: 'fast' });
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(214_500);
  });
});

describe('доступ по ролям', () => {
  it('/me/* без токена → 401', async () => expect((await request(app).get('/api/me/orders')).status).toBe(401));

  it('клиент не видит админку (403), гость — 401', async () => {
    expect((await request(app).get('/api/admin/orders')).status).toBe(401);
    expect((await request(app).get('/api/admin/orders').set('Authorization', `Bearer ${tokens.client}`)).status).toBe(403);
  });

  it('менеджер видит заявки, но не кейсы', async () => {
    expect((await request(app).get('/api/admin/orders').set('Authorization', `Bearer ${tokens.manager}`)).status).toBe(200);
    expect((await request(app).get('/api/admin/projects').set('Authorization', `Bearer ${tokens.manager}`)).status).toBe(403);
  });

  it('клиент не читает чужой заказ (404)', async () => {
    const res = await request(app).get(`/api/me/orders/${orderId}`).set('Authorization', `Bearer ${tokens.client}`);
    expect(res.status).toBe(404);
  });
});

describe('админ', () => {
  it('меняет статус заказа и пишет аудит', async () => {
    const res = await request(app).patch(`/api/admin/orders/${orderId}`).set('Authorization', `Bearer ${tokens.admin}`).send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(200);
    expect(res.body.item.status).toBe('IN_PROGRESS');
    await new Promise((r) => setTimeout(r, 200)); // аудит пишется fire-and-forget
    const log = await prisma.auditLog.findFirst({ where: { action: 'STATUS_CHANGE', entityId: orderId } });
    expect(log?.payload).toMatchObject({ from: 'NEW', to: 'IN_PROGRESS' });
  });

  it('невалидный статус → 400', async () => {
    expect((await request(app).patch(`/api/admin/orders/${orderId}`).set('Authorization', `Bearer ${tokens.admin}`).send({ status: 'WAT' })).status).toBe(400);
  });

  it('кейс: CRUD, публичный список видит только опубликованные, удаление мягкое', async () => {
    const auth = { Authorization: `Bearer ${tokens.admin}` };
    const body = { title: 'Тест', slug: `test-${stamp}`, description: 'Описание', coverImage: '/c.jpg', category: 'Лендинг', clientName: 'ООО', year: 2025, isPublished: false };
    const created = await request(app).post('/api/admin/projects').set(auth).send(body);
    expect(created.status).toBe(201);
    const id = created.body.item.id as string;

    expect((await request(app).get(`/api/projects/${body.slug}`)).status).toBe(404); // черновик скрыт
    expect((await request(app).patch(`/api/admin/projects/${id}`).set(auth).send({ isPublished: true })).status).toBe(200);
    expect((await request(app).get(`/api/projects/${body.slug}`)).status).toBe(200);

    expect((await request(app).delete(`/api/admin/projects/${id}`).set(auth)).status).toBe(204);
    expect((await request(app).get(`/api/projects/${body.slug}`)).status).toBe(404);
    expect((await prisma.project.findUniqueOrThrow({ where: { id } })).deletedAt).not.toBeNull(); // soft delete
  });

  it('дубликат slug → 409', async () => {
    const auth = { Authorization: `Bearer ${tokens.admin}` };
    const body = { title: 'Дубль', slug: `dup-${stamp}`, description: 'x', coverImage: '/c.jpg', category: 'Лендинг', clientName: 'ООО', year: 2025 };
    expect((await request(app).post('/api/admin/projects').set(auth).send(body)).status).toBe(201);
    expect((await request(app).post('/api/admin/projects').set(auth).send(body)).status).toBe(409);
  });
});
