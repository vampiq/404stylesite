import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/common';
import { Reveal } from '@/components/fx/Reveal';
import { api } from '@/lib/api';
import { StatusBadge } from '@/lib/status';
import { formatDate, formatPrice } from '@/lib/utils';
import type { Order } from '@/lib/types';

export function Component() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['me', 'orders'], queryFn: () => api<{ items: Order[] }>('/me/orders').then((r) => r.items), refetchInterval: 30_000 });

  if (isLoading) return <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>;
  if (isError) return <EmptyState title="Не удалось загрузить заказы" text="Проверьте соединение и обновите страницу." />;
  if (!data?.length) return <EmptyState title="Заказов пока нет" text="Расскажите о задаче — посчитаем и предложим сроки. Заявка сразу появится здесь." action={<Button asChild><Link to="/contacts#order">Создать заявку</Link></Button>} />;

  return (
    <ul className="space-y-4">
      {data.map((o, i) => (
        <li key={o.id}>
          <Reveal delay={i * 0.05} y={14}>
            <Link to={`/dashboard/orders/${o.id}`} className="card-surface block p-5 transition-colors hover:border-primary/60 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{o.projectType}</h2>
                  <p className="mt-1 font-mono text-xs text-muted">{formatDate(o.createdAt)} · №{o.id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-3">
                  {!!o.unread && <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 font-mono text-[11px] font-bold text-[#0a0a0f]"><MessageSquare size={12} />{o.unread}</span>}
                  <StatusBadge status={o.status} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                <span className="line-clamp-1 max-w-xl">{o.lastMessage ? `${o.lastMessage.senderRole === 'CLIENT' ? 'Вы' : '404style'}: ${o.lastMessage.text}` : 'Сообщений пока нет'}</span>
                {o.calculatorData && <span className="font-mono text-secondary">{formatPrice(o.calculatorData.total)}</span>}
              </div>
            </Link>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
