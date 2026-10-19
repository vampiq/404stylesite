import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';
import { isProd } from '../env.js';

export const notFoundHandler: RequestHandler = (req, _res, next) =>
  next(new AppError(404, 'NOT_FOUND', `Маршрут ${req.method} ${req.path} не найден`));

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const send = (status: number, code: string, message: string, details?: unknown) =>
    res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });

  if (err instanceof AppError) return send(err.status, err.code, err.message, err.details);
  if (err instanceof ZodError) return send(400, 'VALIDATION_ERROR', 'Ошибка валидации', err.flatten().fieldErrors);
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return send(409, 'CONFLICT', 'Запись с такими данными уже существует');
    if (err.code === 'P2025') return send(404, 'NOT_FOUND', 'Запись не найдена');
  }
  if (err instanceof SyntaxError && 'body' in err) return send(400, 'BAD_JSON', 'Некорректный JSON');

  console.error(err);
  return send(500, 'INTERNAL', isProd ? 'Внутренняя ошибка сервера' : String((err as Error)?.message ?? err));
};
