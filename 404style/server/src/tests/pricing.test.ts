import { describe, expect, it } from 'vitest';
import { computeQuote } from '../lib/pricing.js';

describe('computeQuote', () => {
  it('базовая цена без допов', () => expect(computeQuote({ type: 'landing', extras: [], urgency: 'normal' }).total).toBe(30_000));
  it('суммирует допы', () => expect(computeQuote({ type: 'shop', extras: ['seo', 'crm'], urgency: 'normal' }).total).toBe(173_000));
  it('применяет множитель срочности и срок', () => {
    const q = computeQuote({ type: 'landing', extras: ['seo'], urgency: 'urgent' });
    expect(q.total).toBe(60_800);
    expect(q.days).toBe(5);
  });
  it('игнорирует дубликаты допов', () => expect(computeQuote({ type: 'landing', extras: ['seo', 'seo'], urgency: 'normal' }).total).toBe(38_000));
});
