import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError, api } from './api';
import type { Paged } from './types';

export const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : 'Что-то пошло не так. Попробуйте ещё раз.');

type Params = Record<string, string | number | boolean | undefined>;

export const useAdminList = <T,>(entity: string, params: Params) =>
  useQuery({ queryKey: ['admin', entity, params], queryFn: () => api<Paged<T>>(`/admin/${entity}`, { query: params }), placeholderData: keepPreviousData });

type Snap<T> = [QueryKey, Paged<T> | undefined][];

/** CRUD-мутации с оптимистичными обновлениями и откатом при ошибке. */
export function useAdminMutations<T extends { id: string }>(entity: string) {
  const qc = useQueryClient();
  const key: QueryKey = ['admin', entity];
  const snapshot = async (): Promise<Snap<T>> => {
    await qc.cancelQueries({ queryKey: key });
    return qc.getQueriesData<Paged<T>>({ queryKey: key });
  };
  const patchLists = (fn: (items: T[]) => T[]) => qc.setQueriesData<Paged<T>>({ queryKey: key }, (old) => (old ? { ...old, items: fn(old.items) } : old));
  const restore = (snap?: Snap<T>) => snap?.forEach(([k, d]) => qc.setQueryData(k, d));
  const settle = () => qc.invalidateQueries({ queryKey: key });

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) => api(`/admin/${entity}`, { method: 'POST', body: data }),
    onSuccess: () => toast.success('Создано'),
    onError: (e) => toast.error(errMsg(e)),
    onSettled: settle,
  });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api(`/admin/${entity}/${id}`, { method: 'PATCH', body: data }),
    onMutate: async ({ id, data }) => { const snap = await snapshot(); patchLists((items) => items.map((i) => (i.id === id ? { ...i, ...data } : i))); return { snap }; },
    onError: (e, _v, ctx) => { restore(ctx?.snap); toast.error(errMsg(e)); },
    onSuccess: () => toast.success('Сохранено'),
    onSettled: settle,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/${entity}/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => { const snap = await snapshot(); patchLists((items) => items.filter((i) => i.id !== id)); return { snap }; },
    onError: (e, _v, ctx) => { restore(ctx?.snap); toast.error(errMsg(e)); },
    onSuccess: () => toast.success('Удалено'),
    onSettled: settle,
  });
  return { create, update, remove };
}
