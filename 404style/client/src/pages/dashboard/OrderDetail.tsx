import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Star } from 'lucide-react';
import { toast } from 'sonner';
import { OrderChat } from '@/components/shared/OrderChat';
import { EmptyState } from '@/components/shared/common';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/card';
import { api } from '@/lib/api';
import { errMsg } from '@/lib/adminApi';
import { STATUS, StatusBadge } from '@/lib/status';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import type { Order, OrderStatus } from '@/lib/types';

const FLOW: OrderStatus[] = ['NEW', 'IN_PROGRESS', 'DONE'];

function Timeline({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED') return <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">Заказ отменён. Если это ошибка — напишите менеджеру, но чат закрыт: создайте новую заявку.</p>;
  const idx = FLOW.indexOf(status);
  return (
    <ol className="flex items-center" aria-label="Статус заказа">
      {FLOW.map((s, i) => (
        <li key={s} className={cn('flex items-center', i < FLOW.length - 1 && 'flex-1')} aria-current={i === idx ? 'step' : undefined}>
          <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full border font-mono text-xs', i <= idx ? 'border-accent bg-accent text-[#0a0a0f]' : 'border-line text-muted')}>{i < idx ? <Check size={16} /> : i + 1}</span>
          <span className={cn('ml-2 hidden text-sm sm:block', i === idx ? 'font-semibold' : 'text-muted')}>{STATUS[s].label}</span>
          {i < FLOW.length - 1 && <span className={cn('mx-3 h-px flex-1', i < idx ? 'bg-accent' : 'bg-line')} />}
        </li>
      ))}
    </ol>
  );
}

function ReviewForm({ orderId, onDone }: { orderId: string; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [company, setCompany] = useState('');
  const send = useMutation({
    mutationFn: () => api('/me/reviews', { method: 'POST', body: { orderId, rating, text: text.trim(), authorCompany: company.trim() || undefined } }),
    onSuccess: () => { toast.success('Спасибо! Отзыв появится на сайте после модерации.'); onDone(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const short = text.trim().length < 20;
  return (
    <section className="card-surface p-6" aria-label="Оставить отзыв">
      <h2 className="font-semibold">Проект готов — как вам результат?</h2>
      <div className="my-3 flex gap-1" role="radiogroup" aria-label="Оценка">
        {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} из 5`} onClick={() => setRating(n)}><Star size={26} className={n <= rating ? 'fill-accent text-accent' : 'text-line'} /></button>)}
      </div>
      <Field label="Компания (необязательно)"><Input value={company} maxLength={80} onChange={(e) => setCompany(e.target.value)} /></Field>
      <Field label="Отзыв" error={text && short ? 'Минимум 20 символов' : undefined}><Textarea value={text} maxLength={1500} onChange={(e) => setText(e.target.value)} placeholder="Что понравилось, что получилось, кому бы порекомендовали" /></Field>
      <Button disabled={short || send.isPending} onClick={() => send.mutate()}>{send.isPending ? 'Отправляем…' : 'Отправить отзыв'}</Button>
    </section>
  );
}

export function Component() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const { data: o, isLoading, isError } = useQuery({ queryKey: ['me', 'order', id], queryFn: () => api<{ item: Order }>(`/me/orders/${id}`).then((r) => r.item), retry: false, refetchInterval: 30_000 });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-12" /><Skeleton className="h-96" /></div>;
  if (isError || !o) return <EmptyState title="Заказ не найден" text="Он не существует или принадлежит другому аккаунту." action={<Button asChild variant="secondary"><Link to="/dashboard">К заказам</Link></Button>} />;
  const c = o.calculatorData;
  const review = o.reviews?.[0];

  return (
    <div className="space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 font-mono text-xs text-muted hover:text-fg"><ArrowLeft size={14} />Все заказы</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-2xl font-bold">{o.projectType}</h2><p className="font-mono text-xs text-muted">{formatDate(o.createdAt)} · №{o.id.slice(-6).toUpperCase()}</p></div>
        <StatusBadge status={o.status} />
      </div>
      <div className="card-surface p-6"><Timeline status={o.status} /></div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <section className="card-surface p-5">
            <h3 className="mb-3 font-semibold">Детали</h3>
            <dl className="space-y-2 text-sm">
              {[['Бюджет', o.budget], ['Сроки', o.deadline], ['Телефон', o.phone], ['Email', o.email]].map(([k, v]) => v ? <div key={k} className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="text-right">{v}</dd></div> : null)}
              {c && <div className="flex justify-between gap-4 border-t border-line pt-2"><dt className="text-muted">Расчёт</dt><dd className="font-mono text-accent">{formatPrice(c.total)}</dd></div>}
            </dl>
          </section>
          {o.message && <section className="card-surface p-5"><h3 className="mb-2 font-semibold">Ваше описание</h3><p className="whitespace-pre-wrap text-sm text-muted">{o.message}</p></section>}
          {o.status === 'DONE' && (review ? <p className="card-surface p-5 text-sm text-muted">{review.isApproved ? 'Ваш отзыв опубликован на сайте. Спасибо!' : 'Ваш отзыв на модерации.'}</p> : <ReviewForm orderId={o.id} onDone={() => void qc.invalidateQueries({ queryKey: ['me', 'order', id] })} />)}
        </div>
        <div className="lg:col-span-3"><OrderChat orderId={o.id} mode="client" closed={o.status === 'CANCELLED'} /></div>
      </div>
    </div>
  );
}
