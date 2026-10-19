import { Link } from 'react-router-dom';
import { Seo } from '@/lib/seo';
import { Glitch } from '@/components/fx/Glitch';
import { Button } from '@/components/ui/button';

export function Component() {
  return (
    <section className="container grid min-h-[80vh] place-items-center py-20 text-center">
      <Seo title="404 — страница потерялась" noindex />
      <div>
        <h1 className="font-mono text-[28vw] font-bold leading-none text-primary sm:text-[12rem]"><Glitch scan>404</Glitch></h1>
        <p className="mt-4 text-2xl font-bold md:text-4xl">Потерялся? Мы найдём. <span className="grad-text">А твой сайт — тем более.</span></p>
        <p className="mx-auto mt-4 max-w-md text-muted">Такой страницы нет. Зато есть куда вернуться — и ошибка выглядит стильно.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg"><Link to="/">На главную</Link></Button>
          <Button asChild size="lg" variant="secondary"><Link to="/portfolio">Смотреть работы</Link></Button>
        </div>
      </div>
    </section>
  );
}
