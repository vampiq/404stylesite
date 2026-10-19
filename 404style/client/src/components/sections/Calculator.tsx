import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { AnimatedPrice } from '@/components/fx/Counters';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/shared/common';
import { useQuote } from '@/lib/queries';
import { cn, formatPrice } from '@/lib/utils';
import type { CalcExtra, CalcInput, CalcType, CalcUrgency } from '@/lib/types';

// Цены только для подписей; итог всегда считает сервер (POST /api/calculate)
const TYPES: { key: CalcType; label: string; hint: string }[] = [
  { key: 'landing', label: 'Лендинг', hint: 'от 30 000 ₽' },
  { key: 'corporate', label: 'Корпоративный', hint: 'от 70 000 ₽' },
  { key: 'shop', label: 'Магазин', hint: 'от 150 000 ₽' },
];
const EXTRAS: { key: CalcExtra; label: string; price: number }[] = [
  { key: 'seo', label: 'SEO-оптимизация', price: 8000 },
  { key: 'copywriting', label: 'Копирайтинг', price: 10000 },
  { key: 'crm', label: 'Интеграция CRM', price: 15000 },
  { key: 'animations', label: 'Анимации', price: 12000 },
  { key: 'multilang', label: 'Мультиязычность', price: 14000 },
];
const URGENCY: { key: CalcUrgency; label: string; note: string }[] = [
  { key: 'normal', label: 'Обычно', note: '~14 дней' },
  { key: 'fast', label: 'Быстро', note: '~7 дней · ×1.3' },
  { key: 'urgent', label: 'Срочно', note: '5 дней · ×1.6' },
];

export function Calculator({ standalone = false }: { standalone?: boolean }) {
  const [type, setType] = useState<CalcType>('landing');
  const [extras, setExtras] = useState<CalcExtra[]>([]);
  const [u, setU] = useState(0);
  const input: CalcInput = { type, extras: [...extras].sort(), urgency: URGENCY[u]!.key };
  const { data, isFetching } = useQuote(input);
  const toggle = (k: CalcExtra) => setExtras((e) => (e.includes(k) ? e.filter((x) => x !== k) : [...e, k]));

  return (
    <section id="calculator" className="section">
      <div className="container">
        {!standalone && <SectionTitle eyebrow="калькулятор" title={<>Посчитайте цену <span className="grad-text">за 30 секунд</span></>} sub="Без «оставьте заявку, мы перезвоним». Цифра — сразу. И она же попадёт в договор." />}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card-surface space-y-9 p-6 md:p-8 lg:col-span-2">
            <fieldset>
              <legend className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">01 / Тип сайта</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {TYPES.map((t) => (
                  <label key={t.key} className={cn('cursor-pointer rounded-2xl border p-4 transition', type === t.key ? 'border-accent bg-accent/10' : 'border-line hover:border-primary')}>
                    <input type="radio" name="type" className="sr-only" checked={type === t.key} onChange={() => setType(t.key)} />
                    <span className="block font-semibold">{t.label}</span><span className="font-mono text-xs text-muted">{t.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">02 / Дополнительно</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {EXTRAS.map((x) => {
                  const on = extras.includes(x.key);
                  return (
                    <label key={x.key} className={cn('flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition', on ? 'border-accent bg-accent/10' : 'border-line hover:border-primary')}>
                      <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(x.key)} />
                      <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-md border', on ? 'border-accent bg-accent text-[#0a0a0f]' : 'border-line')}>{on && <Check size={14} />}</span>
                      <span className="flex-1 text-sm">{x.label}</span><span className="font-mono text-xs text-muted">+{formatPrice(x.price)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div>
              <label htmlFor="urgency" className="mb-3 flex justify-between font-mono text-xs uppercase tracking-wider text-muted"><span>03 / Срочность</span><span className="text-accent">{URGENCY[u]!.label} · {URGENCY[u]!.note}</span></label>
              <input id="urgency" type="range" min={0} max={2} step={1} value={u} onChange={(e) => setU(Number(e.target.value))} className="w-full accent-[rgb(var(--accent))]" aria-valuetext={URGENCY[u]!.label} />
              <div className="mt-1 flex justify-between text-xs text-muted">{URGENCY.map((x) => <span key={x.key}>{x.label}</span>)}</div>
            </div>
          </div>

          <aside className="card-surface flex flex-col justify-between border-primary/50 p-8 shadow-glowP lg:sticky lg:top-24 lg:self-start" aria-live="polite">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-muted">Итого</p>
              <p className={cn('mt-3 font-mono text-4xl font-bold grad-text transition-opacity', isFetching && 'opacity-60')}><AnimatedPrice value={data?.total ?? 0} /></p>
              <p className="mt-3 font-mono text-xs text-muted">Срок: {data?.days ?? '—'} дн. · цена фиксируется в договоре</p>
            </div>
            <Button asChild size="lg" className="mt-8"><Link to="/contacts#order" state={{ calculator: input }}>Зафиксировать цену</Link></Button>
          </aside>
        </div>
      </div>
    </section>
  );
}
