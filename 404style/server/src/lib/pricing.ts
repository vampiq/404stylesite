import { z } from 'zod';

export const SITE_TYPES = { landing: 30_000, corporate: 70_000, shop: 150_000 } as const;
export const EXTRAS = { seo: 8_000, copywriting: 10_000, crm: 15_000, animations: 12_000, multilang: 14_000 } as const;
export const URGENCY = {
  normal: { multiplier: 1, days: 14 },
  fast: { multiplier: 1.3, days: 7 },
  urgent: { multiplier: 1.6, days: 5 },
} as const;

export const calcSchema = z.object({
  type: z.enum(['landing', 'corporate', 'shop']),
  extras: z.array(z.enum(['seo', 'copywriting', 'crm', 'animations', 'multilang'])).max(5).default([]),
  urgency: z.enum(['normal', 'fast', 'urgent']).default('normal'),
});
export type CalcInput = z.infer<typeof calcSchema>;

export function computeQuote(input: CalcInput) {
  const extras = [...new Set(input.extras)].map((key) => ({ key, price: EXTRAS[key] }));
  const base = SITE_TYPES[input.type];
  const { multiplier, days } = URGENCY[input.urgency];
  const subtotal = base + extras.reduce((s, e) => s + e.price, 0);
  const total = Math.round((subtotal * multiplier) / 100) * 100;
  return { type: input.type, urgency: input.urgency, base, extras, subtotal, multiplier, days, total, currency: 'RUB' };
}
