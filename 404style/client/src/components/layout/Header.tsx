import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { Glitch } from '@/components/fx/Glitch';
import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/fx/Magnetic';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/store/theme';
import { cn } from '@/lib/utils';

export const NAV = [
  { to: '/services', label: 'Услуги' },
  { to: '/portfolio', label: 'Портфолио' },
  { to: '/calculator', label: 'Калькулятор' },
  { to: '/pricing', label: 'Цены' },
  { to: '/about', label: 'О студии' },
  { to: '/contacts', label: 'Контакты' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { theme, toggle } = useTheme();
  const user = useAuth((s) => s.user);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const cabinet = user ? (user.role === 'CLIENT' ? '/dashboard' : '/admin') : '/login';

  return (
    <header className={cn('fixed inset-x-0 top-0 z-50 border-b transition-colors', scrolled || open ? 'border-line bg-bg/75 backdrop-blur-xl' : 'border-transparent')}>
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label="404style — на главную" className="font-display text-xl font-bold">
          <Glitch>404style</Glitch>
        </Link>

        <nav aria-label="Основная навигация" className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => cn('text-sm transition-colors hover:text-fg', isActive ? 'text-fg' : 'text-muted')}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={toggle} aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'} className="grid h-10 w-10 place-items-center rounded-full border border-line transition hover:border-secondary hover:text-secondary">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link to={cabinet} className="hidden text-sm text-muted transition hover:text-fg sm:block">{user ? 'Кабинет' : 'Войти'}</Link>
          <div className="hidden sm:block">
            <Magnetic><Button asChild size="sm"><Link to="/contacts#order">Обсудить проект</Link></Button></Magnetic>
          </div>
          <button onClick={() => setOpen((v) => !v)} aria-label={open ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={open} className="grid h-10 w-10 place-items-center rounded-full border border-line lg:hidden">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav aria-label="Мобильное меню" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden lg:hidden">
            <div className="container flex flex-col gap-1 pb-6 pt-2">
              {NAV.map((n) => <NavLink key={n.to} to={n.to} className="rounded-xl px-3 py-3 text-lg font-medium hover:bg-surface2">{n.label}</NavLink>)}
              <Link to={cabinet} className="rounded-xl px-3 py-3 text-lg text-muted hover:bg-surface2">{user ? 'Личный кабинет' : 'Войти'}</Link>
              <Button asChild size="lg" className="mt-3"><Link to="/contacts#order">Обсудить проект</Link></Button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
