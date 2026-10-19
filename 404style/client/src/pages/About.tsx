import { Github, Send } from 'lucide-react';
import { Seo } from '@/lib/seo';
import { CountUp } from '@/components/fx/Counters';
import { Reveal } from '@/components/fx/Reveal';
import { OrderCta } from '@/components/sections/OrderCta';
import { CardsSkeleton, EmptyState, PageHeader, SectionTitle } from '@/components/shared/common';
import { useTeam } from '@/lib/queries';

const VALUES = [
  { t: 'Фиксированная цена', d: 'Сумма в договоре не растёт. Ошиблись с оценкой — это наша проблема.' },
  { t: 'Показываем, а не рассказываем', d: 'Каждые 2 дня — рабочая версия. Никаких «увидите на сдаче».' },
  { t: 'Код, который можно забрать', d: 'Исходники, домен и доступы — ваши. Без подписки на «наш движок».' },
];

export function Component() {
  const { data, isLoading } = useTeam();
  return (
    <>
      <Seo title="О студии" description="404style — молодая студия: делаем сайты под ключ, называем сроки и держим их. Познакомьтесь с командой." />
      <PageHeader eyebrow="о студии" title={<>Мы назвались как ошибку. <span className="grad-text">Работаем без них.</span></>} sub="404style — небольшая команда, которая делает сайты под ключ. Мы молоды, поэтому доказываем делом: фиксируем цену, называем срок и укладываемся." />
      <section className="section">
        <div className="container grid gap-6 md:grid-cols-3">
          {VALUES.map((v, i) => <Reveal key={v.t} delay={i * 0.1}><div className="card-surface h-full p-8"><h3 className="text-xl font-semibold">{v.t}</h3><p className="mt-2 text-muted">{v.d}</p></div></Reveal>)}
        </div>
        <dl className="container mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          {[[47, '+', 'проектов'], [32, '', 'клиента'], [14, '', 'дней — максимум'], [100, '%', 'сдаём в срок']].map(([n, s, l]) => (
            <div key={String(l)}><dt className="font-mono text-4xl font-bold grad-text"><CountUp to={n as number} suffix={s as string} /></dt><dd className="mt-1 text-sm text-muted">{l}</dd></div>
          ))}
        </dl>
      </section>
      <section className="section">
        <div className="container">
          <SectionTitle eyebrow="команда" title={<>Люди, которые <span className="grad-text">отвечают за результат</span></>} />
          {isLoading ? <CardsSkeleton count={4} h="h-80" /> : !data?.length ? <EmptyState title="Команда уже на подходе" text="Скоро здесь появятся лица. Пока можно познакомиться в переписке." /> : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data.map((m, i) => (
                <Reveal key={m.id} delay={(i % 4) * 0.08}>
                  <article className="card-surface group h-full overflow-hidden transition-colors hover:border-primary/60">
                    {m.photo ? <img src={m.photo} alt={m.name} loading="lazy" className="aspect-square w-full object-cover grayscale transition duration-500 group-hover:grayscale-0" /> : <div className="grid aspect-square place-items-center bg-primary/15 font-mono text-5xl font-bold text-primary">{m.name[0]}</div>}
                    <div className="p-5">
                      <h3 className="font-semibold">{m.name}</h3><p className="font-mono text-xs text-secondary">{m.role}</p>
                      <p className="mt-3 text-sm text-muted">{m.bio}</p>
                      <div className="mt-4 flex gap-3 text-muted">
                        {m.socials?.telegram && <a href={m.socials.telegram} aria-label={`Telegram: ${m.name}`} target="_blank" rel="noopener noreferrer" className="hover:text-secondary"><Send size={16} /></a>}
                        {m.socials?.github && <a href={m.socials.github} aria-label={`GitHub: ${m.name}`} target="_blank" rel="noopener noreferrer" className="hover:text-secondary"><Github size={16} /></a>}
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
      <OrderCta />
    </>
  );
}
