import { useMemo, useState, type ReactNode } from 'react';
import { useForm, type FieldErrors, type Resolver } from 'react-hook-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { ZodTypeAny } from 'zod';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, Modal } from '@/components/ui/dialog';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useAdminList, useAdminMutations } from '@/lib/adminApi';
import { cn } from '@/lib/utils';
import { AdminTitle } from './AdminLayout';
import { DataTable, Toolbar, type Column, type SortState } from './DataTable';

export interface FieldDef {
  name: string; label: string; type: 'text' | 'textarea' | 'number' | 'checkbox' | 'list' | 'kv' | 'select';
  options?: [string, string][]; optional?: boolean; help?: string; placeholder?: string; full?: boolean;
}
export interface CrudConfig<T extends { id: string }> {
  entity: string; title: string; subtitle: string; createLabel: string; columns: Column<T>[]; fields: FieldDef[]; schema: ZodTypeAny;
  defaults: Record<string, unknown>; searchPlaceholder?: string;
  filters?: { name: string; label: string; options: [string, string][] }[];
  rowActions?: (row: T, patch: (p: Record<string, unknown>) => void) => ReactNode;
}
type Values = Record<string, unknown>;

// ── конвертация «значение формы ⇄ payload API» ──
const lines = (s: unknown) => String(s ?? '').split('\n').map((x) => x.trim()).filter(Boolean);
export function toForm(fields: FieldDef[], item: Values): Values {
  const out: Values = {};
  for (const f of fields) {
    const v = item[f.name];
    out[f.name] =
      f.type === 'list' ? ((v as string[] | undefined) ?? []).join('\n')
      : f.type === 'kv' ? Object.entries((v as Record<string, string> | null) ?? {}).map(([k, x]) => `${k}: ${x}`).join('\n')
      : f.type === 'checkbox' ? Boolean(v)
      : String(v ?? '');
  }
  return out;
}
export function toPayload(fields: FieldDef[], v: Values): Values {
  const out: Values = {};
  for (const f of fields) {
    const raw = v[f.name];
    if (f.type === 'checkbox') out[f.name] = Boolean(raw);
    else if (f.type === 'list') out[f.name] = lines(raw);
    else if (f.type === 'kv') {
      const rec: Record<string, string> = {};
      for (const l of lines(raw)) { const i = l.indexOf(':'); if (i > 0) rec[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
      if (Object.keys(rec).length || !f.optional) out[f.name] = rec;
    } else if (f.type === 'number') out[f.name] = String(raw ?? '').trim() === '' ? undefined : Number(raw);
    else { const s = String(raw ?? '').trim(); out[f.name] = s === '' && f.optional ? undefined : s; }
  }
  return out;
}

function EntityForm({ fields, schema, initial, onSubmit, onCancel, busy }: { fields: FieldDef[]; schema: ZodTypeAny; initial: Values; onSubmit: (p: Values) => void; onCancel: () => void; busy?: boolean }) {
  const resolver: Resolver<Values> = useMemo(() => async (values) => {
    const r = schema.safeParse(toPayload(fields, values));
    if (r.success) return { values, errors: {} };
    const errors: Record<string, { type: string; message: string }> = {};
    for (const i of r.error.issues) { const k = String(i.path[0]); errors[k] ??= { type: i.code, message: i.message }; }
    return { values: {}, errors: errors as FieldErrors<Values> };
  }, [schema, fields]);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver, defaultValues: initial });

  return (
    <form noValidate onSubmit={handleSubmit((v) => onSubmit(toPayload(fields, v)))} className="grid gap-x-4 sm:grid-cols-2">
      {fields.map((f) => {
        const err = errors[f.name]?.message as string | undefined;
        const wide = f.full || f.type === 'textarea' || f.type === 'list' || f.type === 'kv';
        return (
          <div key={f.name} className={cn(wide && 'sm:col-span-2')}>
            {f.type === 'checkbox' ? (
              <label className="mb-4 mt-2 flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5 accent-[rgb(var(--accent))]" {...register(f.name)} />{f.label}</label>
            ) : (
              <Field label={f.label} error={err}>
                {f.type === 'textarea' || f.type === 'list' || f.type === 'kv' ? <Textarea invalid={!!err} placeholder={f.placeholder ?? (f.type === 'list' ? 'По одному на строку' : f.type === 'kv' ? 'Ключ: значение — по одному на строку' : '')} {...register(f.name)} />
                  : f.type === 'select' ? <Select invalid={!!err} {...register(f.name)}>{f.options?.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
                  : <Input type={f.type === 'number' ? 'number' : 'text'} invalid={!!err} placeholder={f.placeholder} {...register(f.name)} />}
              </Field>
            )}
          </div>
        );
      })}
      <div className="mt-2 flex justify-end gap-3 sm:col-span-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Отмена</Button>
        <Button type="submit" disabled={busy}>{busy ? 'Сохраняем…' : 'Сохранить'}</Button>
      </div>
    </form>
  );
}

export function CrudPage<T extends { id: string }>({ cfg }: { cfg: CrudConfig<T> }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortState | undefined>();
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const q = useDebounce(search);

  const params = { page, limit: 10, q: q || undefined, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')) };
  const { data, isLoading } = useAdminList<T>(cfg.entity, params);
  const { create, update, remove } = useAdminMutations<T>(cfg.entity);

  const rows = useMemo(() => {
    const items = data?.items ?? [];
    if (!sort) return items;
    const get = (r: T) => (r as Record<string, unknown>)[sort.key];
    return [...items].sort((a, b) => { const x = get(a), y = get(b); const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), 'ru'); return sort.dir === 'asc' ? c : -c; });
  }, [data, sort]);

  const columns: Column<T>[] = [
    ...cfg.columns,
    { key: '_actions', header: '', className: 'w-px whitespace-nowrap text-right', cell: (r) => (
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        {cfg.rowActions?.(r, (p) => update.mutate({ id: r.id, data: p }))}
        <Button size="sm" variant="ghost" aria-label="Редактировать" onClick={() => setEditing(r)}><Pencil size={15} /></Button>
        <Button size="sm" variant="ghost" aria-label="Удалить" className="hover:text-red-400" onClick={() => setDeleting(r)}><Trash2 size={15} /></Button>
      </div>
    ) },
  ];

  const close = () => setEditing(null);
  const submit = (payload: Values) => {
    if (editing === 'new') create.mutate(payload, { onSuccess: close });
    else if (editing) { update.mutate({ id: editing.id, data: payload }); close(); }
  };

  return (
    <>
      <AdminTitle title={cfg.title} sub={cfg.subtitle} action={<Button onClick={() => setEditing('new')}><Plus size={16} />{cfg.createLabel}</Button>} />
      <Toolbar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} placeholder={cfg.searchPlaceholder}>
        {cfg.filters?.map((f) => (
          <Select key={f.name} aria-label={f.label} className="w-auto min-w-40" value={filters[f.name] ?? ''} onChange={(e) => { setFilters((s) => ({ ...s, [f.name]: e.target.value })); setPage(1); }}>
            <option value="">{f.label}: все</option>{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        ))}
      </Toolbar>
      <DataTable columns={columns} rows={rows} loading={isLoading} page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} onPage={setPage}
        sort={sort} onSort={(key) => setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : undefined) : { key, dir: 'asc' }))} />

      <Modal open={editing !== null} onOpenChange={(o) => !o && close()} title={editing === 'new' ? cfg.createLabel : 'Редактирование'} wide>
        {editing && <EntityForm key={editing === 'new' ? 'new' : editing.id} fields={cfg.fields} schema={cfg.schema} busy={create.isPending}
          initial={editing === 'new' ? cfg.defaults : toForm(cfg.fields, editing as unknown as Values)} onSubmit={submit} onCancel={close} />}
      </Modal>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Удалить запись?" text="Действие попадёт в журнал аудита. Критичные сущности удаляются мягко и могут быть восстановлены из БД." onConfirm={() => { if (deleting) remove.mutate(deleting.id); setDeleting(null); }} />
    </>
  );
}
