import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AdminTitle } from '@/components/admin/AdminLayout';
import { DataTable, Toolbar, type SortState } from '@/components/admin/DataTable';
import { Input, Select } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/api';
import { errMsg } from '@/lib/adminApi';
import { STATUS, STATUS_KEYS } from '@/lib/status';
import { formatDate } from '@/lib/utils';
import type { Order, OrderStatus, Paged } from '@/lib/types';

export function Component() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'createdAt', dir: 'desc' });
  const q = useDebounce(search);

  const params = { page, limit: 15, q: q || undefined, status: status || undefined, from: from || undefined, to: to ? `${to}T23:59:59` : undefined, sort: sort.key, dir: sort.dir };
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'orders', params], queryFn: () => api<Paged<Order>>('/admin/orders', { query: params }), placeholderData: (p) => p, refetchInterval: 30_000 });

  const setOrderStatus = useMutation({
    mutationFn: ({ id, status: s }: { id: string; status: OrderStatus }) => api(`/admin/orders/${id}`, { method: 'PATCH', body: { status: s } }),
    onMutate: async ({ id, status: s }) => {
      await qc.cancelQueries({ queryKey: ['admin', 'orders'] });
      const snap = qc.getQueriesData<Paged<Order>>({ queryKey: ['admin', 'orders'] });
      qc.setQueriesData<Paged<Order>>({ queryKey: ['admin', 'orders'] }, (old) => old && { ...old, items: old.items.map((o) => (o.id === id ? { ...o, status: s } : o)) });
      return { snap };
    },
    onError: (e, _v, ctx) => { ctx?.snap.forEach(([k, d]) => qc.setQueryData(k, d)); toast.error(errMsg(e)); },
    onSuccess: () => toast.success('Статус обновлён'),
    onSettled: () => { void qc.invalidateQueries({ queryKey: ['admin'] }); },
  });

  const onSort = (key: string) => { setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' })); setPage(1); };
  const reset = (fn: () => void) => { fn(); setPage(1); };

  return (
    <>
      <AdminTitle title="Заявки" sub="Обновляется каждые 30 секунд" />
      <Toolbar search={search} onSearch={(v) => reset(() => setSearch(v))} placeholder="Имя, email, телефон, тип…">
        <Select aria-label="Статус" className="w-auto min-w-40" value={status} onChange={(e) => reset(() => setStatus(e.target.value))}>
          <option value="">Статус: все</option>{STATUS_KEYS.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </Select>
        <Input type="date" aria-label="С даты" className="w-auto" value={from} onChange={(e) => reset(() => setFrom(e.target.value))} />
        <Input type="date" aria-label="По дату" className="w-auto" value={to} onChange={(e) => reset(() => setTo(e.target.value))} />
      </Toolbar>
      <DataTable rows={data?.items ?? []} loading={isLoading} page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} onPage={setPage} sort={sort} onSort={onSort}
        onRowClick={(o) => navigate(`/admin/orders/${o.id}`)} emptyText="Заявок по этим фильтрам нет."
        columns={[
          { key: 'createdAt', header: 'Дата', sortable: true, cell: (o) => <span className="font-mono text-xs">{formatDate(o.createdAt)}</span> },
          { key: 'name', header: 'Клиент', sortable: true, cell: (o) => <div><span className="font-medium">{o.name}</span>{!!o.unread && <span className="ml-2 rounded-full bg-accent px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0a0a0f]">{o.unread}</span>}<span className="block text-xs text-muted">{o.email}</span></div> },
          { key: 'projectType', header: 'Проект', cell: (o) => <div>{o.projectType}<span className="block text-xs text-muted">{o.budget}</span></div> },
          { key: 'status', header: 'Статус', sortable: true, cell: (o) => (
            <div onClick={(e) => e.stopPropagation()}>
              <Select aria-label={`Статус заявки ${o.name}`} className="h-9 w-auto py-1 text-xs" value={o.status} onChange={(e) => setOrderStatus.mutate({ id: o.id, status: e.target.value as OrderStatus })}>
                {STATUS_KEYS.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
              </Select>
            </div>
          ) },
        ]} />
    </>
  );
}
