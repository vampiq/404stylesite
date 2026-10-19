import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/fx/Reveal';
import { TiltCard } from '@/components/fx/TiltCard';
import { Badge } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardsSkeleton, Cover, EmptyState, SectionTitle } from '@/components/shared/common';
import { useProjects } from '@/lib/queries';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/types';

function ProjectCard({ p, i }: { p: Project; i: number }) {
  const metrics = Object.entries(p.resultMetrics ?? {}).slice(0, 2);
  return (
    <Reveal delay={(i % 3) * 0.1}>
      <TiltCard>
        <Link to={`/portfolio/${p.slug}`} className="card-surface group relative block overflow-hidden transition-colors hover:border-primary/60">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Cover src={p.coverImage} seed={p.title} className="h-full w-full transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 flex flex-col justify-end gap-2 bg-gradient-to-t from-bg/95 via-bg/50 to-transparent p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 max-md:opacity-100">
              {metrics.map(([k, v]) => <div key={k} className="flex items-baseline justify-between font-mono text-xs"><span className="text-muted">{k}</span><span className="text-sm font-semibold text-accent">{v}</span></div>)}
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between"><Badge>{p.category}</Badge><span className="font-mono text-xs text-muted">{p.year}</span></div>
            <h3 className="mt-4 text-xl font-semibold">{p.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{p.clientName}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-all group-hover:gap-3">Смотреть кейс <ArrowUpRight size={16} /></span>
          </div>
        </Link>
      </TiltCard>
    </Reveal>
  );
}

export function Projects({ limit, filterable = false }: { limit?: number; filterable?: boolean }) {
  const [params, setParams] = useSearchParams();
  const category = filterable ? params.get('category') ?? undefined : undefined;
  const { data, isLoading, isError } = useProjects({ category });
  const items = limit ? data?.items.slice(0, limit) : data?.items;

  const pick = (c?: string) => setParams(c ? { category: c } : {}, { replace: true });

  return (
    <section id="portfolio" className="section">
      <div className="container">
        {!filterable && <SectionTitle eyebrow="портфолио" title={<>Работы, за которые <span className="grad-text">не стыдно</span></>} sub="Реальные проекты с реальными цифрами. Кликайте — расскажем, как делали." />}
        {filterable && data && data.categories.length > 1 ? (
          <div className="mb-10 flex flex-wrap gap-2" role="tablist" aria-label="Фильтр по категориям">
            {[undefined, ...data.categories].map((c) => (
              <button key={c ?? 'all'} role="tab" aria-selected={category === c} onClick={() => pick(c)} className={cn('rounded-full border px-4 py-2 text-sm transition', category === c ? 'border-accent bg-accent text-[#0a0a0f]' : 'border-line text-muted hover:border-secondary hover:text-fg')}>
                {c ?? 'Все'}
              </button>
            ))}
          </div>
        ) : null}
        {isLoading ? <CardsSkeleton h="h-96" /> : isError || !items?.length ? (
          <EmptyState title="Здесь пока пусто" text="В этой категории кейсов нет. Но мы уже делаем следующий." action={filterable ? <Button variant="secondary" onClick={() => pick()}>Показать все</Button> : undefined} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map((p, i) => <ProjectCard key={p.id} p={p} i={i} />)}</div>
        )}
        {limit && items?.length ? <div className="mt-12 text-center"><Button asChild variant="secondary" size="lg"><Link to="/portfolio">Все кейсы</Link></Button></div> : null}
      </div>
    </section>
  );
}
