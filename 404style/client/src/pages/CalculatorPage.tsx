import { Seo } from '@/lib/seo';
import { Calculator } from '@/components/sections/Calculator';
import { PageHeader } from '@/components/shared/common';

export function Component() {
  return (
    <>
      <Seo title="Калькулятор стоимости сайта" description="Посчитайте стоимость сайта онлайн: тип, дополнительные услуги и срочность. Итоговая цена — сразу." />
      <PageHeader eyebrow="калькулятор" title={<>Сколько стоит ваш сайт? <span className="grad-text">Узнайте сейчас</span></>} sub="Соберите конфигурацию — цена пересчитывается на лету. Понравится — зафиксируем в договоре." />
      <Calculator standalone />
    </>
  );
}
