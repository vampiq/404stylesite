import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { ah, getQuery } from '../../lib/http.js';
import { validate } from '../../middleware/validate.js';

const router = Router();
const day = (d: Date) => d.toISOString().slice(0, 10);

router.get('/', validate({ query: z.object({ days: z.coerce.number().int().min(7).max(365).default(30) }) }), ah(async (req, res) => {
  const { days } = getQuery<{ days: number }>(req);
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const [orders, newClients, recent, unread] = await Promise.all([
    prisma.order.findMany({ where: { deletedAt: null, createdAt: { gte: since } }, select: { createdAt: true, projectType: true, status: true, calculatorData: true } }),
    prisma.user.count({ where: { role: 'CLIENT', deletedAt: null, createdAt: { gte: since } } }),
    prisma.order.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { name: true } } } }),
    prisma.message.count({ where: { isRead: false, senderRole: 'CLIENT' } }),
  ]);

  const byStatus: Record<string, number> = { NEW: 0, IN_PROGRESS: 0, DONE: 0, CANCELLED: 0 };
  const types = new Map<string, number>();
  const perDay = new Map<string, number>();
  for (let i = 0; i < days; i++) perDay.set(day(new Date(since.getTime() + i * 864e5)), 0);
  const checks: number[] = [];

  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    types.set(o.projectType, (types.get(o.projectType) ?? 0) + 1);
    perDay.set(day(o.createdAt), (perDay.get(day(o.createdAt)) ?? 0) + 1);
    const total = (o.calculatorData as { total?: unknown } | null)?.total;
    if (typeof total === 'number') checks.push(total);
  }

  const total = orders.length;
  res.json({
    periodDays: days,
    kpi: {
      orders: total,
      newOrders: byStatus.NEW,
      conversion: total ? Math.round(((byStatus.DONE ?? 0) / total) * 1000) / 10 : 0, // % заявок, дошедших до DONE
      avgCheck: checks.length ? Math.round(checks.reduce((a, b) => a + b, 0) / checks.length) : 0,
      newClients,
      unreadMessages: unread,
    },
    byStatus,
    ordersByDay: [...perDay].map(([date, count]) => ({ date, count })),
    topServices: [...types].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    recentOrders: recent,
  });
}));

export default router;
