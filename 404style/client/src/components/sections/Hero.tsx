import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Glitch } from '@/components/fx/Glitch';
import { CountUp } from '@/components/fx/Counters';
import { Magnetic } from '@/components/fx/Magnetic';
import { Button } from '@/components/ui/button';

const STATS = [
  { to: 47, suffix: '+', label: 'проектов запущено' },
  { to: 32, suffix: '', label: 'клиента вернулись' },
  { to: 3, suffix: '', label: 'года без факапов' },
  { to: 5, suffix: '–14', label: 'дней до запуска' },
];

function Laptop() {
  return (
    <div className="relative mx-auto w-full max-w-lg [perspective:1200px]" aria-hidden>
      <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} style={{ rotateY: -10, rotateX: 4 }}>
        <div className="rounded-t-2xl border border-line bg-surface2 p-2.5 shadow-glowP">
          <div className="aspect-[16/10] overflow-hidden rounded-lg bg-bg p-4">
            <div className="mb-4 flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-red-500" /><i className="h-2.5 w-2.5 rounded-full bg-yellow-400" /><i className="h-2.5 w-2.5 rounded-full bg-green-500" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-3">
                <div className="h-2.5 w-3/4 rounded bg-gradient-to-r from-primary to-secondary" />
                <div className="h-2 w-full rounded bg-line" /><div className="h-2 w-5/6 rounded bg-line" />
                <div className="h-16 rounded-lg bg-gradient-to-br from-primary/50 to-secondary/30" />
                <div className="h-7 w-24 rounded-full bg-accent" />
              </div>
              <div className="space-y-3"><div className="h-12 rounded-lg border border-line bg-surface" /><div className="h-12 rounded-lg border border-line bg-surface" /><div className="font-mono text-2xl font-bold text-primary">404</div></div>
            </div>
          </div>
        </div>
        <div className="mx-[-4%] h-3 rounded-b-xl bg-gradient-to-b from-surface2 to-surface" />
      </motion.div>
    </div>
  );
}

export function Hero() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 600], [0, 120]);
  const y2 = useTransform(scrollY, [0, 600], [0, -80]);
  return (
    <section className="relative overflow-hidden pb-16 pt-16 md:pb-24 md:pt-24">
      <motion.div style={{ y: y1 }} aria-hidden className="pointer-events-none absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-[110px]" />
      <motion.div style={{ y: y2 }} aria-hidden className="pointer-events-none absolute -right-24 top-40 h-96 w-96 rounded-full bg-secondary/20 blur-[110px]" />
      <div className="container relative grid items-center gap-14 lg:grid-cols-2">
        <div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="eyebrow mb-5">
            <Glitch className="text-secondary">404style</Glitch> / веб-студия
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }} className="text-5xl font-bold leading-[1.02] sm:text-6xl xl:text-7xl">
            <Glitch scan>Сайты, которые</Glitch> <span className="grad-text"><Glitch>невозможно потерять</Glitch></span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 max-w-xl text-lg text-muted">
            Сайт под ключ за 5–14 дней. Цена фиксируется в договоре, результат — гарантируем. Быстро, стильно, без ошибок.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-9 flex flex-wrap gap-4">
            <Magnetic><Button asChild size="lg"><Link to="/contacts#order">Получить расчёт за 10 минут <ArrowRight size={18} /></Link></Button></Magnetic>
            <Magnetic><Button asChild size="lg" variant="secondary"><Link to="/portfolio">Смотреть работы</Link></Button></Magnetic>
          </motion.div>
          <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="font-mono text-3xl font-bold grad-text"><CountUp to={s.to} suffix={s.suffix} /></dt>
                <dd className="mt-1 text-xs text-muted">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <Laptop />
      </div>
    </section>
  );
}
