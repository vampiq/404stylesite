/* Seed 404style: пересоздаёт демо-данные. ВНИМАНИЕ: очищает все таблицы. Запуск: npm run seed */
import bcrypt from 'bcrypt';
import { PrismaClient, type OrderStatus, type Prisma, type Role } from '@prisma/client';
import { computeQuote, type CalcInput } from '../server/src/lib/pricing.js';

const prisma = new PrismaClient();
const DAY = 864e5;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 36e5);

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_FORCE !== 'true') {
    throw new Error('Seed очищает БД. В production запускайте с SEED_FORCE=true осознанно.');
  }
  console.log('🌱 Очищаем таблицы…');
  await prisma.$transaction([
    prisma.auditLog.deleteMany(), prisma.message.deleteMany(), prisma.review.deleteMany(), prisma.order.deleteMany(),
    prisma.refreshToken.deleteMany(), prisma.user.deleteMany(), prisma.project.deleteMany(), prisma.service.deleteMany(),
    prisma.pricingPlan.deleteMany(), prisma.faqItem.deleteMany(), prisma.teamMember.deleteMany(), prisma.siteSettings.deleteMany(),
    prisma.contactRequest.deleteMany(),
  ]);

  // ── Пользователи ──
  const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD ?? 'password123', 12);
  const mkUser = (email: string, name: string, role: Role, phone: string) => prisma.user.create({ data: { email, name, role, phone, passwordHash } });
  const admin = await mkUser('admin@404style.ru', 'Артём Волков', 'ADMIN', '+7 (900) 404-40-01');
  const manager = await mkUser('manager@404style.ru', 'Марина Лебедева', 'MANAGER', '+7 (900) 404-40-02');
  const client = await mkUser('client@404style.ru', 'Игорь Соколов', 'CLIENT', '+7 (900) 111-22-33');

  // ── Кейсы ──
  const projects: Prisma.ProjectCreateManyInput[] = [
    { title: 'Cyber Beans', slug: 'cyber-beans', category: 'Лендинг', clientName: 'Кофейня Cyber Beans', year: 2025, tags: ['Кофейня', 'Лендинг', 'Анимации'], resultMetrics: { 'Рост заказов': '+62%', 'Скорость загрузки': '0.9 с', 'Срок': '5 дней' }, description: 'Кофейня с киберпанк-характером хотела выделиться среди десятка одинаковых сайтов. Собрали лендинг с неоновой типографикой, живым меню и предзаказом в два клика.\n\nМеню обновляется из таблицы, а бариста видит заказы в Telegram. Окупились за месяц.' },
    { title: 'Blade', slug: 'blade', category: 'Сайт-визитка', clientName: 'Барбершоп Blade', year: 2025, tags: ['Барбершоп', 'Запись онлайн'], resultMetrics: { 'Онлайн-записи': '71%', 'Неявки': '−40%', 'Срок': '6 дней' }, description: 'Барбершопу нужна была визитка с онлайн-записью без звонков. Сделали сайт с выбором мастера и времени и напоминаниями.\n\nДоля записей через сайт за 2 месяца дошла до 71%, неявки упали на 40%.' },
    { title: 'FastFood', slug: 'fastfood', category: 'Интернет-магазин', clientName: 'Служба доставки FastFood', year: 2024, tags: ['Доставка', 'Интернет-магазин', 'Оплата'], resultMetrics: { 'Конверсия': '+38%', 'Средний чек': '+22%', 'Срок': '14 дней' }, description: 'Каталог на 300 позиций, корзина, оплата картой и СБП, расчёт доставки по зонам и личный кабинет с повтором заказа.\n\nПосле запуска конверсия в заказ выросла на 38%, а повторные заказы — на 54%.' },
    { title: 'Iron Pulse', slug: 'iron-pulse', category: 'Лендинг', clientName: 'Фитнес-клуб Iron Pulse', year: 2025, tags: ['Фитнес', 'Лендинг', 'Заявки'], resultMetrics: { 'Заявок в месяц': '×2.4', 'Цена заявки': '−35%', 'Срок': '5 дней' }, description: 'Клубу нужны были заявки на пробную тренировку. Лендинг с расписанием, калькулятором абонемента и формой в три шага.\n\nЗа месяц число заявок выросло в 2,4 раза при том же бюджете на рекламу.' },
    { title: 'Dentis', slug: 'dentis', category: 'Корпоративный сайт', clientName: 'Стоматология Dentis', year: 2024, tags: ['Стоматология', 'Многостраничный', 'SEO'], resultMetrics: { 'Трафик из поиска': '+180%', 'Страниц': '24', 'Срок': '12 дней' }, description: 'Многостраничный сайт клиники: врачи, услуги с ценами, отзывы, онлайн-запись. Проработали SEO-структуру под запросы по районам города.\n\nЧерез 4 месяца поисковый трафик вырос на 180%.' },
    { title: 'Nexora', slug: 'nexora', category: 'Лендинг', clientName: 'IT-стартап Nexora', year: 2025, tags: ['SaaS', 'Лендинг', 'Анимации'], resultMetrics: { 'Регистраций': '+210%', 'LCP': '1.1 с', 'Срок': '7 дней' }, description: 'Стартапу перед раундом инвестиций нужен был лендинг, который объясняет продукт за 10 секунд. Сделали интерактивное демо прямо на первом экране.\n\nРегистрации выросли на 210%, раунд закрыли.' },
  ];
  for (const [i, p] of projects.entries()) {
    await prisma.project.create({ data: { ...p, coverImage: `/images/cases/${p.slug}.jpg`, images: [`/images/cases/${p.slug}-1.jpg`, `/images/cases/${p.slug}-2.jpg`], isPublished: true, order: i } });
  }

  // ── Услуги и тарифы ──
  await prisma.service.createMany({ data: [
    { title: 'Лендинги', slug: 'landing', icon: 'rocket', priceFrom: 30000, order: 0, description: 'Продающие страницы за 5 дней', features: ['Дизайн под ваш бренд', 'Адаптив и скорость 90+', 'Форма заявок и аналитика', 'Базовое SEO'] },
    { title: 'Интернет-магазины', slug: 'shop', icon: 'shopping-cart', priceFrom: 150000, order: 1, description: 'Каталог, корзина, оплата, доставка', features: ['Каталог и фильтры', 'Оплата картой и СБП', 'Доставка и склад', 'Интеграция с CRM'] },
    { title: 'Корпоративные сайты', slug: 'corporate', icon: 'building-2', priceFrom: 70000, order: 2, description: 'Многостраничные сайты для бизнеса', features: ['Структура под SEO', 'Админка для контента', 'Мультиязычность', 'Интеграции'] },
  ] });
  await prisma.pricingPlan.createMany({ data: [
    { name: 'Старт', price: 30000, order: 0, isPopular: false, description: 'Чтобы заявить о себе в сети', features: ['Лендинг', '1 страница', 'Базовое SEO', 'Адаптивная вёрстка', '30 дней поддержки'] },
    { name: 'Бизнес', price: 70000, order: 1, isPopular: true, description: 'Для растущего бизнеса', features: ['Многостраничный сайт', 'Интеграции (CRM, формы, чат)', 'Анимации', 'Админка для контента', 'SEO-структура'] },
    { name: 'Премиум', price: 150000, order: 2, isPopular: false, description: 'Продажи онлайн без потолка', features: ['Интернет-магазин', 'CRM и оплата', 'Аналитика и цели', 'Личный кабинет клиента', 'Приоритетная поддержка'] },
  ] });

  // ── Отзывы: 5 одобрены, 3 на модерации ──
  await prisma.review.createMany({ data: [
    { authorName: 'Алексей Громов', authorCompany: 'Cyber Beans', rating: 5, isApproved: true, text: 'Лендинг был на проде через 6 дней. Заявки пошли в первую неделю — сайт окупился за месяц.' },
    { authorName: 'Марат Исаев', authorCompany: 'Барбершоп Blade', rating: 5, isApproved: true, text: 'Цена в договоре — цена в акте. Ни одной доплаты, ни одного «ой, это отдельно».' },
    { authorName: 'Ирина Фомина', authorCompany: 'FastFood', rating: 5, isApproved: true, text: 'Магазин с оплатой и доставкой собрали за две недели. Конверсия выросла почти на 40%.' },
    { authorName: 'Денис Ковалёв', authorCompany: 'Iron Pulse', rating: 4, isApproved: true, text: 'Быстро, аккуратно, по делу. Пара правок после запуска — поправили в тот же день.' },
    { authorName: 'Ольга Реброва', authorCompany: 'Dentis', rating: 5, isApproved: true, text: 'Сделали сайт клиники с онлайн-записью. Трафик из поиска вырос почти втрое.' },
    { authorName: 'Павел Нестеров', authorCompany: 'Nexora', rating: 5, isApproved: false, text: 'Лендинг с демо на первом экране — инвесторы реально впечатлились. Спасибо за скорость.' },
    { authorName: 'Анна Мельникова', rating: 4, isApproved: false, text: 'Хорошая студия, всё объяснили простыми словами и не потеряли сроки. Рекомендую.' },
    { authorName: 'Сергей Орлов', authorCompany: 'Orlov Auto', rating: 3, isApproved: false, text: 'В целом доволен, но первую версию дизайна пришлось переделывать. Финальный результат хороший.' },
  ] });

  // ── FAQ, команда ──
  const faq: [string, string][] = [
    ['За сколько вы делаете сайт?', 'Лендинг — от 5 дней, корпоративный сайт — 10–14 дней, магазин — от 14 дней. Сроки фиксируем в договоре.'],
    ['Цена точно не вырастет?', 'Нет. Цена фиксированная и прописана в договоре. Если мы ошиблись в оценке — это наши проблемы, не ваши.'],
    ['Что входит в «под ключ»?', 'Бриф, прототип, дизайн, вёрстка, разработка, домен и хостинг, запуск и 30 дней бесплатной поддержки.'],
    ['Что если результат не понравится?', 'Правки до утверждения дизайна — без лимита раундов. Не устроило совсем — вернём предоплату за невыполненные этапы.'],
    ['Вы делаете SEO и копирайт?', 'Да. Базовое SEO входит в «Старт», расширенное SEO и тексты — опции в калькуляторе.'],
    ['Кто владеет сайтом после сдачи?', 'Вы. Код, дизайн, домен и доступы передаём полностью. Никаких подписок на «наш движок».'],
    ['Как проходит оплата?', '50% предоплата, 50% после запуска. Работаем по договору, выдаём закрывающие документы.'],
    ['Работаете с регионами и зарубежными клиентами?', 'Да, всё делаем удалённо: созвоны, трекинг этапов и чат по заказу в личном кабинете.'],
  ];
  await prisma.faqItem.createMany({ data: faq.map(([question, answer], order) => ({ question, answer, order })) });
  await prisma.teamMember.createMany({ data: [
    { name: 'Артём Волков', role: 'Основатель, fullstack', order: 0, photo: '', bio: 'Пишет код и держит сроки. Считает, что хороший сайт — это быстрый сайт.', socials: { telegram: 'https://t.me/style404', github: 'https://github.com' } },
    { name: 'Марина Лебедева', role: 'Менеджер проектов', order: 1, photo: '', bio: 'Превращает «хочу как у всех, но лучше» в понятное ТЗ и следит, чтобы никто не потерялся.', socials: { telegram: 'https://t.me/style404' } },
    { name: 'Кирилл Зимин', role: 'Арт-директор', order: 2, photo: '', bio: 'Рисует интерфейсы, от которых не хочется уходить. Фанат неона и сеток.', socials: { telegram: 'https://t.me/style404' } },
    { name: 'Алина Руднева', role: 'Frontend-разработчик', order: 3, photo: '', bio: 'Анимации, доступность, производительность. Анимация должна помогать, а не мешать.', socials: { github: 'https://github.com' } },
  ] });

  // ── Заказы: 10 штук, разные статусы, даты за последние ~25 дней ──
  interface Msg { staff?: 'admin' | 'manager'; text: string; hoursAfter: number }
  interface O { name: string; email: string; phone: string; type: string; budget: string; deadline: string; message: string; status: OrderStatus; daysAgo: number; calc?: CalcInput; user?: boolean; msgs?: Msg[] }
  const orders: O[] = [
    { name: 'Игорь Соколов', email: 'client@404style.ru', phone: '+7 (900) 111-22-33', type: 'Лендинг', budget: 'до 50 000 ₽', deadline: '7–10 дней', message: 'Нужен лендинг для студии йоги.', status: 'DONE', daysAgo: 24, user: true, calc: { type: 'landing', extras: ['seo'], urgency: 'normal' }, msgs: [{ text: 'Здравствуйте! Хочу лендинг для студии йоги.', hoursAfter: 0 }, { staff: 'manager', text: 'Привет, Игорь! Созвонимся завтра в 12:00 и обсудим детали?', hoursAfter: 2 }, { staff: 'manager', text: 'Сайт запущен. Проверьте, пожалуйста, и оставьте отзыв.', hoursAfter: 240 }] },
    { name: 'Игорь Соколов', email: 'client@404style.ru', phone: '+7 (900) 111-22-33', type: 'Интернет-магазин', budget: '100 000 – 200 000 ₽', deadline: '14 дней', message: 'Магазин йога-товаров с оплатой и доставкой.', status: 'IN_PROGRESS', daysAgo: 9, user: true, calc: { type: 'shop', extras: ['crm', 'seo'], urgency: 'normal' }, msgs: [{ text: 'Хочу расширить проект магазином товаров для йоги.', hoursAfter: 0 }, { staff: 'manager', text: 'Отличная идея! Прототип будет готов в четверг, пришлём ссылку.', hoursAfter: 5 }, { staff: 'manager', text: 'Прототип готов — посмотрите, пожалуйста, и напишите правки.', hoursAfter: 72 }] },
    { name: 'Игорь Соколов', email: 'client@404style.ru', phone: '+7 (900) 111-22-33', type: 'Корпоративный сайт', budget: '50 000 – 100 000 ₽', deadline: 'Не горит', message: 'Подумываю о сайте для школы йоги.', status: 'NEW', daysAgo: 1, user: true, calc: { type: 'corporate', extras: [], urgency: 'normal' } },
    { name: 'Анна Белова', email: 'anna@belova.ru', phone: '+7 (916) 200-10-10', type: 'Лендинг', budget: 'до 50 000 ₽', deadline: '5 дней (срочно)', message: 'Лендинг для онлайн-курса по дизайну интерьера.', status: 'NEW', daysAgo: 0, calc: { type: 'landing', extras: ['animations'], urgency: 'urgent' } },
    { name: 'Михаил Орехов', email: 'm.orekhov@mail.ru', phone: '+7 (903) 555-12-12', type: 'Интернет-магазин', budget: 'от 200 000 ₽', deadline: '14 дней', message: 'Магазин кофейных зёрен, нужна интеграция с 1С.', status: 'NEW', daysAgo: 2, calc: { type: 'shop', extras: ['crm', 'seo', 'copywriting'], urgency: 'normal' } },
    { name: 'Екатерина Лис', email: 'e.lis@studio.ru', phone: '+7 (925) 777-88-99', type: 'Корпоративный сайт', budget: '50 000 – 100 000 ₽', deadline: '14 дней', message: 'Сайт архитектурного бюро с портфолио.', status: 'IN_PROGRESS', daysAgo: 14, calc: { type: 'corporate', extras: ['animations', 'multilang'], urgency: 'fast' } },
    { name: 'Роман Тарасов', email: 'roman@tarasov.pro', phone: '+7 (999) 321-00-11', type: 'Лендинг', budget: 'до 50 000 ₽', deadline: '7–10 дней', message: 'Лендинг для юридических консультаций.', status: 'IN_PROGRESS', daysAgo: 6, calc: { type: 'landing', extras: ['copywriting'], urgency: 'fast' } },
    { name: 'Светлана Дорохова', email: 'sveta@dorokhova.ru', phone: '+7 (905) 100-20-30', type: 'Лендинг', budget: 'до 50 000 ₽', deadline: '7–10 дней', message: 'Сайт-визитка для мастера маникюра.', status: 'DONE', daysAgo: 19, calc: { type: 'landing', extras: [], urgency: 'normal' } },
    { name: 'Владимир Ким', email: 'v.kim@startup.io', phone: '+7 (926) 444-55-66', type: 'Интернет-магазин', budget: '100 000 – 200 000 ₽', deadline: '14 дней', message: 'Магазин электроники.', status: 'DONE', daysAgo: 22, calc: { type: 'shop', extras: ['crm'], urgency: 'normal' } },
    { name: 'Глеб Артемов', email: 'gleb@artemov.me', phone: '+7 (977) 000-11-22', type: 'Другое', budget: 'до 50 000 ₽', deadline: 'Не горит', message: 'Передумал, проект заморожен.', status: 'CANCELLED', daysAgo: 12 },
  ];
  for (const o of orders) {
    const createdAt = ago(o.daysAgo);
    const quote = o.calc ? computeQuote(o.calc) : undefined;
    await prisma.order.create({
      data: {
        userId: o.user ? client.id : null, name: o.name, email: o.email, phone: o.phone, projectType: o.type, budget: o.budget, deadline: o.deadline, message: o.message,
        status: o.status, createdAt, calculatorData: quote as Prisma.InputJsonValue | undefined,
        messages: { create: (o.msgs ?? []).map((m) => ({
          senderRole: m.staff === 'admin' ? 'ADMIN' : m.staff === 'manager' ? 'MANAGER' : ('CLIENT' as Role),
          senderId: m.staff === 'admin' ? admin.id : m.staff === 'manager' ? manager.id : o.user ? client.id : null,
          text: m.text, createdAt: new Date(createdAt.getTime() + m.hoursAfter * 36e5),
          isRead: o.status === 'DONE' || (m.staff === undefined && o.daysAgo > 8),
        })) },
      },
    });
  }

  // ── Настройки сайта ──
  const settings: Record<string, Prisma.InputJsonValue> = {
    contacts: { email: 'hello@404style.ru', telegram: '@style404', phone: '+7 (900) 404-40-40', hours: 'Пн–Пт, 10:00–19:00 МСК' },
    social: { telegram: 'https://t.me/style404', vk: 'https://vk.com', github: 'https://github.com' },
    meta: { title: '404style — сайты под ключ за 5–14 дней', description: 'Лендинги, интернет-магазины и корпоративные сайты. Фиксированная цена и гарантия результата. Даже наши ошибки выглядят стильно.' },
  };
  for (const [key, value] of Object.entries(settings)) await prisma.siteSettings.create({ data: { key, value } });

  console.log('✅ Готово. Аккаунты (пароль: %s):\n   admin@404style.ru · manager@404style.ru · client@404style.ru', process.env.SEED_PASSWORD ?? 'password123');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
