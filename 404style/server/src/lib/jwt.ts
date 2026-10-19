import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../env.js';

export const signAccess = (u: { id: string; role: Role }) =>
  jwt.sign({ role: u.role }, env.JWT_ACCESS_SECRET, {
    subject: u.id,
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'],
  });

export function verifyAccess(token: string): { sub: string; role: Role } {
  const p = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof p === 'string' || !p.sub || typeof p.role !== 'string') throw new Error('bad payload');
  return { sub: p.sub, role: p.role as Role };
}

/** Refresh-токен — непрозрачная случайная строка; в БД хранится только HMAC-хеш. */
export const newOpaqueToken = () => crypto.randomBytes(48).toString('base64url');
export const hashToken = (t: string) => crypto.createHmac('sha256', env.JWT_REFRESH_SECRET).update(t).digest('hex');
