import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/common';
import { cn } from '@/lib/utils';

export interface Column<T> { key: string; header: string; sortable?: boolean; className?: string; cell?: (row: T) => ReactNode }
export interface SortState { key: string; dir: 'asc' | 'desc' }

interface Props<T extends { id: string }> {
  columns: Column<T>[]; rows: T[]; loading?: boolean; sort?: SortState; onSort?: (key: string) => void;
  page: number; pages: number; total: number; onPage: (p: number) => void; onRowClick?: (row: T) => void; emptyText?: string;
}

export function DataTable<T extends { id: string }>({ columns, rows, loading, sort, onSort, page, pages, total, onPage, onRowClick, emptyText = 'Ничего не найдено. Измените фильтры или создайте первую запись.' }: Props<T>) {
  if (!loading && rows.length === 0) return <EmptyState title="Пусто" text={emptyText} />;
  return (
    <div className="card-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line bg-surface2/50 font-mono text-xs uppercase tracking-wider text-muted">
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <th key={c.key} scope="col" className={cn('px-4 py-3 font-medium', c.className)} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                    {c.sortable && onSort ? <button onClick={() => onSort(c.key)} className="inline-flex items-center gap-1.5 hover:text-fg">{c.header}<Icon size={13} className={active ? 'text-accent' : ''} /></button> : c.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0
              ? Array.from({ length: 5 }, (_, i) => <tr key={i}><td colSpan={columns.length} className="p-3"><Skeleton className="h-8" /></td></tr>)
              : rows.map((r) => (
                  <tr key={r.id} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn('border-b border-line/60 transition-colors last:border-0 hover:bg-surface2/40', onRowClick && 'cursor-pointer')}>
                    {columns.map((c) => <td key={c.key} className={cn('px-4 py-3 align-middle', c.className)}>{c.cell ? c.cell(r) : String((r as Record<string, unknown>)[c.key] ?? '—')}</td>)}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-xs text-muted">
        <span>Всего: {total}</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Назад"><ChevronLeft size={16} /></Button>
          <span>{page} / {pages}</span>
          <Button size="sm" variant="ghost" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Вперёд"><ChevronRight size={16} /></Button>
        </div>
      </div>
    </div>
  );
}

export function Toolbar({ search, onSearch, placeholder = 'Поиск…', children }: { search: string; onSearch: (v: string) => void; placeholder?: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} aria-label="Поиск" className="pl-10" />
      </div>
      {children}
    </div>
  );
}
