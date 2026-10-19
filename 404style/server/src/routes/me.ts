import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { ah, idParam } from '../lib/http.js';
import { badRequest, notFound } from '../lib/errors.js';
import { attachments, textMessage } from '../lib/schemas.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const ownOrder = async (id: string, userId: string) => {
  const order = await prisma.order.findFirst({ where: { id, userId, deletedAt: null } });
  if (!order) throw notFound('Заказ не найден');
  return order;
};

router.get('/orders', ah(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { messages: { where: { isRead: false, senderRole: { not: 'CLIENT' } } } } },
    },
  });
  res.json({ items: orders.map(({ messages, _count, ...o }) => ({ ...o, lastMessage: messages[0] ?? null, unread: _count.messages })) });
}));

router.get('/orders/:id', validate({ params: idParam }), ah(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: String(req.params.id), userId: req.user!.id, deletedAt: null },
    include: { reviews: { where: { userId: req.user!.id, deletedAt: null }, select: { id: true, isApproved: true } } },
  });
  if (!order) throw notFound('Заказ не найден');
  res.json({ item: order });
}));

router.get('/orders/:id/messages', validate({ params: idParam }), ah(async (req, res) => {
  const order = await ownOrder(String(req.params.id), req.user!.id);
  const [items] = await prisma.$transaction([
    prisma.message.findMany({ where: { orderId: order.id }, orderBy: { createdAt: 'asc' }, include: { sender: { select: { name: true } } } }),
    prisma.message.updateMany({ where: { orderId: order.id, isRead: false, senderRole: { not: 'CLIENT' } }, data: { isRead: true } }),
  ]);
  res.json({ items });
}));

const messageSchema = z.object({ text: textMessage, attachments });
router.post('/orders/:id/messages', validate({ params: idParam, body: messageSchema }), ah(async (req, res) => {
  const order = await ownOrder(String(req.params.id), req.user!.id);
  if (order.status === 'CANCELLED') throw badRequest('Заказ отменён, чат закрыт');
  const b = req.body as z.infer<typeof messageSchema>;
  const item = await prisma.message.create({ data: { orderId: order.id, senderId: req.user!.id, senderRole: 'CLIENT', text: b.text, attachments: b.attachments } });
  res.status(201).json({ item });
}));

const reviewSchema = z.object({
  orderId: z.string().max(40).optional(),
  authorCompany: z.string().trim().max(80).optional(),
  text: z.string().trim().min(20, 'Минимум 20 символов').max(1500),
  rating: z.number().int().min(1).max(5),
});
router.post('/reviews', validate({ body: reviewSchema }), ah(async (req, res) => {
  const b = req.body as z.infer<typeof reviewSchema>;
  if (b.orderId) {
    const order = await ownOrder(b.orderId, req.user!.id);
    if (order.status !== 'DONE') throw badRequest('Отзыв можно оставить только к завершённому заказу');
    if (await prisma.review.findFirst({ where: { orderId: order.id, userId: req.user!.id, deletedAt: null } })) throw badRequest('Вы уже оставили отзыв к этому заказу');
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  const item = await prisma.review.create({
    data: { userId: user.id, orderId: b.orderId, authorName: user.name, authorCompany: b.authorCompany, text: b.text, rating: b.rating, isApproved: false },
  });
  res.status(201).json({ item, message: 'Спасибо! Отзыв появится на сайте после модерации.' });
}));

export default router;
