import { NavLink, Outlet } from 'react-router-dom';
import { Seo } from '@/lib/seo';
import { useAuth } from '@/store/auth';
import { cn } from '@/lib/utils';

export function Component() {
  const user = useAuth((s) => s.user);
  return (
    <div className="container py-12 md:py-16">
      <Seo title="Личный кабинет" noindex />
      <p className="eyebrow mb-2">// личный кабинет</p>
      <h1 className="text-3xl font-bold md:text-4xl">Привет, <span className="grad-text">{user?.name.split(' ')[0]}</span></h1>
      <nav aria-label="Разделы кабинета" className="mb-10 mt-6 inline-flex rounded-full border border-line p-1">
        {[['/dashboard', 'Заказы', true], ['/dashboard/profile', 'Профиль', false]].map(([to, label, end]) => (
          <NavLink key={String(to)} to={String(to)} end={Boolean(end)} className={({ isActive }) => cn('rounded-full px-5 py-2 text-sm font-medium transition', isActive ? 'bg-accent text-[#0a0a0f]' : 'text-muted hover:text-fg')}>{label}</NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
