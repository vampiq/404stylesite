import type { RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import { verifyAccess } from '../lib/jwt.js';
import { forbidden, unauthorized } from '../lib/errors.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

const bearer = (h?: string) => (h?.startsWith('Bearer ') ? h.slice(7) : null);

export const authenticate: RequestHandler = (req, _res, next) => {
  const token = bearer(req.headers.authorization);
  if (!token) return next(unauthorized());
  try {
    const p = verifyAccess(token);
    req.user = { id: p.sub, role: p.role };
    next();
  } catch {
    next(unauthorized('Токен недействителен или истёк'));
  }
};

/** Для публичных эндпоинтов, где авторизация — бонус (гостевые заявки). */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  const token = bearer(req.headers.authorization);
  if (token) {
    try {
      const p = verifyAccess(token);
      req.user = { id: p.sub, role: p.role };
    } catch {
      /* невалидный токен = гость */
    }
  }
  next();
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
