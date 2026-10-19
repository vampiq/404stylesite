import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../db.js';
import { ah, getQuery, idParam, pageMeta, pageQuery, paginate, type PageQuery } from '../../lib/http.js';
import { audit } from '../../lib/audit.js';
import { notFound } from '../../lib/errors.js';
import { attachments, textMessage } from '../../lib/schemas.js';
import { validate } from '../../middleware/validate.js';

const router = Router();
const status = z.enum(['NEW', 'IN_PROGRESS', 'DONE', 'CANCELLED']);

const listQuery = pageQuery.extend({
  status: status.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'status', 'name']).default('createdAt'),
  dir: z.enum(['asc', 'desc']).default('desc'),
});

router.get('/', validate({ query: listQuery }), ah(async (req, res) => {
  const q = getQuery<PageQuery & z.infer<typeof listQuery>>(req);
  const where: Prisma.OrderWhereInput = {
    deletedAt: null,
    ...(q.status ? { status: q.status } : {}),
    ...(q.from || q.to ? { createdAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } } : {}),
    ...(q.q ? { OR: [{ name: { contains: q.q } }, { email: { contains: q.q } }, { phone: { contains: q.q } }, { projectType: { contains: q.q } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { [q.sort]: q.dir },
      ...paginate(q),
      include: { user: { select: { id: true, name: true } }, _count: { select: { messages: { where: { isRead: false, senderRole: 'CLIENT' } } } } },
    }),
    prisma.order.count({ where }),
  ]);
  res.json({ items: rows.map(({ _count, ...o }) => ({ ...o, unread: _count.messages })), ...pageMeta(total, q) });
}));

router.get('/:id', validate({ params: idParam }), ah(async (req, res) => {
  const item = await prisma.order.findFirst({
    where: { id: String(req.params.id), deletedAt: null },
    include: { user: { select: { id: true, name: true, email: true, phone: true } }, reviews: true },
  });
  if (!item) throw notFound('Заказ не найден');
  res.json({ item });
}));

const patchSchema = z.object({ status });
router.patch('/:id', validate({ params: idParam, body: patchSchema }), ah(async (req, res) => {
  const id = String(req.params.id);
  const current = await prisma.order.findFirst({ where: { id, deletedAt: null } });
  if (!current) throw notFound('Заказ не найден');
  const next = (req.body as z.infer<typeof patchSchema>).status;
  const item = await prisma.order.update({ where: { id }, data: { status: next } });
  if (current.status !== next) audit(req, { action: 'STATUS_CHANGE', entity: 'Order', entityId: id, payload: { from: current.status, to: next } });
  res.json({ item });
}));

router.get('/:id/messages', validate({ params: idParam }), ah(async (req, res) => {
  const id = String(req.params.id);
  if (!(await prisma.order.findFirst({ where: { id, deletedAt: null }, select: { id: true } }))) throw notFound('Заказ не найден');
  const [items] = await prisma.$transaction([
    prisma.message.findMany({ where: { orderId: id }, orderBy: { createdAt: 'asc' }, include: { sender: { select: { name: true } } } }),
    prisma.message.updateMany({ where: { orderId: id, isRead: false, senderRole: 'CLIENT' }, data: { isRead: true } }),
  ]);
  res.json({ items });
}));

const messageSchema = z.object({ text: textMessage, attachments });
router.post('/:id/messages', validate({ params: idParam, body: messageSchema }), ah(async (req, res) => {
  const id = String(req.params.id);
  if (!(await prisma.order.findFirst({ where: { id, deletedAt: null }, select: { id: true } }))) throw notFound('Заказ не найден');
  const b = req.body as z.infer<typeof messageSchema>;
  const item = await prisma.message.create({ data: { orderId: id, senderId: req.user!.id, senderRole: req.user!.role, text: b.text, attachments: b.attachments } });
  res.status(201).json({ item });
}));

export default router;
