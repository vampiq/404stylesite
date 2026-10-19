import { Link } from 'react-router-dom';
import { ArrowUpRight, Building2, Code2, Palette, Rocket, ShoppingCart, Sparkles, Zap, type LucideIcon } from 'lucide-react';
import { Reveal } from '@/components/fx/Reveal';
import { TiltCard } from '@/components/fx/TiltCard';
import { CardsSkeleton, EmptyState, SectionTitle } from '@/components/shared/common';
import { Seo, serviceLd } from '@/lib/seo';
import { useServices } from '@/lib/queries';
import { formatPrice } from '@/lib/utils';

const ICONS: Record<string, LucideIcon> = { rocket: Rocket, 'shopping-cart': ShoppingCart, 'building-2': Building2, code: Code2, palette: Palette, zap: Zap };

export function Services({ detailed = false }: { detailed?: boolean }) {
  const { data, isLoading, isError } = useServices();
  return (
    <section id="services" className="section">
      {data?.length ? <Seo jsonLd={serviceLd(data)} /> : null}
      <div className="container">
        <SectionTitle eyebrow="услуги" title={<>Три способа <span className="grad-text">не потеряться</span> в интернете</>} sub="Берём задачу целиком: стратегия, дизайн, код, запуск. Вы получаете работающий сайт, а не набор макетов." />
        {isLoading ? <CardsSkeleton /> : isError || !data?.length ? (
          <EmptyState title="Услуги скоро появятся" text="Список обновляется. Загляните позже или напишите нам напрямую." />
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {data.map((s, i) => {
              const Icon = ICONS[s.icon] ?? Sparkles;
              return (
                <Reveal key={s.id} delay={i * 0.1}>
                  <TiltCard className="group h-full">
                    <article className="card-surface flex h-full flex-col p-8 transition-colors hover:border-primary/60 hover:shadow-glowP">
                      <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"><Icon /></div>
                      <h3 className="text-xl font-semibold">{s.title}</h3>
                      <p className="mt-2 text-muted">{s.description}</p>
                      {detailed && s.features.length > 0 ? (
                        <ul className="mt-5 space-y-2 text-sm">{s.features.map((f) => <li key={f} className="flex gap-2"><span className="text-accent">▹</span>{f}</li>)}</ul>
                      ) : null}
                      <div className="mt-auto flex items-center justify-between pt-8">
                        <span className="font-mono text-sm text-secondary">от {formatPrice(s.priceFrom)}</span>
                        <Link to="/contacts#order" aria-label={`Заказать: ${s.title}`} className="grid h-10 w-10 place-items-center rounded-full border border-line transition group-hover:border-accent group-hover:text-accent"><ArrowUpRight size={18} /></Link>
                      </div>
                    </article>
                  </TiltCard>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
