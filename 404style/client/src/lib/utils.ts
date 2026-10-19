import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));
export const formatPrice = (n: number) => `${new Intl.NumberFormat('ru-RU').format(n)} ₽`;

/** Детерминированный градиент по строке — заглушка для обложек без картинки. */
export function gradientFor(seed: string): string {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 35%), hsl(${(h + 70) % 360} 80% 28%))`;
}

export const maskPhone = (value: string): string => {
  let d = value.replace(/\D/g, '');
  if (d.startsWith('7') || d.startsWith('8')) d = d.slice(1);
  d = d.slice(0, 10);
  let out = '+7';
  if (d.length) out += ` (${d.slice(0, 3)}`;
  if (d.length >= 3) out += ')';
  if (d.length > 3) out += ` ${d.slice(3, 6)}`;
  if (d.length > 6) out += `-${d.slice(6, 8)}`;
  if (d.length > 8) out += `-${d.slice(8, 10)}`;
  return out;
};

export const formatDate = (iso: string, withTime = true) =>
  new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(new Date(iso));
