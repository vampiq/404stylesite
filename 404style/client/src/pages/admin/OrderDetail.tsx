import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { AdminTitle } from '@/components/admin/AdminLayout';
import { OrderChat } from '@/components/shared/OrderChat';
import { EmptyState } from '@/components/shared/common';
import { Select } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { errMsg } from '@/lib/adminApi';
import { STATUS, STATUS_KEYS } from '@/lib/status';
import { formatDate, formatPrice } from '@/lib/utils';
import type { Order, OrderStatus } from '@/lib/types';

const Row = ({ k, v }: { k: string; v?: React.ReactNode }) => v ? <div className="flex justify-between gap-4 border-b border-line/60 py-2.5 text-sm last:border-0"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div> : null;

export function Component() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const key = ['admin', 'order', id];
  const { data: o, isLoading, isError } = useQuery({ queryKey: key, queryFn: () => api<{ item: Order }>(`/admin/orders/${id}`).then((r) => r.item), retry: false });

  const setStatus = useMutation({
    mutationFn: (status: OrderStatus) => api(`/admin/orders/${id}`, { method: 'PATCH', body: { status } }),
    onMutate: async (status) => { await qc.cancelQueries({ queryKey: key }); const prev = qc.getQueryData<Order>(key); qc.setQueryData<Order>(key, (old) => old && { ...old, status }); return { prev }; },
    onError: (e, _s, ctx) => { qc.setQueryData(key, ctx?.prev); toast.error(errMsg(e)); },
    onSuccess: () => toast.success('Статус обновлён'),
    onSettled: () => { void qc.invalidateQueries({ queryKey: ['admin'] }); },
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-96" /></div>;
  if (isError || !o) return <EmptyState title="Заказ не найден" text="Возможно, он удалён." action={<Button asChild variant="secondary"><Link to="/admin/orders">К заявкам</Link></Button>} />;
  const c = o.calculatorData;

  return (
    <>
      <Link to="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 font-mono text-xs text-muted hover:text-fg"><ArrowLeft size={14} />Заявки</Link>
      <AdminTitle title={o.name} sub={`Создана ${formatDate(o.createdAt)}`} action={
        <Select aria-label="Статус" className="w-auto min-w-44" value={o.status} onChange={(e) => setStatus.mutate(e.target.value as OrderStatus)}>{STATUS_KEYS.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}</Select>
      } />
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-2">
          <section className="card-surface p-5">
            <h2 className="mb-2 font-semibold">Контакты</h2>
            <div className="mb-3 flex flex-wrap gap-3 text-sm">
              <a href={`mailto:${o.email}`} className="inline-flex items-center gap-2 text-secondary hover:underline"><Mail size={15} />{o.email}</a>
              <a href={`tel:${o.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2 text-secondary hover:underline"><Phone size={15} />{o.phone}</a>
            </div>
            <dl><Row k="Аккаунт" v={o.user ? o.user.name : 'Гость'} /><Row k="Тип проекта" v={o.projectType} /><Row k="Бюджет" v={o.budget} /><Row k="Сроки" v={o.deadline} /></dl>
          </section>
          {o.message && <section className="card-surface p-5"><h2 className="mb-2 font-semibold">Сообщение клиента</h2><p className="whitespace-pre-wrap text-sm text-muted">{o.message}</p></section>}
          {c && (
            <section className="card-surface p-5">
              <h2 className="mb-2 font-semibold">Расчёт из калькулятора</h2>
              <dl><Row k="Тип" v={c.type} /><Row k="База" v={formatPrice(c.base)} />
                {c.extras.map((e) => <Row key={e.key} k={`+ ${e.key}`} v={formatPrice(e.price)} />)}
                <Row k="Срочность" v={`${c.urgency} · ×${c.multiplier} · ${c.days} дн.`} /><Row k="Итого" v={<span className="font-mono text-accent">{formatPrice(c.total)}</span>} /></dl>
            </section>
          )}
        </div>
        <div className="xl:col-span-3"><OrderChat orderId={o.id} mode="admin" closed={o.status === 'CANCELLED'} /></div>
      </div>
    </>
  );
}
