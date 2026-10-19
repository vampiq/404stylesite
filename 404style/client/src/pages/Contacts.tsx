import { useState } from 'react';
import { Clock, Mail, Phone, Send } from 'lucide-react';
import { Seo } from '@/lib/seo';
import { ContactForm } from '@/components/shared/ContactForm';
import { OrderForm } from '@/components/shared/OrderForm';
import { PageHeader } from '@/components/shared/common';
import { useSettings } from '@/lib/queries';
import { cn } from '@/lib/utils';

export function Component() {
  const { contacts } = useSettings();
  const [tab, setTab] = useState<'order' | 'ask'>('order');
  const items = [
    { Icon: Mail, label: 'Email', value: contacts.email, href: `mailto:${contacts.email}` },
    { Icon: Send, label: 'Telegram', value: contacts.telegram, href: `https://t.me/${contacts.telegram?.replace('@', '')}` },
    { Icon: Phone, label: 'Телефон', value: contacts.phone, href: `tel:${contacts.phone?.replace(/[^\d+]/g, '')}` },
    { Icon: Clock, label: 'Время работы', value: contacts.hours, href: undefined },
  ];
  return (
    <>
      <Seo title="Контакты" description="Напишите 404style: обсудим проект и назовём цену в течение рабочего дня. Email, Telegram, телефон." />
      <PageHeader eyebrow="контакты" title={<>Напишите. <span className="grad-text">Ответим быстрее, чем загрузится 404.</span></>} />
      <section id="order" className="container grid gap-10 pb-24 pt-8 lg:grid-cols-5">
        <ul className="space-y-4 lg:col-span-2">
          {items.map(({ Icon, label, value, href }) => {
            const body = <><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary"><Icon size={20} /></span><span><span className="block font-mono text-xs uppercase tracking-wider text-muted">{label}</span><span className="font-medium">{value}</span></span></>;
            return <li key={label}>{href ? <a href={href} className="card-surface flex items-center gap-4 p-4 transition-colors hover:border-primary/60">{body}</a> : <div className="card-surface flex items-center gap-4 p-4">{body}</div>}</li>;
          })}
        </ul>
        <div className="lg:col-span-3">
          <div className="mb-4 inline-flex rounded-full border border-line p-1" role="tablist">
            {([['order', 'Обсудить проект'], ['ask', 'Задать вопрос']] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn('rounded-full px-5 py-2 text-sm font-medium transition', tab === k ? 'bg-accent text-[#0a0a0f]' : 'text-muted hover:text-fg')}>{l}</button>
            ))}
          </div>
          {tab === 'order' ? <OrderForm /> : <ContactForm />}
        </div>
      </section>
    </>
  );
}
