import { Helmet } from 'react-helmet-async';

interface SeoProps { title?: string; description?: string; path?: string; image?: string; jsonLd?: object[]; noindex?: boolean }

const DEFAULT_DESC = 'Сайты под ключ за 5–14 дней. Фиксированная цена, гарантия результата. Даже наши ошибки выглядят стильно.';

export function Seo({ title, description = DEFAULT_DESC, path, image = '/og.png', jsonLd = [], noindex }: SeoProps) {
  const origin = window.location.origin;
  const url = origin + (path ?? window.location.pathname);
  const full = title ? `${title} — 404style` : '404style — сайты под ключ за 5–14 дней';
  return (
    <Helmet>
      <title>{full}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex ? <meta name="robots" content="noindex,nofollow" /> : null}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="404style" />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={origin + image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={full} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={origin + image} />
      {jsonLd.map((d, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(d)}</script>
      ))}
    </Helmet>
  );
}

const ctx = { '@context': 'https://schema.org' };
export const organizationLd = () => ({ ...ctx, '@type': 'Organization', name: '404style', url: window.location.origin, email: 'hello@404style.ru', slogan: 'Даже наши ошибки выглядят стильно' });
export const faqLd = (items: { question: string; answer: string }[]) => ({
  ...ctx, '@type': 'FAQPage',
  mainEntity: items.map((q) => ({ '@type': 'Question', name: q.question, acceptedAnswer: { '@type': 'Answer', text: q.answer } })),
});
export const serviceLd = (items: { title: string; description: string; priceFrom: number }[]) =>
  items.map((s) => ({ ...ctx, '@type': 'Service', name: s.title, description: s.description, provider: { '@type': 'Organization', name: '404style' }, offers: { '@type': 'Offer', priceCurrency: 'RUB', price: s.priceFrom } }));
export const breadcrumbLd = (crumbs: { name: string; path: string }[]) => ({
  ...ctx, '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: window.location.origin + c.path })),
});
