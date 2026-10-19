import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';

/** Express 4 не ловит ошибки async-хендлеров — оборачиваем. */
export const ah =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).optional(),
});
export type PageQuery = z.infer<typeof pageQuery>;

export const idParam = z.object({ id: z.string().min(1).max(40) });

/** После validate() req.query уже распарсен схемой. */
export const getQuery = <T>(req: Request) => req.query as unknown as T;

export const paginate = (p: { page: number; limit: number }) => ({ skip: (p.page - 1) * p.limit, take: p.limit });
export const pageMeta = (total: number, p: { page: number; limit: number }) => ({
  total,
  page: p.page,
  limit: p.limit,
  pages: Math.max(1, Math.ceil(total / p.limit)),
});
