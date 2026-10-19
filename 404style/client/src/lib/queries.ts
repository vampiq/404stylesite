import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from './api';
import type { CalcInput, FaqItem, PricingPlan, Project, Quote, Review, Service, SiteSettings, TeamMember } from './types';

const list = <T,>(key: string, path: string) =>
  () => useQuery({ queryKey: [key], queryFn: () => api<{ items: T[] }>(path, { auth: false }).then((r) => r.items), staleTime: 60_000 });

export const useServices = list<Service>('services', '/services');
export const usePricing = list<PricingPlan>('pricing', '/pricing');
export const useReviews = list<Review>('reviews', '/reviews');
export const useFaq = list<FaqItem>('faq', '/faq');
export const useTeam = list<TeamMember>('team', '/team');

export const useProjects = (filter: { category?: string; tag?: string } = {}) =>
  useQuery({
    queryKey: ['projects', filter],
    queryFn: () => api<{ items: Project[]; categories: string[] }>('/projects', { auth: false, query: filter }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

export const useProject = (slug: string | undefined) =>
  useQuery({ queryKey: ['project', slug], enabled: !!slug, retry: false, queryFn: () => api<{ item: Project }>(`/projects/${slug}`, { auth: false }).then((r) => r.item) });

const DEFAULT_SETTINGS: Required<SiteSettings> = {
  contacts: { email: 'hello@404style.ru', telegram: '@style404', phone: '+7 (900) 404-40-40', hours: 'Пн–Пт, 10:00–19:00 МСК' },
  social: { telegram: 'https://t.me/style404', vk: 'https://vk.com', github: 'https://github.com' },
};
export function useSettings(): Required<SiteSettings> {
  const { data } = useQuery({ queryKey: ['settings'], queryFn: () => api<SiteSettings>('/settings', { auth: false }), staleTime: 300_000 });
  return { contacts: { ...DEFAULT_SETTINGS.contacts, ...data?.contacts }, social: { ...DEFAULT_SETTINGS.social, ...data?.social } };
}

export const useQuote = (input: CalcInput) =>
  useQuery({ queryKey: ['quote', input], queryFn: () => api<Quote>('/calculate', { method: 'POST', body: input, auth: false }), placeholderData: keepPreviousData });
