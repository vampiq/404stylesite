import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import type { User } from '@prisma/client';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { ah } from '../lib/http.js';
import { audit } from '../lib/audit.js';
import { conflict, unauthorized } from '../lib/errors.js';
import { emailSchema, phoneSchema } from '../lib/schemas.js';
import { hashToken, newOpaqueToken, signAccess } from '../lib/jwt.js';
import { REFRESH_COOKIE, clearAuthCookies, issueCsrf, setRefreshCookie } from '../lib/cookies.js';
import { authenticate } from '../middleware/auth.js';
import { csrfProtect } from '../middleware/csrf.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const DUMMY_HASH = bcrypt.hashSync('timing-attack-guard', env.BCRYPT_ROUNDS);

const password = z
  .string()
  .min(8, 'Минимум 8 символов')
  .max(72, 'Максимум 72 символа')
  .regex(/[A-Za-z]/, 'Нужна хотя бы одна буква')
  .regex(/\d/, 'Нужна хотя бы одна цифра');

const registerSchema = z.object({
  email: emailSchema,
  password,
  name: z.string().trim().min(2).max(80),
  phone: phoneSchema.optional(),
});
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(72) });
const profileSchema = z
  .object({ name: z.string().trim().min(2).max(80).optional(), phone: phoneSchema.nullable().optional() })
  .refine((v) => Object.keys(v).length > 0, 'Нечего обновлять');
const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(72), newPassword: password });

const publicUser = (u: User) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  phone: u.phone,
  role: u.role,
  createdAt: u.createdAt,
});

async function startSession(req: Request, res: Response, user: User) {
  const raw = newOpaqueToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 864e5);
  await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date() } } }),
    prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hashToken(raw), expiresAt, userAgent: req.get('user-agent')?.slice(0, 200) },
    }),
  ]);
  setRefreshCookie(res, raw, expiresAt);
  return { user: publicUser(user), accessToken: signAccess(user), csrfToken: issueCsrf(res) };
}

router.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  ah(async (req, res) => {
    const b = req.body as z.infer<typeof registerSchema>;
    if (await prisma.user.findUnique({ where: { email: b.email } })) throw conflict('Этот email уже зарегистрирован');
    const user = await prisma.user.create({
      data: { email: b.email, name: b.name, phone: b.phone, passwordHash: await bcrypt.hash(b.password, env.BCRYPT_ROUNDS) },
    });
    audit(req, { action: 'REGISTER', entity: 'User', entityId: user.id, userId: user.id });
    res.status(201).json(await startSession(req, res, user));
  }),
);

router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  ah(async (req, res) => {
    const b = req.body as z.infer<typeof loginSchema>;
    const user = await prisma.user.findUnique({ where: { email: b.email } });
    const valid = await bcrypt.compare(b.password, user && !user.deletedAt ? user.passwordHash : DUMMY_HASH);
    if (!user || user.deletedAt || !valid) throw unauthorized('Неверный email или пароль');
    audit(req, { action: 'LOGIN', entity: 'User', entityId: user.id, userId: user.id });
    res.json(await startSession(req, res, user));
  }),
);

/** Ротация: старый refresh отзывается, выдаётся новый. Повторное использование отозванного = кража → отзываем все сессии. */
router.post(
  '/refresh',
  csrfProtect,
  ah(async (req, res) => {
    const raw: unknown = req.cookies?.[REFRESH_COOKIE];
    if (typeof raw !== 'string') throw unauthorized('Нет refresh-токена');
    const rec = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(raw) }, include: { user: true } });
    const fail = (msg: string) => {
      clearAuthCookies(res);
      return unauthorized(msg);
    };
    if (!rec) throw fail('Сессия недействительна');
    if (rec.revokedAt) {
      // 10 секунд на гонку двух вкладок, дальше — считаем токен украденным
      if (Date.now() - rec.revokedAt.getTime() > 10_000) {
        await prisma.refreshToken.updateMany({ where: { userId: rec.userId, revokedAt: null }, data: { revokedAt: new Date() } });
        audit(req, { action: 'REFRESH_REUSE', entity: 'User', entityId: rec.userId, userId: rec.userId });
      }
      throw fail('Сессия завершена, войдите заново');
    }
    if (rec.expiresAt < new Date() || rec.user.deletedAt) throw fail('Сессия истекла');
    await prisma.refreshToken.update({ where: { id: rec.id }, data: { revokedAt: new Date() } });
    res.json(await startSession(req, res, rec.user));
  }),
);

router.post(
  '/logout',
  csrfProtect,
  ah(async (req, res) => {
    const raw: unknown = req.cookies?.[REFRESH_COOKIE];
    if (typeof raw === 'string') {
      await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(raw), revokedAt: null }, data: { revokedAt: new Date() } });
    }
    clearAuthCookies(res);
    res.status(204).end();
  }),
);

/** CSRF-токен для первого запроса, если cookie ещё нет. */
router.get('/csrf', (_req, res) => res.json({ csrfToken: issueCsrf(res) }));

router.get(
  '/me',
  authenticate,
  ah(async (req, res) => {
    const user = await prisma.user.findFirst({ where: { id: req.user!.id, deletedAt: null } });
    if (!user) throw unauthorized();
    res.json({ user: publicUser(user) });
  }),
);

router.patch(
  '/me',
  authenticate,
  validate({ body: profileSchema }),
  ah(async (req, res) => {
    const user = await prisma.user.update({ where: { id: req.user!.id }, data: req.body as z.infer<typeof profileSchema> });
    audit(req, { action: 'UPDATE_PROFILE', entity: 'User', entityId: user.id });
    res.json({ user: publicUser(user) });
  }),
);

router.post(
  '/change-password',
  authenticate,
  authLimiter,
  validate({ body: changePasswordSchema }),
  ah(async (req, res) => {
    const b = req.body as z.infer<typeof changePasswordSchema>;
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    if (!(await bcrypt.compare(b.currentPassword, user.passwordHash))) throw unauthorized('Текущий пароль неверный');
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(b.newPassword, env.BCRYPT_ROUNDS) } }),
      prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    audit(req, { action: 'CHANGE_PASSWORD', entity: 'User', entityId: user.id });
    clearAuthCookies(res);
    res.status(204).end();
  }),
);

export default router;
