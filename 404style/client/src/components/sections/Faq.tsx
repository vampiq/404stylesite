import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/card';
import { EmptyState, SectionTitle } from '@/components/shared/common';
import { Seo, faqLd } from '@/lib/seo';
import { useFaq } from '@/lib/queries';
import { cn } from '@/lib/utils';

export function Faq() {
  const { data, isLoading } = useFaq();
  const [open, setOpen] = useState<string | null>(null);
  const uid = useId();
  return (
    <section id="faq" className="section">
      {data?.length ? <Seo jsonLd={[faqLd(data)]} /> : null}
      <div className="container max-w-3xl">
        <SectionTitle eyebrow="faq" title={<>Вопросы, которые вы <span className="grad-text">хотели задать</span></>} />
        {isLoading ? <div className="space-y-3">{[0, 1, 2, 3].map((k) => <Skeleton key={k} className="h-16" />)}</div> : !data?.length ? <EmptyState title="Вопросов пока нет" text="Задайте свой — мы ответим и добавим сюда." /> : (
          <div className="space-y-3">
            {data.map((q) => {
              const isOpen = open === q.id;
              return (
                <div key={q.id} className={cn('card-surface transition-colors', isOpen && 'border-primary/60')}>
                  <h3>
                    <button id={`${uid}-b-${q.id}`} aria-expanded={isOpen} aria-controls={`${uid}-p-${q.id}`} onClick={() => setOpen(isOpen ? null : q.id)} className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold">
                      {q.question}
                      <Plus size={20} className={cn('shrink-0 text-accent transition-transform duration-300', isOpen && 'rotate-45')} />
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div id={`${uid}-p-${q.id}`} role="region" aria-labelledby={`${uid}-b-${q.id}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <p className="px-5 pb-5 text-muted">{q.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
