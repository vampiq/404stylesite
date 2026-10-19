import DOMPurify from 'dompurify';

/** Любой HTML из БД/админки проходит через DOMPurify. */
export const clean = (html: string): string => DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
