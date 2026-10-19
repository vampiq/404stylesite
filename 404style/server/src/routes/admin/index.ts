import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../db.js';
import { ah, getQuery, pageMeta, pageQuery, paginate, type PageQuery } from '../../lib/http.js';
import { audit } from '../../lib/audit.js';
import { slugSchema, stringList } from '../../lib/schemas.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { crud, type Delegate } from './crud.js';
import orders from './orders.js';
import stats from './stats.js';

const asDelegate = (d: unknown) => d as Delegate;
const order = z.number().int().min(0).default(0);
const str = (max = 200) => z.string().trim().min(1).max(max);
const metrics = z.record(z.string().max(200)).optional();

const router = Router();
router.use(authenticate);

// MANAGER: только заказы и сообщения
router.use('/orders', requireRole('ADMIN', 'MANAGER'), orders);

// Всё остальное — только ADMIN
router.use(requireRole('ADMIN'));
router.use('/stats', stats);

router.use('/projects', crud({
  entity: 'Project', delegate: asDelegate(prisma.project), soft: true, search: ['title', 'clientName'], filters: ['category', 'isPublished'],
  orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  schema: z.object({
    title: str(120), slug: slugSchema, description: str(5000), coverImage: str(500), images: stringList, category: str(60), tags: stringList,
    clientName: str(120), year: z.number().int().min(2000).max(2100), resultMetrics: metrics, isPublished: z.boolean().default(false), order,
  }),
}));

router.use('/services', crud({
  entity: 'Service', delegate: asDelegate(prisma.service), soft: true, search: ['title'], filters: ['isActive'], orderBy: { order: 'asc' },
  schema: z.object({ title: str(120), slug: slugSchema, description: str(2000), icon: str(60), priceFrom: z.number().int().min(0), features: stringList, order, isActive: z.boolean().default(true) }),
}));

router.use('/pricing', crud({
  entity: 'PricingPlan', delegate: asDelegate(prisma.pricingPlan), soft: false, search: ['name'], orderBy: { order: 'asc' },
  schema: z.object({ name: str(80), price: z.number().int().min(0), description: str(500), features: stringList, isPopular: z.boolean().default(false), order }),
}));

router.use('/reviews', crud({
  entity: 'Review', delegate: asDelegate(prisma.review), soft: true, search: ['authorName', 'authorCompany', 'text'], filters: ['isApproved'], orderBy: { createdAt: 'desc' },
  schema: z.object({
    authorName: str(80), authorCompany: z.string().trim().max(80).optional(), text: str(1500), rating: z.number().int().min(1).max(5),
    avatar: z.string().trim().max(500).optional(), isApproved: z.boolean().default(false),
  }),
}));

router.use('/faq', crud({
  entity: 'FaqItem', delegate: asDelegate(prisma.faqItem), soft: false, search: ['question', 'answer'], filters: ['isActive'], orderBy: { order: 'asc' },
  schema: z.object({ question: str(300), answer: str(3000), order, isActive: z.boolean().default(true) }),
}));

router.use('/team', crud({
  entity: 'TeamMember', delegate: asDelegate(prisma.teamMember), soft: false, search: ['name', 'role'], orderBy: { order: 'asc' },
  schema: z.object({ name: str(80), role: str(80), photo: str(500), bio: str(1000), socials: metrics, order }),
}));

// ── Audit log ──
const auditQuery = pageQuery.extend({ entity: z.string().max(40).optional(), action: z.string().max(40).optional(), userId: z.string().max(40).optional() });
router.get('/audit-log', validate({ query: auditQuery }), ah(async (req, res) => {
  const q = getQuery<PageQuery & z.infer<typeof auditQuery>>(req);
  const where: Prisma.AuditLogWhereInput = {
    ...(q.entity ? { entity: q.entity } : {}),
    ...(q.action ? { action: q.action } : {}),
    ...(q.userId ? { userId: q.userId } : {}),
    ...(q.q ? { OR: [{ entityId: { contains: q.q } }, { entity: { contains: q.q } }, { action: { contains: q.q } }] } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, ...paginate(q), include: { user: { select: { name: true, email: true } } } }),
    prisma.auditLog.count({ where }),
  ]);
  res.json({ items, ...pageMeta(total, q) });
}));

// ── Settings: { contacts: {...}, social: {...}, meta: {...} } ──
router.put('/settings', validate({ body: z.record(z.string().regex(/^[a-zA-Z0-9._-]{1,60}$/), z.unknown()).refine((o) => Object.keys(o).length > 0, 'Пусто') }), ah(async (req, res) => {
  const body = req.body as Record<string, Prisma.InputJsonValue>;
  await prisma.$transaction(Object.entries(body).map(([key, value]) => prisma.siteSettings.upsert({ where: { key }, create: { key, value }, update: { value } })));
  audit(req, { action: 'UPDATE', entity: 'SiteSettings', payload: { keys: Object.keys(body) } });
  const rows = await prisma.siteSettings.findMany();
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}));

router.get('/settings', ah(async (_req, res) => {
  const rows = await prisma.siteSettings.findMany();
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}));

export default router;
