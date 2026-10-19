import { Check, X } from 'lucide-react';
import { z } from 'zod';
import { CrudPage, type CrudConfig } from '@/components/admin/CrudPage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import type { FaqItem, PricingPlan, Project, Review, Service, TeamMember } from '@/lib/types';

// Клиентские схемы зеркалят серверные (Zod на сервере всё равно авторитетен)
const req = (m = 'Обязательное поле') => z.string().trim().min(1, m);
const num = (min = 0, max?: number) => { const n = z.number({ required_error: 'Обязательное поле', invalid_type_error: 'Введите число' }).int('Целое число').min(min); return max ? n.max(max) : n; };
const order = z.number().int().min(0).default(0);
const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Латиница, цифры и дефисы, например cyber-beans');
const list = z.array(z.string());
const yesNo: [string, string][] = [['true', 'Да'], ['false', 'Нет']];
const Flag = ({ on, yes = 'Да', no = 'Нет' }: { on: boolean; yes?: string; no?: string }) => <Badge className={on ? 'border-accent/50 text-accent' : 'text-muted'}>{on ? yes : no}</Badge>;
const clip = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n)}…` : s);

const projects: CrudConfig<Project & { isPublished: boolean; order: number }> = {
  entity: 'projects', title: 'Кейсы', subtitle: 'Портфолио на сайте', createLabel: 'Новый кейс', searchPlaceholder: 'По названию или клиенту…',
  columns: [
    { key: 'title', header: 'Название', sortable: true, cell: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'category', header: 'Категория', sortable: true },
    { key: 'year', header: 'Год', sortable: true },
    { key: 'order', header: '№', sortable: true },
    { key: 'isPublished', header: 'Опубликован', cell: (r) => <Flag on={r.isPublished} /> },
  ],
  filters: [{ name: 'isPublished', label: 'Публикация', options: yesNo }],
  fields: [
    { name: 'title', label: 'Название', type: 'text' }, { name: 'slug', label: 'Slug (URL)', type: 'text', placeholder: 'cyber-beans' },
    { name: 'category', label: 'Категория', type: 'text', placeholder: 'Лендинг' }, { name: 'clientName', label: 'Клиент', type: 'text' },
    { name: 'year', label: 'Год', type: 'number' }, { name: 'order', label: 'Порядок', type: 'number' },
    { name: 'coverImage', label: 'Обложка (URL)', type: 'text', full: true, placeholder: 'https://… или /images/case.jpg' },
    { name: 'description', label: 'Описание', type: 'textarea' }, { name: 'images', label: 'Галерея (URL)', type: 'list', optional: true },
    { name: 'tags', label: 'Теги', type: 'list' }, { name: 'resultMetrics', label: 'Метрики результата', type: 'kv', optional: true, placeholder: 'Конверсия: +38%\nСкорость: 0.9 с' },
    { name: 'isPublished', label: 'Опубликован на сайте', type: 'checkbox' },
  ],
  schema: z.object({ title: req(), slug, category: req(), clientName: req(), year: num(2000, 2100), order, coverImage: req(), description: req(), images: list, tags: list, resultMetrics: z.record(z.string()).optional(), isPublished: z.boolean() }),
  defaults: { year: String(new Date().getFullYear()), order: '0', isPublished: false },
};

const services: CrudConfig<Service & { isActive: boolean }> = {
  entity: 'services', title: 'Услуги', subtitle: 'Карточки услуг на сайте', createLabel: 'Новая услуга',
  columns: [
    { key: 'title', header: 'Услуга', sortable: true, cell: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'priceFrom', header: 'Цена от', sortable: true, cell: (r) => formatPrice(r.priceFrom) },
    { key: 'order', header: '№', sortable: true },
    { key: 'isActive', header: 'Активна', cell: (r) => <Flag on={r.isActive} /> },
  ],
  filters: [{ name: 'isActive', label: 'Активность', options: yesNo }],
  fields: [
    { name: 'title', label: 'Название', type: 'text' }, { name: 'slug', label: 'Slug', type: 'text' },
    { name: 'icon', label: 'Иконка', type: 'select', options: [['rocket', 'Ракета'], ['shopping-cart', 'Корзина'], ['building-2', 'Здание'], ['code', 'Код'], ['palette', 'Палитра'], ['zap', 'Молния']] },
    { name: 'priceFrom', label: 'Цена от, ₽', type: 'number' }, { name: 'order', label: 'Порядок', type: 'number' },
    { name: 'description', label: 'Описание', type: 'textarea' }, { name: 'features', label: 'Что входит', type: 'list' },
    { name: 'isActive', label: 'Показывать на сайте', type: 'checkbox' },
  ],
  schema: z.object({ title: req(), slug, icon: req(), priceFrom: num(0), order, description: req(), features: list, isActive: z.boolean() }),
  defaults: { icon: 'rocket', order: '0', isActive: true },
};

const pricing: CrudConfig<PricingPlan & { order: number }> = {
  entity: 'pricing', title: 'Тарифы', subtitle: 'Блок цен', createLabel: 'Новый тариф',
  columns: [
    { key: 'name', header: 'Тариф', sortable: true, cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'price', header: 'Цена', sortable: true, cell: (r) => formatPrice(r.price) },
    { key: 'order', header: '№', sortable: true },
    { key: 'isPopular', header: 'Популярный', cell: (r) => <Flag on={r.isPopular} /> },
  ],
  fields: [
    { name: 'name', label: 'Название', type: 'text' }, { name: 'price', label: 'Цена, ₽', type: 'number' },
    { name: 'description', label: 'Описание', type: 'text', full: true }, { name: 'features', label: 'Что входит', type: 'list' },
    { name: 'order', label: 'Порядок', type: 'number' }, { name: 'isPopular', label: 'Выделить как популярный', type: 'checkbox' },
  ],
  schema: z.object({ name: req(), price: num(0), description: req(), features: list, order, isPopular: z.boolean() }),
  defaults: { order: '0', isPopular: false },
};

const reviews: CrudConfig<Review & { isApproved: boolean }> = {
  entity: 'reviews', title: 'Отзывы', subtitle: 'Модерация: одобренные видны на сайте', createLabel: 'Новый отзыв', searchPlaceholder: 'По автору, компании, тексту…',
  columns: [
    { key: 'authorName', header: 'Автор', sortable: true, cell: (r) => <div><span className="font-medium">{r.authorName}</span><span className="block font-mono text-xs text-muted">{r.authorCompany}</span></div> },
    { key: 'rating', header: '★', sortable: true, cell: (r) => <span className="font-mono text-accent">{r.rating}/5</span> },
    { key: 'text', header: 'Текст', cell: (r) => <span className="text-muted">{clip(r.text)}</span> },
    { key: 'isApproved', header: 'Статус', cell: (r) => <Flag on={r.isApproved} yes="Одобрен" no="На модерации" /> },
  ],
  filters: [{ name: 'isApproved', label: 'Статус', options: [['false', 'На модерации'], ['true', 'Одобрены']] }],
  rowActions: (r, patch) => r.isApproved
    ? <Button size="sm" variant="ghost" aria-label="Снять с публикации" className="hover:text-red-400" onClick={() => patch({ isApproved: false })}><X size={16} /></Button>
    : <Button size="sm" variant="ghost" aria-label="Одобрить" className="text-accent" onClick={() => patch({ isApproved: true })}><Check size={16} /></Button>,
  fields: [
    { name: 'authorName', label: 'Автор', type: 'text' }, { name: 'authorCompany', label: 'Компания', type: 'text', optional: true },
    { name: 'rating', label: 'Оценка (1–5)', type: 'number' }, { name: 'avatar', label: 'Аватар (URL)', type: 'text', optional: true },
    { name: 'text', label: 'Текст отзыва', type: 'textarea' }, { name: 'isApproved', label: 'Одобрен (виден на сайте)', type: 'checkbox' },
  ],
  schema: z.object({ authorName: req(), authorCompany: z.string().optional(), rating: num(1, 5), avatar: z.string().optional(), text: req(), isApproved: z.boolean() }),
  defaults: { rating: '5', isApproved: true },
};

const faq: CrudConfig<FaqItem & { isActive: boolean; order: number }> = {
  entity: 'faq', title: 'FAQ', subtitle: 'Вопросы и ответы (с разметкой для поисковиков)', createLabel: 'Новый вопрос',
  columns: [
    { key: 'question', header: 'Вопрос', sortable: true, cell: (r) => <span className="font-medium">{clip(r.question, 70)}</span> },
    { key: 'order', header: '№', sortable: true },
    { key: 'isActive', header: 'Активен', cell: (r) => <Flag on={r.isActive} /> },
  ],
  filters: [{ name: 'isActive', label: 'Активность', options: yesNo }],
  fields: [
    { name: 'question', label: 'Вопрос', type: 'text', full: true }, { name: 'answer', label: 'Ответ', type: 'textarea' },
    { name: 'order', label: 'Порядок', type: 'number' }, { name: 'isActive', label: 'Показывать', type: 'checkbox' },
  ],
  schema: z.object({ question: req(), answer: req(), order, isActive: z.boolean() }),
  defaults: { order: '0', isActive: true },
};

const team: CrudConfig<TeamMember & { order: number }> = {
  entity: 'team', title: 'Команда', subtitle: 'Раздел «О студии»', createLabel: 'Новый участник',
  columns: [
    { key: 'name', header: 'Имя', sortable: true, cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'role', header: 'Роль', sortable: true }, { key: 'order', header: '№', sortable: true },
  ],
  fields: [
    { name: 'name', label: 'Имя', type: 'text' }, { name: 'role', label: 'Роль', type: 'text' },
    { name: 'photo', label: 'Фото (URL)', type: 'text', full: true }, { name: 'bio', label: 'О себе', type: 'textarea' },
    { name: 'socials', label: 'Соцсети', type: 'kv', optional: true, placeholder: 'telegram: https://t.me/…\ngithub: https://github.com/…' },
    { name: 'order', label: 'Порядок', type: 'number' },
  ],
  schema: z.object({ name: req(), role: req(), photo: z.string().trim(), bio: req(), socials: z.record(z.string()).optional(), order }),
  defaults: { order: '0' },
};

export const ProjectsAdmin = () => <CrudPage cfg={projects} />;
export const ServicesAdmin = () => <CrudPage cfg={services} />;
export const PricingAdmin = () => <CrudPage cfg={pricing} />;
export const ReviewsAdmin = () => <CrudPage cfg={reviews} />;
export const FaqAdmin = () => <CrudPage cfg={faq} />;
export const TeamAdmin = () => <CrudPage cfg={team} />;
