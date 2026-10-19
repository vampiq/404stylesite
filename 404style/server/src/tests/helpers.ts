import bcrypt from 'bcrypt';
import request from 'supertest';
import type { Express } from 'express';
import type { Role } from '@prisma/client';
import { prisma } from '../db.js';

export const PASSWORD = 'Passw0rd1';

export const makeUser = async (role: Role, email: string) =>
  prisma.user.create({ data: { email, name: `${role} Test`, role, passwordHash: await bcrypt.hash(PASSWORD, 10) } });

export async function tokenFor(app: Express, email: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  return (res.body as { accessToken: string }).accessToken;
}

/** Разбирает Set-Cookie в { name: value }. */
export function cookiesOf(res: request.Response): Record<string, string> {
  const raw = (res.headers['set-cookie'] as unknown as string[] | undefined) ?? [];
  return Object.fromEntries(raw.map((c) => { const [pair = ''] = c.split(';'); const i = pair.indexOf('='); return [pair.slice(0, i), pair.slice(i + 1)]; }));
}
