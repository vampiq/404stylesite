import { useState, type ReactNode } from 'react';
import { Reveal } from '@/components/fx/Reveal';
import { Skeleton } from '@/components/ui/card';
import { cn, gradientFor } from '@/lib/utils';

export function SectionTitle({ eyebrow, title, sub, center }: { eyebrow: string; title: ReactNode; sub?: string; center?: boolean }) {
  return (
    <Reveal className={cn('mb-12 max-w-2xl md:mb-16', center && 'mx-auto text-center')}>
      <p className="eyebrow mb-3">// {eyebrow}</p>
      <h2 className="text-3xl font-bold md:text-5xl">{title}</h2>
      {sub ? <p className="mt-4 text-lg text-muted">{sub}</p> : null}
    </Reveal>
  );
}

export function PageHeader({ eyebrow, title, sub }: { eyebrow: string; title: ReactNode; sub?: string }) {
  return (
    <header className="container pb-6 pt-16 md:pt-24">
      <p className="eyebrow mb-3">// {eyebrow}</p>
      <h1 className="max-w-4xl text-4xl font-bold md:text-6xl">{title}</h1>
      {sub ? <p className="mt-5 max-w-2xl text-lg text-muted">{sub}</p> : null}
    </header>
  );
}

/** Empty state с «потерянной» 404-иллюстрацией. */
export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card-surface flex flex-col items-center px-6 py-14 text-center">
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none" aria-hidden>
        <text x="60" y="52" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="44" fontWeight="700" fill="rgb(var(--primary))" opacity=".9">404</text>
        <text x="62" y="54" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="44" fontWeight="700" fill="rgb(var(--secondary))" opacity=".5">404</text>
        <path d="M20 68h80" stroke="rgb(var(--muted))" strokeDasharray="4 6" />
      </svg>
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      {text ? <p className="mt-2 max-w-sm text-muted">{text}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export const CardsSkeleton = ({ count = 3, h = 'h-72' }: { count?: number; h?: string }) => (
  <div className="grid gap-6 md:grid-cols-3">{Array.from({ length: count }, (_, i) => <Skeleton key={i} className={h} />)}</div>
);

/** Обложка: картинка → при ошибке/отсутствии детерминированный градиент. */
export function Cover({ src, seed, className }: { src?: string; seed: string; className?: string }) {
  const [broken, setBroken] = useState(!src);
  return broken ? (
    <div className={className} style={{ background: gradientFor(seed) }} role="img" aria-label={seed} />
  ) : (
    <img src={src} alt={seed} loading="lazy" decoding="async" onError={() => setBroken(true)} className={cn('object-cover', className)} />
  );
}
