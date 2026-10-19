import { Seo } from '@/lib/seo';
import { Faq } from '@/components/sections/Faq';
import { OrderCta } from '@/components/sections/OrderCta';
import { Pricing } from '@/components/sections/Pricing';
import { PageHeader } from '@/components/shared/common';

export function Component() {
  return (
    <>
      <Seo title="Цены и тарифы" description="Лендинг от 30 000 ₽, многостраничный сайт от 70 000 ₽, интернет-магазин от 150 000 ₽. Цена фиксируется в договоре." />
      <PageHeader eyebrow="цены" title={<>Цена в договоре = цена в <span className="grad-text">акте</span></>} sub="Выберите готовый тариф или посчитайте свою конфигурацию в калькуляторе." />
      <Pricing />
      <Faq />
      <OrderCta />
    </>
  );
}
