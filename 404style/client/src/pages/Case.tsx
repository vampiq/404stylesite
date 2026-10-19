import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Seo, breadcrumbLd } from '@/lib/seo';
import { ApiError } from '@/lib/api';
import { clean } from '@/lib/sanitize';
import { useProject } from '@/lib/queries';
import { Reveal } from '@/components/fx/Reveal';
import { Badge, Skeleton } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cover, EmptyState } from '@/components/shared/common';
import { OrderCta } from '@/components/sections/OrderCta';

export function Component() {
  const { slug } = useParams();
  const { data: p, isLoading, error } = useProject(slug);

  if (isLoading) return <div className="container space-y-6 py-20"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-96" /></div>;
  if (!p) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <div className="container py-24">
        <Seo title="Кейс не найден" noindex />
        <EmptyState title={missing ? 'Такого кейса нет' : 'Не удалось загрузить кейс'} text={missing ? 'Возможно, он переехал или ещё не опубликован.' : 'Проверьте соединение и обновите страницу.'} action={<Button asChild variant="secondary"><Link to="/portfolio">К портфолио</Link></Button>} />
      </div>
    );
  }

  const metrics = Object.entries(p.resultMetrics ?? {});
  const html = clean(p.description.replace(/\n/g, '<br/>'));

  return (
    <article>
      <Seo title={p.title} description={p.description.slice(0, 155)} image={p.coverImage || undefined} jsonLd={[breadcrumbLd([{ name: 'Главная', path: '/' }, { name: 'Портфолио', path: '/portfolio' }, { name: p.title, path: `/portfolio/${p.slug}` }])]} />
      <div className="container pt-12">
        <nav aria-label="Хлебные крошки" className="mb-8 flex items-center gap-2 font-mono text-xs text-muted">
          <Link to="/portfolio" className="flex items-center gap-1 hover:text-fg"><ArrowLeft size={14} />Портфолио</Link><span>/</span><span className="text-fg">{p.title}</span>
        </nav>
        <header className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3"><Badge>{p.category}</Badge><span className="font-mono text-xs text-muted">{p.clientName} · {p.year}</span></div>
          <h1 className="mt-4 text-4xl font-bold md:text-6xl">{p.title}</h1>
        </header>
        <Reveal className="mt-10 overflow-hidden rounded-card border border-line"><Cover src={p.coverImage} seed={p.title} className="aspect-[16/8] w-full" /></Reveal>

        {metrics.length > 0 && (
          <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(([k, v], i) => (
              <Reveal key={k} delay={i * 0.08}><div className="card-surface p-6"><dd className="font-mono text-3xl font-bold grad-text">{v}</dd><dt className="mt-1 text-sm text-muted">{k}</dt></div></Reveal>
            ))}
          </dl>
        )}

        <div className="mt-12 grid gap-10 lg:grid-cols-3">
          <div className="prose-none lg:col-span-2"><h2 className="mb-4 text-2xl font-bold">Задача и решение</h2><div className="text-lg leading-relaxed text-muted" dangerouslySetInnerHTML={{ __html: html }} /></div>
          <aside><p className="eyebrow mb-3">Стек и теги</p><div className="flex flex-wrap gap-2">{p.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div></aside>
        </div>

        {p.images.length > 0 && <div className="mt-12 grid gap-6 md:grid-cols-2">{p.images.map((src, i) => <Reveal key={src}><Cover src={src} seed={`${p.title} ${i + 1}`} className="aspect-video w-full rounded-card border border-line" /></Reveal>)}</div>}
      </div>
      <OrderCta />
    </article>
  );
}
