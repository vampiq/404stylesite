import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Reveal } from '@/components/fx/Reveal';
import { TiltCard } from '@/components/fx/TiltCard';
import { Button } from '@/components/ui/button';
import { CardsSkeleton, EmptyState, SectionTitle } from '@/components/shared/common';
import { usePricing } from '@/lib/queries';
import { cn, formatPrice } from '@/lib/utils';

export function Pricing() {
  const { data, isLoading, isError } = usePricing();
  return (
    <section id="pricing" className="section">
      <div className="container">
        <SectionTitle eyebrow="цены" title={<>Тарифы без <span className="grad-text">звёздочек</span></>} sub="Что написано в тарифе — то и получите. Никаких «а это уже отдельно»." />
        {isLoading ? <CardsSkeleton h="h-[28rem]" /> : isError || !data?.length ? (
          <EmptyState title="Тарифы обновляются" text="Напишите нам — быстро посчитаем под вашу задачу." action={<Button asChild><Link to="/contacts#order">Запросить расчёт</Link></Button>} />
        ) : (
          <div className="grid items-stretch gap-6 md:grid-cols-3">
            {data.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.1} scale={0.94} className="h-full">
                <TiltCard className="h-full" max={5}>
                  <article className={cn('card-surface relative flex h-full flex-col p-8', p.isPopular && 'border-primary shadow-glowP md:-my-3 md:py-11')}>
                    {p.isPopular && <span className="absolute -top-3 left-8 rounded-full bg-gradient-to-r from-primary to-secondary px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white">Популярный</span>}
                    <h3 className="text-xl font-semibold">{p.name}</h3>
                    <p className="mt-1 text-sm text-muted">{p.description}</p>
                    <p className={cn('my-6 font-mono text-4xl font-bold', p.isPopular && 'grad-text')}>{formatPrice(p.price)}</p>
                    <ul className="mb-8 flex-1 space-y-3 text-sm">
                      {p.features.map((f) => <li key={f} className="flex gap-2.5"><Check size={18} className="mt-0.5 shrink-0 text-accent" />{f}</li>)}
                    </ul>
                    <Button asChild variant={p.isPopular ? 'primary' : 'secondary'} size="lg"><Link to="/contacts#order" state={{ plan: p.name }}>Выбрать «{p.name}»</Link></Button>
                  </article>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
