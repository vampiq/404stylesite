import { cn } from './utils';
import type { OrderStatus } from './types';

export const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  NEW: { label: 'Новая', cls: 'border-secondary/50 bg-secondary/10 text-secondary' },
  IN_PROGRESS: { label: 'В работе', cls: 'border-primary/50 bg-primary/10 text-primary' },
  DONE: { label: 'Готово', cls: 'border-accent/50 bg-accent/10 text-accent' },
  CANCELLED: { label: 'Отменена', cls: 'border-red-500/50 bg-red-500/10 text-red-400' },
};
export const STATUS_KEYS = Object.keys(STATUS) as OrderStatus[];

export const StatusBadge = ({ status }: { status: OrderStatus }) => (
  <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider', STATUS[status].cls)}>{STATUS[status].label}</span>
);
