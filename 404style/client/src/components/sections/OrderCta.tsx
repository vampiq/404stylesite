import { Check } from 'lucide-react';
import { OrderForm } from '@/components/shared/OrderForm';
import { Reveal } from '@/components/fx/Reveal';

const PROMISES = ['Смета за 10 минут после заявки', 'Цена и срок — в договоре', 'Правки до утверждения — бесплатно', '30 дней поддержки после запуска'];

export function OrderCta() {
  return (
    <section id="order" className="section overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      <div className="container relative grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow mb-3">// заявка</p>
          <h2 className="text-4xl font-bold md:text-5xl">Расскажите задачу — <span className="grad-text">получите цифру</span></h2>
          <p className="mt-5 max-w-md text-lg text-muted">Три шага, две минуты. Без менеджеров, которые «перезвонят через неделю».</p>
          <ul className="mt-8 space-y-3">{PROMISES.map((p) => <li key={p} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-accent/15 text-accent"><Check size={14} /></span>{p}</li>)}</ul>
        </Reveal>
        <Reveal delay={0.1}><OrderForm /></Reveal>
      </div>
    </section>
  );
}
