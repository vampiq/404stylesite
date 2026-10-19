import { Seo } from '@/lib/seo';
import { Faq } from '@/components/sections/Faq';
import { OrderCta } from '@/components/sections/OrderCta';
import { Process } from '@/components/sections/Process';
import { Services } from '@/components/sections/Services';
import { PageHeader } from '@/components/shared/common';

export function Component() {
  return (
    <>
      <Seo title="Услуги: лендинги, интернет-магазины, корпоративные сайты" description="Разработка сайтов под ключ: лендинги за 5 дней, интернет-магазины с оплатой и доставкой, корпоративные сайты для бизнеса. Фиксированная цена." />
      <PageHeader eyebrow="услуги" title={<>Делаем сайты, которые <span className="grad-text">продают</span></>} sub="Лендинг, магазин или корпоративный сайт — одна команда, один договор, один результат." />
      <Services detailed />
      <Process />
      <Faq />
      <OrderCta />
    </>
  );
}
