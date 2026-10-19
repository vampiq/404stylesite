import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { api, setAccessToken } from '@/lib/api';
import { errMsg } from '@/lib/adminApi';
import { maskPhone } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import type { User } from '@/lib/types';

const phoneRe = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
const profileSchema = z.object({ name: z.string().trim().min(2, 'Введите имя'), phone: z.string().refine((v) => !v || phoneRe.test(v), 'Введите телефон полностью') });
const passSchema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z.string().min(8, 'Минимум 8 символов').max(72).regex(/[A-Za-z]/, 'Нужна хотя бы одна буква').regex(/\d/, 'Нужна хотя бы одна цифра'),
});

export function Component() {
  const user = useAuth((s) => s.user)!;
  const navigate = useNavigate();

  const profile = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema), defaultValues: { name: user.name, phone: user.phone ?? '' } });
  const saveProfile = useMutation({
    mutationFn: (v: z.infer<typeof profileSchema>) => api<{ user: User }>('/auth/me', { method: 'PATCH', body: { name: v.name, phone: v.phone || null } }),
    onSuccess: (r) => { useAuth.setState({ user: r.user }); profile.reset({ name: r.user.name, phone: r.user.phone ?? '' }); toast.success('Профиль обновлён'); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const pass = useForm<z.infer<typeof passSchema>>({ resolver: zodResolver(passSchema) });
  const changePass = useMutation({
    mutationFn: (v: z.infer<typeof passSchema>) => api('/auth/change-password', { method: 'POST', body: v }),
    onSuccess: () => { // сервер отозвал все сессии — входим заново
      setAccessToken(null);
      useAuth.setState({ user: null, status: 'guest' });
      toast.success('Пароль изменён. Войдите с новым паролем.');
      navigate('/login');
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="grid max-w-4xl gap-6 md:grid-cols-2">
      <form noValidate onSubmit={profile.handleSubmit((v) => saveProfile.mutate(v))} className="card-surface p-6">
        <h2 className="mb-4 font-semibold">Профиль</h2>
        <Field label="Email"><Input value={user.email} disabled readOnly /></Field>
        <Field label="Имя" error={profile.formState.errors.name?.message}><Input autoComplete="name" invalid={!!profile.formState.errors.name} {...profile.register('name')} /></Field>
        <Field label="Телефон" error={profile.formState.errors.phone?.message}>
          <Input inputMode="tel" placeholder="+7 (___) ___-__-__" invalid={!!profile.formState.errors.phone} {...profile.register('phone', { onChange: (e) => { e.target.value = e.target.value ? maskPhone(e.target.value) : ''; } })} />
        </Field>
        <Button type="submit" disabled={!profile.formState.isDirty || saveProfile.isPending}>{saveProfile.isPending ? 'Сохраняем…' : 'Сохранить'}</Button>
      </form>

      <form noValidate onSubmit={pass.handleSubmit((v) => changePass.mutate(v))} className="card-surface p-6">
        <h2 className="mb-4 font-semibold">Смена пароля</h2>
        <Field label="Текущий пароль" error={pass.formState.errors.currentPassword?.message}><Input type="password" autoComplete="current-password" invalid={!!pass.formState.errors.currentPassword} {...pass.register('currentPassword')} /></Field>
        <Field label="Новый пароль" error={pass.formState.errors.newPassword?.message}><Input type="password" autoComplete="new-password" invalid={!!pass.formState.errors.newPassword} {...pass.register('newPassword')} /></Field>
        <p className="mb-4 text-xs text-muted">После смены мы завершим все активные сессии на всех устройствах.</p>
        <Button type="submit" variant="secondary" disabled={changePass.isPending}>{changePass.isPending ? 'Меняем…' : 'Сменить пароль'}</Button>
      </form>
    </div>
  );
}
