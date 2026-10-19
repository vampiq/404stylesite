import crypto from 'node:crypto';
import type { CookieOptions, Response } from 'express';
import { env } from '../env.js';

export const REFRESH_COOKIE = 'refresh_token';
export const CSRF_COOKIE = 'csrf_token';

const base: CookieOptions = { secure: env.COOKIE_SECURE, sameSite: env.COOKIE_SAMESITE, domain: env.COOKIE_DOMAIN };

export const setRefreshCookie = (res: Response, token: string, expires: Date) =>
  res.cookie(REFRESH_COOKIE, token, { ...base, httpOnly: true, path: '/api/auth', expires });

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE, { ...base, httpOnly: true, path: '/api/auth' });
  res.clearCookie(CSRF_COOKIE, { ...base, path: '/' });
};

/** Double-submit CSRF: токен в читаемой JS cookie, клиент дублирует его в заголовке X-CSRF-Token. */
export function issueCsrf(res: Response): string {
  const token = crypto.randomBytes(24).toString('base64url');
  res.cookie(CSRF_COOKIE, token, { ...base, httpOnly: false, path: '/', maxAge: env.REFRESH_TOKEN_TTL_DAYS * 864e5 });
  return token;
}
