import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => <div className={cn('card-surface', className)} {...p} />;
export const Badge = ({ className, ...p }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('inline-flex items-center rounded-full border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-secondary', className)} {...p} />
);
export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={cn('skeleton rounded-card', className)} />;
