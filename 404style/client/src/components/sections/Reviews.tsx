import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/card';
import { SectionTitle } from '@/components/shared/common';
import { useReviews } from '@/lib/queries';
import { cn } from '@/lib/utils';

export function Reviews() {
  const { data, isLoading } = useReviews();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = data?.length ?? 0;

  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n, paused]);

  if (!isLoading && n === 0) return null; // нет одобренных отзывов — секцию не показываем
  const r = data?.[i % Math.max(n, 1)];

  return (
    <section id="reviews" className="section">
      <div className="container max-w-4xl">
        <SectionTitle center eyebrow="отзывы" title={<>Клиенты говорят. <span className="grad-text">Мы не редактируем.</span></>} />
        <div className="card-surface relative min-h-[17rem] p-8 md:p-12" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel" aria-live="off">
          <Quote className="absolute right-8 top-8 text-primary/20" size={64} aria-hidden />
          {isLoading || !r ? <Skeleton className="h-40" /> : (
            <AnimatePresence mode="wait">
              <motion.figure key={r.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35 }}>
                <div className="mb-5 flex gap-1" aria-label={`Оценка ${r.rating} из 5`}>
                  {Array.from({ length: 5 }, (_, k) => <Star key={k} size={18} className={k < r.rating ? 'fill-accent text-accent' : 'text-line'} />)}
                </div>
                <blockquote className="text-xl leading-relaxed md:text-2xl">«{r.text}»</blockquote>
                <figcaption className="mt-8 flex items-center gap-4">
                  {r.avatar ? <img src={r.avatar} alt="" loading="lazy" className="h-12 w-12 rounded-full object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/20 font-mono font-bold text-primary">{r.authorName[0]}</span>}
                  <span><span className="block font-semibold">{r.authorName}</span>{r.authorCompany && <span className="font-mono text-xs text-muted">{r.authorCompany}</span>}</span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          )}
        </div>
        {n > 1 && (
          <div className="mt-6 flex justify-center gap-2" role="tablist" aria-label="Выбор отзыва">
            {data!.map((x, k) => <button key={x.id} role="tab" aria-selected={k === i} aria-label={`Отзыв ${k + 1}`} onClick={() => setI(k)} className={cn('h-2.5 rounded-full transition-all', k === i ? 'w-8 bg-accent' : 'w-2.5 bg-line hover:bg-muted')} />)}
          </div>
        )}
      </div>
    </section>
  );
}
