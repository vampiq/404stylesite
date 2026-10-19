import type { Request, RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/** Парсит и подменяет body/query/params результатом Zod (с coerce, default, trim). */
export const validate =
  (s: Schemas): RequestHandler =>
  (req, _res, next) => {
    try {
      if (s.body) req.body = s.body.parse(req.body);
      if (s.query) req.query = s.query.parse(req.query) as Request['query'];
      if (s.params) req.params = s.params.parse(req.params) as Request['params'];
      next();
    } catch (e) {
      next(e);
    }
  };
