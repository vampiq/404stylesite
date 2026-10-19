import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { AdminTitle } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/card';
import { api } from '@/lib/api';
import { errMsg } from '@/lib/adminApi';

const url = z.string().trim().url('Нужна полная ссылка с https://').or(z.literal(''));
const schema = z.object({
  email: z.string().trim().email('Некорректный email'), telegram: z.string().trim().min(2, 'Укажите ник, например @style404'), phone: z.string().trim(), hours: z.string().trim(),
  socTelegram: url, socVk: url, socGithub: url, metaTitle: z.string().trim().max(70, 'До 70 символов'), metaDescription: z.string().trim().max(170, 'До 170 символов'),
});
type Values = z.infer<typeof schema>;
interface Raw { contacts?: Record<string, string>; social?: Record<string, string>; meta?: Record<string, string> }

const fromRaw = (r: Raw): Values => ({
  email: r.contacts?.email ?? '', telegram: r.contacts?.telegram ?? '', phone: r.contacts?.phone ?? '', hours: r.contacts?.hours ?? '',
  socTelegram: r.social?.telegram ?? '', socVk: r.social?.vk ?? '', socGithub: r.social?.github ?? '', metaTitle: r.meta?.title ?? '', metaDescription: r.meta?.description ?? '',
});

export function Component() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => api<Raw>('/admin/settings') });
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<Values>({ resolver: zodResolver(schema), values: data ? fromRaw(data) : undefined });

  const save = useMutation({
    mutationFn: (v: Values) => api<Raw>('/admin/settings', { method: 'PUT', body: {
      contacts: { email: v.email, telegram: v.telegram, phone: v.phone, hours: v.hours },
      social: { telegram: v.socTelegram, vk: v.socVk, github: v.socGithub },
      meta: { title: v.metaTitle, description: v.metaDescription },
    } }),
    onSuccess: (r) => { qc.setQueryData(['admin', 'settings'], r); void qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Настройки сохранены'); },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (isLoading) return <Skeleton className="h-96" />;
  return (
    <>
      <AdminTitle title="Настройки сайта" sub="Контакты в подвале, соцсети и метатеги" />
      <form noValidate onSubmit={handleSubmit((v) => save.mutate(v))} className="grid max-w-3xl gap-6">
        <fieldset className="card-surface grid gap-x-4 p-6 sm:grid-cols-2"><legend className="sr-only">Контакты</legend><h2 className="font-semibold sm:col-span-2">Контакты</h2>
          <Field label="Email" error={errors.email?.message}><Input {...register('email')} invalid={!!errors.email} /></Field>
          <Field label="Telegram" error={errors.telegram?.message}><Input {...register('telegram')} invalid={!!errors.telegram} /></Field>
          <Field label="Телефон"><Input {...register('phone')} /></Field><Field label="Часы работы"><Input {...register('hours')} /></Field>
        </fieldset>
        <fieldset className="card-surface grid gap-x-4 p-6 sm:grid-cols-3"><legend className="sr-only">Соцсети</legend><h2 className="font-semibold sm:col-span-3">Соцсети (ссылки)</h2>
          <Field label="Telegram" error={errors.socTelegram?.message}><Input {...register('socTelegram')} invalid={!!errors.socTelegram} /></Field>
          <Field label="VK" error={errors.socVk?.message}><Input {...register('socVk')} invalid={!!errors.socVk} /></Field>
          <Field label="GitHub" error={errors.socGithub?.message}><Input {...register('socGithub')} invalid={!!errors.socGithub} /></Field>
        </fieldset>
        <fieldset className="card-surface p-6"><legend className="sr-only">Метатеги</legend><h2 className="mb-3 font-semibold">Метатеги по умолчанию</h2>
          <Field label="Title" error={errors.metaTitle?.message}><Input {...register('metaTitle')} invalid={!!errors.metaTitle} /></Field>
          <Field label="Description" error={errors.metaDescription?.message}><Textarea {...register('metaDescription')} invalid={!!errors.metaDescription} /></Field>
        </fieldset>
        <div><Button type="submit" size="lg" disabled={!isDirty || save.isPending}>{save.isPending ? 'Сохраняем…' : 'Сохранить настройки'}</Button></div>
      </form>
    </>
  );
}
