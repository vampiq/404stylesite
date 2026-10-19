import { Seo } from '@/lib/seo';
import { OrderCta } from '@/components/sections/OrderCta';
import { Projects } from '@/components/sections/Projects';
import { PageHeader } from '@/components/shared/common';

export function Component() {
  return (
    <>
      <Seo title="Портфолио" description="Кейсы 404style: кофейня, барбершоп, доставка, фитнес, стоматология, IT-стартап. Реальные проекты и реальные метрики." />
      <PageHeader eyebrow="портфолио" title={<>Кейсы с <span className="grad-text">цифрами</span>, а не с лайками</>} sub="Фильтруйте по нише и смотрите, что получилось у таких же, как вы." />
      <Projects filterable />
      <OrderCta />
    </>
  );
}
