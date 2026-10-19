import { motion } from 'framer-motion';
import { Code2, MessageSquare, Palette, PenTool, Rocket } from 'lucide-react';
import { SectionTitle } from '@/components/shared/common';

const STEPS = [
  { Icon: MessageSquare, title: 'Брифинг', text: 'Созвон на 30 минут: цели, аудитория, конкуренты. Фиксируем смету.' },
  { Icon: PenTool, title: 'Прототип', text: 'Структура и логика экранов. Согласуем до единого пикселя дизайна.' },
  { Icon: Palette, title: 'Дизайн', text: 'Визуал под ваш бренд. Показываем на реальных экранах, не в слайдах.' },
  { Icon: Code2, title: 'Разработка', text: 'Чистый код, быстрая загрузка, интеграции. Промежуточные показы каждые 2 дня.' },
  { Icon: Rocket, title: 'Запуск и поддержка', text: 'Выкатываем, настраиваем аналитику. 30 дней бесплатной поддержки.' },
];

export function Process() {
  return (
    <section id="process" className="section">
      <div className="container">
        <SectionTitle eyebrow="процесс" title={<>От брифа до запуска — <span className="grad-text">5 шагов</span></>} sub="Без «ждите, мы работаем». Вы всегда знаете, на каком шаге проект и что дальше." />
        <ol className="relative grid gap-10 md:grid-cols-5 md:gap-4">
          <div aria-hidden className="absolute left-7 top-7 hidden h-px w-[calc(100%-3.5rem)] bg-gradient-to-r from-primary via-secondary to-accent opacity-40 md:block" />
          {STEPS.map(({ Icon, title, text }, i) => (
            <motion.li key={title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ delay: i * 0.12, duration: 0.55 }} className="relative flex gap-5 md:block">
              <div className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border border-primary bg-bg text-primary shadow-glowP md:mb-5"><Icon size={22} /></div>
              <div>
                <p className="font-mono text-xs text-muted">0{i + 1}</p>
                <h3 className="mt-1 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted">{text}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
