import { Seo } from '@/lib/seo';
import { Marquee } from '@/components/fx/Marquee';
import { Calculator } from '@/components/sections/Calculator';
import { Faq } from '@/components/sections/Faq';
import { Hero } from '@/components/sections/Hero';
import { OrderCta } from '@/components/sections/OrderCta';
import { Pricing } from '@/components/sections/Pricing';
import { Process } from '@/components/sections/Process';
import { Projects } from '@/components/sections/Projects';
import { Reviews } from '@/components/sections/Reviews';
import { Services } from '@/components/sections/Services';

const STACK = ['Лендинги', 'Интернет-магазины', 'Корпоративные сайты', 'React', 'Next.js', 'TypeScript', 'Tailwind', 'Node.js', 'Figma', 'SEO', 'CRM-интеграции', 'Анимации'];

export function Component() {
  return (
    <>
      <Seo />
      <Hero />
      <Marquee items={STACK} />
      <Services />
      <Process />
      <Projects limit={3} />
      <Calculator />
      <Pricing />
      <Reviews />
      <Faq />
      <OrderCta />
    </>
  );
}
