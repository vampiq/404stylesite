import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, CreditCard, ExternalLink, HelpCircle, Inbox, Layers, LayoutDashboard, LogOut, Menu, Moon, ScrollText, Settings, Star, Sun, Users, X, type LucideIcon } from 'lucide-react';
import { Seo } from '@/lib/seo';
import { Glitch } from '@/components/fx/Glitch';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/store/theme';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types';

const ITEMS: { to: string; label: string; Icon: LucideIcon; roles: Role[]; end?: boolean }[] = [
  { to: '/admin', label: 'Дашборд', Icon: LayoutDashboard, roles: ['ADMIN'], end: true },
  { to: '/admin/orders', label: 'Заявки', Icon: Inbox, roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin/projects', label: 'Кейсы', Icon: Briefcase, roles: ['ADMIN'] },
  { to: '/admin/services', label: 'Услуги', Icon: Layers, roles: ['ADMIN'] },
  { to: '/admin/pricing', label: 'Тарифы', Icon: CreditCard, roles: ['ADMIN'] },
  { to: '/admin/reviews', label: 'Отзывы', Icon: Star, roles: ['ADMIN'] },
  { to: '/admin/faq', label: 'FAQ', Icon: HelpCircle, roles: ['ADMIN'] },
  { to: '/admin/team', label: 'Команда', Icon: Users, roles: ['ADMIN'] },
  { to: '/admin/settings', label: 'Настройки', Icon: Settings, roles: ['ADMIN'] },
  { to: '/admin/audit', label: 'Аудит', Icon: ScrollText, roles: ['ADMIN'] },
];

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => window.scrollTo({ top: 0 }), [pathname]);

  const items = ITEMS.filter((i) => user && i.roles.includes(user.role));
  const nav = (
    <nav aria-label="Админ-навигация" className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
      {items.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition', isActive ? 'bg-primary/15 text-primary shadow-[inset_2px_0_0_rgb(var(--primary))]' : 'text-muted hover:bg-surface2 hover:text-fg')}>
          <Icon size={18} />{label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-bg">
      <Seo title="Админ-панель" noindex />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-line px-6 font-display text-xl font-bold"><Glitch>404style</Glitch><span className="ml-2 font-mono text-[10px] text-muted">ADMIN</span></div>
        {nav}
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-bg/80 px-4 backdrop-blur-xl md:px-8">
          <button className="grid h-10 w-10 place-items-center rounded-full border border-line lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Меню" aria-expanded={open}>{open ? <X size={18} /> : <Menu size={18} />}</button>
          <p className="hidden text-sm text-muted lg:block">{user?.name} · <span className="font-mono text-xs uppercase text-secondary">{user?.role}</span></p>
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm text-muted transition hover:border-secondary hover:text-secondary"><ExternalLink size={15} />На сайт</Link>
            <button onClick={toggle} aria-label="Сменить тему" className="grid h-10 w-10 place-items-center rounded-full border border-line hover:border-secondary">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
            <button onClick={async () => { await logout(); navigate('/login'); }} aria-label="Выйти" className="grid h-10 w-10 place-items-center rounded-full border border-line hover:border-red-500 hover:text-red-400"><LogOut size={17} /></button>
          </div>
        </header>
        {open && <div className="border-b border-line bg-surface lg:hidden">{nav}</div>}
        <main className="p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}

export function AdminTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="font-display text-2xl font-bold md:text-3xl">{title}</h1>{sub && <p className="mt-1 text-sm text-muted">{sub}</p>}</div>
      {action}
    </div>
  );
}
export { AdminLayout as Component };
