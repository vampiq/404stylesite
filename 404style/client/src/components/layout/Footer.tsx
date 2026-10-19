import { Link } from 'react-router-dom';
import { Github, Mail, Send, Users } from 'lucide-react';
import { Glitch } from '@/components/fx/Glitch';
import { useSettings } from '@/lib/queries';
import { NAV } from './Header';

export function Footer() {
  const { contacts, social } = useSettings();
  const socials = [
    { href: social.telegram, label: 'Telegram', Icon: Send },
    { href: social.vk, label: 'VK', Icon: Users },
    { href: social.github, label: 'GitHub', Icon: Github },
  ];
  return (
    <footer className="relative z-10 border-t border-line bg-surface/40 pb-[max(2rem,env(safe-area-inset-bottom))] pt-16">
      <div className="container grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Glitch className="font-display text-2xl font-bold">404style</Glitch>
          <p className="mt-3 max-w-sm text-muted">Даже наши ошибки выглядят стильно. Сайты под ключ за 5–14 дней — по фиксированной цене.</p>
          <div className="mt-6 flex gap-3">
            {socials.map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-full border border-line transition hover:border-secondary hover:text-secondary"><Icon size={18} /></a>
            ))}
          </div>
        </div>
        <nav aria-label="Навигация в подвале">
          <p className="eyebrow mb-4">Разделы</p>
          <ul className="space-y-2">{NAV.map((n) => <li key={n.to}><Link to={n.to} className="text-muted transition hover:text-fg">{n.label}</Link></li>)}</ul>
        </nav>
        <div>
          <p className="eyebrow mb-4">Контакты</p>
          <ul className="space-y-2 text-muted">
            <li><a className="flex items-center gap-2 hover:text-fg" href={`mailto:${contacts.email}`}><Mail size={16} />{contacts.email}</a></li>
            <li><a className="flex items-center gap-2 hover:text-fg" href={`https://t.me/${contacts.telegram?.replace('@', '')}`} target="_blank" rel="noopener noreferrer"><Send size={16} />{contacts.telegram}</a></li>
            <li className="text-sm">{contacts.hours}</li>
          </ul>
        </div>
      </div>
      <div className="container mt-12 flex flex-col justify-between gap-2 border-t border-line pt-6 font-mono text-xs text-muted sm:flex-row">
        <span>© {new Date().getFullYear()} 404style</span>
        <span>made with 404style <span className="text-accent">●</span> ошибок: 0</span>
      </div>
    </footer>
  );
}
