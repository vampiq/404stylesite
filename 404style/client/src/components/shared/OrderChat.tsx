import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/card';
import { api } from '@/lib/api';
import { errMsg } from '@/lib/adminApi';
import { cn, formatDate } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import type { Message } from '@/lib/types';

/** Чат по заказу. mode=client → /me, mode=admin → /admin. Опрос каждые 8 с + оптимистичная отправка. */
export function OrderChat({ orderId, mode, closed }: { orderId: string; mode: 'client' | 'admin'; closed?: boolean }) {
  const base = mode === 'admin' ? '/admin' : '/me';
  const key = ['messages', mode, orderId];
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const [text, setText] = useState('');
  const box = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => api<{ items: Message[] }>(`${base}/orders/${orderId}/messages`).then((r) => r.items), refetchInterval: 8000 });
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [data?.length]);

  const send = useMutation({
    mutationFn: (t: string) => api<{ item: Message }>(`${base}/orders/${orderId}/messages`, { method: 'POST', body: { text: t } }),
    onMutate: async (t) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Message[]>(key);
      const temp: Message = { id: `tmp-${Date.now()}`, orderId, senderId: user?.id ?? null, senderRole: user?.role ?? 'CLIENT', text: t, createdAt: new Date().toISOString(), isRead: false, sender: { name: user?.name ?? '' } };
      qc.setQueryData<Message[]>(key, [...(prev ?? []), temp]);
      setText('');
      return { prev };
    },
    onError: (e, t, ctx) => { qc.setQueryData(key, ctx?.prev); setText(t); toast.error(errMsg(e)); },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  const mine = (m: Message) => (mode === 'admin' ? m.senderRole !== 'CLIENT' : m.senderRole === 'CLIENT');
  const submit = () => { const t = text.trim(); if (t && !send.isPending) send.mutate(t); };

  return (
    <section aria-label="Чат по заказу" className="card-surface flex h-[32rem] flex-col">
      <div ref={box} className="flex-1 space-y-3 overflow-y-auto p-5" aria-live="polite">
        {isLoading ? <Skeleton className="h-16" /> : !data?.length ? (
          <p className="mt-16 text-center text-sm text-muted">Сообщений пока нет. {mode === 'client' ? 'Напишите менеджеру — ответим в течение рабочего дня.' : 'Напишите клиенту первым.'}</p>
        ) : data.map((m) => (
          <div key={m.id} className={cn('flex', mine(m) ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[85%] rounded-2xl px-4 py-2.5 text-sm', mine(m) ? 'rounded-br-md bg-primary/20' : 'rounded-bl-md bg-surface2', m.id.startsWith('tmp-') && 'opacity-60')}>
              <p className="whitespace-pre-wrap break-words">{m.text}</p>
              <p className="mt-1 font-mono text-[10px] text-muted">{m.sender?.name ?? (m.senderRole === 'CLIENT' ? 'Клиент' : '404style')} · {formatDate(m.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
      {closed ? <p className="border-t border-line p-4 text-center text-sm text-muted">Заказ отменён — чат закрыт.</p> : (
        <form className="flex items-end gap-3 border-t border-line p-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} rows={1} aria-label="Сообщение" placeholder="Сообщение… (Enter — отправить, Shift+Enter — перенос)" className="min-h-11 resize-none"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} />
          <Button type="submit" size="md" disabled={!text.trim() || send.isPending} aria-label="Отправить"><Send size={16} /></Button>
        </form>
      )}
    </section>
  );
}
