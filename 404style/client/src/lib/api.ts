import type { AuthResponse } from './types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: Record<string, string[]>) {
    super(message);
  }
}

let token: string | null = null;
let onAuthLost: (() => void) | null = null;
export const setAccessToken = (t: string | null) => { token = t; };
export const setAuthLostHandler = (fn: () => void) => { onAuthLost = fn; };

const readCookie = (name: string) =>
  document.cookie.split('; ').find((c) => c.startsWith(`${name}=`))?.split('=')[1];

async function csrfToken(): Promise<string> {
  let t = readCookie('csrf_token');
  if (!t) {
    const r = await fetch(`${BASE}/auth/csrf`, { credentials: 'include' });
    t = ((await r.json()) as { csrfToken: string }).csrfToken;
  }
  return decodeURIComponent(t);
}

let inflight: Promise<AuthResponse | null> | null = null;
/** Single-flight: параллельные 401 делают один refresh. */
export function refreshSession(): Promise<AuthResponse | null> {
  inflight ??= (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': await csrfToken() } });
      if (!res.ok) return null;
      const data = (await res.json()) as AuthResponse;
      token = data.accessToken;
      return data;
    } catch {
      return null;
    } finally {
      setTimeout(() => { inflight = null; }, 0);
    }
  })();
  return inflight;
}

interface Options {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  auth?: boolean;
  signal?: AbortSignal;
}

export async function api<T>(path: string, o: Options = {}): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  for (const [k, v] of Object.entries(o.query ?? {})) if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  const method = o.method ?? 'GET';

  const send = async () => {
    const headers: Record<string, string> = {};
    if (o.body !== undefined) headers['Content-Type'] = 'application/json';
    if (token && o.auth !== false) headers.Authorization = `Bearer ${token}`;
    if (method !== 'GET' && path.startsWith('/auth/') && !path.endsWith('/login') && !path.endsWith('/register')) headers['X-CSRF-Token'] = await csrfToken();
    return fetch(url, { method, credentials: 'include', signal: o.signal, headers, body: o.body !== undefined ? JSON.stringify(o.body) : undefined });
  };

  let res = await send();
  if (res.status === 401 && token && o.auth !== false && !path.startsWith('/auth/')) {
    if (await refreshSession()) res = await send();
    else { token = null; onAuthLost?.(); }
  }
  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (data as { error?: { code?: string; message?: string; details?: Record<string, string[]> } } | null)?.error;
    throw new ApiError(res.status, e?.code ?? 'ERROR', e?.message ?? 'Что-то пошло не так. Попробуйте ещё раз.', e?.details);
  }
  return data as T;
}
