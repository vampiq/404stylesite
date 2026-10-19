import rateLimit from 'express-rate-limit';
import { env } from '../env.js';
import { AppError } from '../lib/errors.js';

const make = (limit: number, windowMin = env.RATE_LIMIT_WINDOW_MIN) =>
  rateLimit({
    windowMs: windowMin * 60_000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    handler: (_req, _res, next) => next(new AppError(429, 'RATE_LIMITED', 'Слишком много запросов. Попробуйте позже.')),
  });

export const globalLimiter = make(env.RATE_LIMIT_MAX);
export const authLimiter = make(env.AUTH_RATE_LIMIT_MAX); // login / register
export const formLimiter = make(10); // публичные формы: заявки, контакты
