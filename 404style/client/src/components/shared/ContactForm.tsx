import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';
import { ApiError, api } from '@/lib/api';

const schema = z.object({
  name: z.string().trim().min(2, 'Введите имя'),
  email: z.string().trim().email('Некорректный email'),
  message: z.string().trim().min(10, 'Минимум 10 символов').max(2000),
  website: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export function ContactForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: { website: '' } });
  const send = useMutation({
    mutationFn: (v: Values) => api('/contact', { method: 'POST', body: { ...v, source: 'contacts-page' } }),
    onSuccess: () => { toast.success('Сообщение отправлено. Ответим на почту в течение дня.'); reset(); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Не удалось отправить сообщение'),
  });
  return (
    <form noValidate onSubmit={handleSubmit((v) => send.mutate(v))} className="card-surface space-y-1 p-6 md:p-8">
      <Field label="Имя" error={errors.name?.message}><Input autoComplete="name" invalid={!!errors.name} {...register('name')} /></Field>
      <Field label="Email" error={errors.email?.message}><Input type="email" autoComplete="email" invalid={!!errors.email} {...register('email')} /></Field>
      <Field label="Вопрос" error={errors.message?.message}><Textarea invalid={!!errors.message} {...register('message')} /></Field>
      <input tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" {...register('website')} />
      <Button type="submit" size="lg" className="w-full" disabled={send.isPending}>{send.isPending ? 'Отправляем…' : 'Задать вопрос'}</Button>
    </form>
  );
}
