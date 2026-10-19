import { Router } from 'express';
import type { ZodObject, ZodRawShape } from 'zod';
import { z } from 'zod';
import { ah, getQuery, idParam, pageMeta, pageQuery, paginate, type PageQuery } from '../../lib/http.js';
import { audit } from '../../lib/audit.js';
import { notFound } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';

/** Минимальный контракт делегата Prisma, который нужен фабрике (без any). */
export interface Delegate {
  findMany(a: object): Promise<unknown[]>;
  count(a: object): Promise<number>;
  findFirst(a: object): Promise<unknown>;
  create(a: object): Promise<{ id: string }>;
  update(a: object): Promise<{ id: string }>;
  delete(a: object): Promise<{ id: string }>;
}

interface CrudOptions {
  entity: string;
  delegate: Delegate;
  schema: ZodObject<ZodRawShape>;
  search: string[];
  orderBy: object;
  /** true — модель имеет deletedAt и удаляется мягко */
  soft: boolean;
  /** query-параметры для точной фильтрации (category, isApproved...) */
  filters?: string[];
}

const toValue = (v: string): string | boolean => (v === 'true' ? true : v === 'false' ? false : v);

export function crud(o: CrudOptions): Router {
  const router = Router();
  const live = o.soft ? { deletedAt: null } : {};
  const updateSchema = o.schema.partial().refine((v) => Object.keys(v).length > 0, 'Пустое обновление');

  router.get('/', validate({ query: pageQuery.passthrough() }), ah(async (req, res) => {
    const query = getQuery<PageQuery & Record<string, unknown>>(req);
    const where: Record<string, unknown> = { ...live };
    for (const f of o.filters ?? []) if (typeof query[f] === 'string') where[f] = toValue(query[f] as string);
    if (query.q) where.OR = o.search.map((f) => ({ [f]: { contains: query.q } }));
    const [items, total] = await Promise.all([
      o.delegate.findMany({ where, orderBy: o.orderBy, ...paginate(query) }),
      o.delegate.count({ where }),
    ]);
    res.json({ items, ...pageMeta(total, query) });
  }));

  router.get('/:id', validate({ params: idParam }), ah(async (req, res) => {
    const item = await o.delegate.findFirst({ where: { id: String(req.params.id), ...live } });
    if (!item) throw notFound();
    res.json({ item });
  }));

  router.post('/', validate({ body: o.schema }), ah(async (req, res) => {
    const item = await o.delegate.create({ data: req.body });
    audit(req, { action: 'CREATE', entity: o.entity, entityId: item.id, payload: req.body });
    res.status(201).json({ item });
  }));

  const update = ah(async (req, res) => {
    const id = String(req.params.id);
    if (!(await o.delegate.findFirst({ where: { id, ...live } }))) throw notFound();
    const item = await o.delegate.update({ where: { id }, data: req.body });
    audit(req, { action: 'UPDATE', entity: o.entity, entityId: id, payload: req.body });
    res.json({ item });
  });
  router.patch('/:id', validate({ params: idParam, body: updateSchema }), update);
  router.put('/:id', validate({ params: idParam, body: updateSchema }), update);

  router.delete('/:id', validate({ params: idParam }), ah(async (req, res) => {
    const id = String(req.params.id);
    if (!(await o.delegate.findFirst({ where: { id, ...live } }))) throw notFound();
    if (o.soft) await o.delegate.update({ where: { id }, data: { deletedAt: new Date() } });
    else await o.delegate.delete({ where: { id } });
    audit(req, { action: o.soft ? 'SOFT_DELETE' : 'DELETE', entity: o.entity, entityId: id });
    res.status(204).end();
  }));

  return router;
}

export { z };
