import { useState, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Seo } from '@/lib/seo';
import { ApiError } from '@/lib/api';
import { maskPhone } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Glitch } from '@/components/fx/Glitch';

function Shell({ title, sub, children, footer }: { title: string; sub: string; children: ReactNode; footer: ReactNode }) {
  return (
    <section className="container grid min-h-[80vh] place-items-center py-16">
      <div className="w-full max-w-md">
        <Seo title={title} noindex />
        <p className="mb-2 text-center font-display text-2xl font-bold"><Glitch>404style</Glitch></p>
        <div className="card-surface p-8 shadow-glowP">
          <h1 className="text-2xl font-bold">{title}</h1><p className="mb-6 mt-1 text-sm text-muted">{sub}</p>
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
      </div>
    </section>
  );
}

function useAfterAuth() {
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  return () => {
    const role = useAuth.getState().user?.role;
    navigate(from ?? (role === 'CLIENT' ? '/dashboard' : '/admin'), { replace: true });
  };
}

const loginSchema = z.object({ email: z.string().trim().email('Некорректный email'), password: z.string().min(1, 'Введите пароль') });
export function Login() {
  const { status, user, login } = useAuth();
  const done = useAfterAuth();
  const [err, setErr] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  if (status === 'authed' && user) return <Navigate to={user.role === 'CLIENT' ? '/dashboard' : '/admin'} replace />;
  return (
    <Shell title="С возвращением" sub="Войдите, чтобы следить за проектом и писать менеджеру." footer={<>Нет аккаунта? <Link to="/register" className="text-accent hover:underline">Зарегистрироваться</Link></>}>
      <form noValidate className="space-y-1" onSubmit={handleSubmit(async (v) => { setErr(''); try { await login(v.email, v.password); done(); } catch (e) { setErr(e instanceof ApiError ? e.message : 'Ошибка входа'); } })}>
        <Field label="Email" error={errors.email?.message}><Input type="email" autoComplete="email" invalid={!!errors.email} {...register('email')} /></Field>
        <Field label="Пароль" error={errors.password?.message}><Input type="password" autoComplete="current-password" invalid={!!errors.password} {...register('password')} /></Field>
        {err && <p role="alert" className="pb-2 text-sm text-red-400">{err}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Входим…' : 'Войти'}</Button>
      </form>
    </Shell>
  );
}

const regSchema = z.object({
  name: z.string().trim().min(2, 'Введите имя'),
  email: z.string().trim().email('Некорректный email'),
  phone: z.string().optional().refine((v) => !v || /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(v), 'Введите телефон полностью'),
  password: z.string().min(8, 'Минимум 8 символов').max(72).regex(/[A-Za-z]/, 'Нужна хотя бы одна буква').regex(/\d/, 'Нужна хотя бы одна цифра'),
});
export function Register() {
  const { status, user, register: signUp } = useAuth();
  const done = useAfterAuth();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<z.infer<typeof regSchema>>({ resolver: zodResolver(regSchema) });
  if (status === 'authed' && user) return <Navigate to="/dashboard" replace />;
  return (
    <Shell title="Создать аккаунт" sub="Личный кабинет: статус заказа, чат с менеджером, отзывы." footer={<>Уже есть аккаунт? <Link to="/login" className="text-accent hover:underline">Войти</Link></>}>
      <form noValidate className="space-y-1" onSubmit={handleSubmit(async (v) => {
        try { await signUp({ name: v.name, email: v.email, password: v.password, phone: v.phone || undefined }); toast.success('Добро пожаловать!'); done(); }
        catch (e) { if (e instanceof ApiError && e.status === 409) setError('email', { message: e.message }); else toast.error(e instanceof ApiError ? e.message : 'Не удалось зарегистрироваться'); }
      })}>
        <Field label="Имя" error={errors.name?.message}><Input autoComplete="name" invalid={!!errors.name} {...register('name')} /></Field>
        <Field label="Email" error={errors.email?.message}><Input type="email" autoComplete="email" invalid={!!errors.email} {...register('email')} /></Field>
        <Field label="Телефон (необязательно)" error={errors.phone?.message}><Input inputMode="tel" placeholder="+7 (___) ___-__-__" invalid={!!errors.phone} {...register('phone', { onChange: (e) => { e.target.value = e.target.value ? maskPhone(e.target.value) : ''; } })} /></Field>
        <Field label="Пароль" error={errors.password?.message}><Input type="password" autoComplete="new-password" invalid={!!errors.password} {...register('password')} /></Field>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Создаём…' : 'Создать аккаунт'}</Button>
      </form>
    </Shell>
  );
}

export { Login as Component };
