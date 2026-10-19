import { useState } from 'react';
import { AdminTitle } from '@/components/admin/AdminLayout';
import { DataTable, Toolbar } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/card';
import { Select } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useAdminList } from '@/lib/adminApi';
import { formatDate } from '@/lib/utils';
import type { AuditEntry } from '@/lib/types';

const ENTITIES = ['Project', 'Service', 'PricingPlan', 'Review', 'FaqItem', 'TeamMember', 'Order', 'SiteSettings', 'User'];
const ACTIONS = ['CREATE', 'UPDATE', 'SOFT_DELETE', 'DELETE', 'STATUS_CHANGE', 'LOGIN', 'REGISTER', 'CHANGE_PASSWORD', 'REFRESH_REUSE'];

export function Component() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const q = useDebounce(search);
  const { data, isLoading } = useAdminList<AuditEntry>('audit-log', { page, limit: 20, q: q || undefined, entity: entity || undefined, action: action || undefined });
  const reset = (fn: () => void) => { fn(); setPage(1); };

  return (
    <>
      <AdminTitle title="Журнал аудита" sub="Кто, что и когда менял. Только чтение." />
      <Toolbar search={search} onSearch={(v) => reset(() => setSearch(v))} placeholder="По ID, сущности, действию…">
        <Select aria-label="Сущность" className="w-auto" value={entity} onChange={(e) => reset(() => setEntity(e.target.value))}><option value="">Сущность: все</option>{ENTITIES.map((x) => <option key={x}>{x}</option>)}</Select>
        <Select aria-label="Действие" className="w-auto" value={action} onChange={(e) => reset(() => setAction(e.target.value))}><option value="">Действие: все</option>{ACTIONS.map((x) => <option key={x}>{x}</option>)}</Select>
      </Toolbar>
      <DataTable rows={data?.items ?? []} loading={isLoading} page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} onPage={setPage} emptyText="Записей пока нет." columns={[
        { key: 'createdAt', header: 'Когда', cell: (a) => <span className="whitespace-nowrap font-mono text-xs">{formatDate(a.createdAt)}</span> },
        { key: 'user', header: 'Кто', cell: (a) => a.user ? <div>{a.user.name}<span className="block text-xs text-muted">{a.user.email}</span></div> : <span className="text-muted">система</span> },
        { key: 'action', header: 'Действие', cell: (a) => <Badge className={a.action.includes('DELETE') ? 'border-red-500/50 text-red-400' : ''}>{a.action}</Badge> },
        { key: 'entity', header: 'Объект', cell: (a) => <div>{a.entity}<span className="block font-mono text-[11px] text-muted">{a.entityId}</span></div> },
        { key: 'payload', header: 'Данные', cell: (a) => a.payload ? <details className="max-w-xs"><summary className="cursor-pointer text-xs text-secondary">показать</summary><pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-surface2 p-2 font-mono text-[11px]">{JSON.stringify(a.payload, null, 2)}</pre></details> : <span className="text-muted">—</span> },
      ]} />
    </>
  );
}
