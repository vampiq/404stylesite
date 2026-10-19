import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { ah, getQuery } from '../lib/http.js';
import { notFound } from '../lib/errors.js';
import { calcSchema, computeQuote } from '../lib/pricing.js';
import { emailSchema, phoneSchema } from '../lib/schemas.js';
import { optionalAuth } from '../middleware/auth.js';
import { formLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const cache: RequestHandler = (_q, res, next) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  next();
};

router.get('/services', cache, ah(async (_req, res) => {
  res.json({ items: await prisma.service.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { order: 'asc' } }) });
}));

const projectsQuery = z.object({ category: z.string().trim().max(60).optional(), tag: z.string().trim().max(60).optional() });
router.get('/projects', cache, validate({ query: projectsQuery }), ah(async (req, res) => {
  const { category, tag } = getQuery<z.infer<typeof projectsQuery>>(req);
  const base = { isPublished: true, deletedAt: null };
  const [rows, cats] = await Promise.all([
    prisma.project.findMany({ where: { ...base, ...(category ? { category } : {}) }, orderBy: [{ order: 'asc' }, { year: 'desc' }] }),
    prisma.project.findMany({ where: base, distinct: ['category'], select: { category: true } }),
  ]);
  // Json-массивы фильтруем в JS: array_contains недоступен в SQLite
  const items = tag ? rows.filter((p) => Array.isArray(p.tags) && p.tags.includes(tag)) : rows;
  res.json({ items, categories: cats.map((c) => c.category) });
}));

router.get('/projects/:slug', cache, ah(async (req, res) => {
  const project = await prisma.project.findFirst({ where: { slug: String(req.params.slug), isPublished: true, deletedAt: null } });
  if (!project) throw notFound('Кейс не найден');
  res.json({ item: project });
}));

router.get('/pricing', cache, ah(async (_req, res) => {
  res.json({ items: await prisma.pricingPlan.findMany({ orderBy: { order: 'asc' } }) });
}));

router.get('/reviews', cache, ah(async (_req, res) => {
  const items = await prisma.review.findMany({
    where: { isApproved: true, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, authorName: true, authorCompany: true, text: true, rating: true, avatar: true, createdAt: true },
  });
  res.json({ items });
}));

router.get('/faq', cache, ah(async (_req, res) => {
  res.json({ items: await prisma.faqItem.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }) });
}));

router.get('/team', cache, ah(async (_req, res) => {
  res.json({ items: await prisma.teamMember.findMany({ orderBy: { order: 'asc' } }) });
}));

router.get('/settings', cache, ah(async (_req, res) => {
  const rows = await prisma.siteSettings.findMany({ where: { NOT: { key: { startsWith: 'private.' } } } });
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}));

router.post('/calculate', validate({ body: calcSchema }), (req, res) => {
  res.json(computeQuote(req.body as z.infer<typeof calcSchema>));
});

const orderSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  phone: phoneSchema,
  projectType: z.string().trim().min(2).max(60),
  budget: z.string().trim().max(60).optional(),
  deadline: z.string().trim().max(60).optional(),
  message: z.string().trim().max(2000).optional(),
  calculator: calcSchema.optional(),
  website: z.string().optional(), // honeypot: люди это поле не видят
});

router.post('/orders', formLimiter, optionalAuth, validate({ body: orderSchema }), ah(async (req, res) => {
  const b = req.body as z.infer<typeof orderSchema>;
  if (b.website) return res.status(201).json({ id: 'ok', status: 'NEW' }); // бот: делаем вид, что приняли
  const quote = b.calculator ? computeQuote(b.calculator) : undefined; // цену считаем на сервере, клиенту не верим
  const order = await prisma.order.create({
    data: {
      userId: req.user?.id,
      name: b.name,
      email: b.email,
      phone: b.phone,
      projectType: b.projectType,
      budget: b.budget,
      deadline: b.deadline,
      message: b.message,
      calculatorData: quote as Prisma.InputJsonValue | undefined,
      ...(req.user && b.message ? { messages: { create: { senderId: req.user.id, senderRole: req.user.role, text: b.message } } } : {}),
    },
  });
  res.status(201).json({ id: order.id, status: order.status, message: 'Заявка принята. Напишем в течение рабочего дня.' });
}));

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  message: z.string().trim().min(10, 'Минимум 10 символов').max(2000),
  source: z.string().trim().max(60).optional(),
  website: z.string().optional(),
});
router.post('/contact', formLimiter, validate({ body: contactSchema }), ah(async (req, res) => {
  const { website, ...data } = req.body as z.infer<typeof contactSchema>;
  if (!website) await prisma.contactRequest.create({ data });
  res.status(201).json({ ok: true });
}));

/** robots.txt и sitemap.xml монтируются в корень приложения. */
export const seoRouter = Router();
seoRouter.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /api\n\nSitemap: ${env.SITE_URL}/sitemap.xml\n`);
});
seoRouter.get('/sitemap.xml', ah(async (_req, res) => {
  const projects = await prisma.project.findMany({ where: { isPublished: true, deletedAt: null }, select: { slug: true, updatedAt: true } });
  const pages = ['/', '/portfolio', '/services', '/pricing', '/calculator', '/about', '/contacts'];
  const url = (loc: string, lastmod?: Date) => `<url><loc>${env.SITE_URL}${loc}</loc>${lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : ''}</url>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map((p) => url(p)).join('')}${projects.map((p) => url(`/portfolio/${p.slug}`, p.updatedAt)).join('')}</urlset>`;
  res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(xml);
}));

export default router;
