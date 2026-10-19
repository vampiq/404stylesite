import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email('Некорректный email').max(120);
export const phoneSchema = z.string().trim().regex(/^\+?[\d\s()\-]{10,20}$/, 'Некорректный телефон');
export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Только латиница, цифры и дефисы');
export const stringList = z.array(z.string().trim().min(1).max(200)).max(30).default([]);
export const textMessage = z.string().trim().min(1, 'Пустое сообщение').max(4000);
export const attachments = z
  .array(z.object({ name: z.string().max(200), url: z.string().max(500), size: z.number().int().min(0).max(50_000_000) }))
  .max(5)
  .default([]);
