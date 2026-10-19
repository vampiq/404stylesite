import crypto from 'node:crypto';
import type { RequestHandler } from 'express';
import { AppError } from '../lib/errors.js';
import { CSRF_COOKIE } from '../lib/cookies.js';

export const csrfProtect: RequestHandler = (req, _res, next) => {
  const cookie: unknown = req.cookies?.[CSRF_COOKIE];
  const header = req.get('x-csrf-token');
  const ok =
    typeof cookie === 'string' &&
    !!header &&
    cookie.length === header.length &&
    crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(header));
  next(ok ? undefined : new AppError(403, 'CSRF', 'Неверный CSRF-токен'));
};
