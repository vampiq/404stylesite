# 404style — платформа

Сайт студии + личный кабинет клиента + админ-панель + REST API + БД.
Слоган: **«Даже наши ошибки выглядят стильно.»**

## Стек

**Vite + React 18 SPA и отдельный Express API** — SEO закрываем `react-helmet-async` и динамическим `sitemap.xml`, а SSR для кабинетов и админки не нужен.

| Слой | Технологии |
|---|---|
| Frontend | React 18, Vite, TypeScript (strict), Tailwind + shadcn/ui, Framer Motion, Zustand, React Hook Form + Zod, TanStack Query/Table, Recharts, sonner |
| Backend | Node 20, Express, Prisma, SQLite (→ PostgreSQL), JWT access + refresh, bcrypt, Zod, helmet, CORS, express-rate-limit |
| Quality | ESLint 9, Prettier, Vitest + Supertest |

## Требования

- Node.js 20+
- npm 10+ (или pnpm)

## Быстрый старт

```bash
git clone <repo> 404style && cd 404style
npm run setup          # install + .env + миграции + seed
npm run dev            # API :4000, сайт :5173
```

Вручную:

```bash
npm install
cp .env.example .env   # вставь свои JWT-секреты
npx prisma migrate dev
npm run seed
npm run dev
```

## Тестовые аккаунты

| Роль | Email | Пароль |
|---|---|---|
| ADMIN | admin@404style.ru | password123 |
| MANAGER | manager@404style.ru | password123 |
| CLIENT | client@404style.ru | password123 |

## Скрипты

| Команда | Что делает |
|---|---|
| `dev` | API + фронт с hot reload |
| `build` | сборка клиента и сервера |
| `start` | запуск прод-сервера (раздаёт `client/dist`) |
| `seed` | заполнение БД |
| `migrate` / `migrate:deploy` | миграции (dev / prod) |
| `studio` | Prisma Studio |
| `lint` / `format` | ESLint / Prettier |
| `test` | Vitest + Supertest (auth, заявки, роли, CRUD, расчёт) |

## Структура проекта

```
404style/
├─ prisma/            schema.prisma · seed.ts
├─ server/
│  ├─ tsconfig.json
│  └─ src/
│     ├─ index.ts · app.ts · env.ts · db.ts
│     ├─ lib/         errors · http · schemas · jwt · cookies · audit · pricing
│     ├─ middleware/  auth · csrf · rateLimit · validate · error
│     ├─ routes/      auth · public (+robots/sitemap) · me
│     │  └─ admin/    index · crud (фабрика) · orders · stats
│     └─ tests/       auth · orders · pricing (+ setup, globalSetup, helpers)
├─ client/
│  ├─ index.html · vite.config.ts · tailwind.config.ts · postcss.config.js · vercel.json
│  └─ src/
│     ├─ main.tsx · App.tsx · router.tsx
│     ├─ styles/      globals.css (токены, глитч, grain)
│     ├─ lib/         api · queries · adminApi · seo · status · types · utils · sanitize
│     ├─ store/       auth · theme
│     ├─ hooks/       useCursorGlow · useDebounce
│     ├─ components/
│     │  ├─ ui/       button · input · card · dialog
│     │  ├─ fx/       Glitch · Background · Marquee · Reveal · TiltCard · Magnetic · Counters
│     │  ├─ layout/   Layout · Header · Footer · Preloader · ErrorBoundary
│     │  ├─ sections/ Hero · Services · Process · Projects · Calculator · Pricing · Reviews · Faq · OrderCta
│     │  ├─ shared/   common (EmptyState, Cover…) · OrderForm · ContactForm · OrderChat
│     │  ├─ admin/    AdminLayout · DataTable · CrudPage
│     │  └─ ProtectedRoute.tsx
│     └─ pages/       Home · Services · Portfolio · Case · Pricing · CalculatorPage · About · Contacts · Auth · NotFound
│        ├─ dashboard/ DashboardLayout · Orders · OrderDetail · Profile
│        └─ admin/     Dashboard · Orders · OrderDetail · Cruds · Settings · Audit
├─ Dockerfile · docker-compose.yml · .github/workflows/ci.yml
├─ eslint.config.js · .prettierrc · vitest.config.ts
└─ package.json · .env.example · README.md
```

## База данных

12 моделей из ТЗ + `RefreshToken` (ротация и отзыв refresh-токенов). Массивы и JSON хранятся как `Json`, поэтому схема одинаково работает в SQLite и PostgreSQL. Soft delete (`deletedAt`) у User, Project, Service, Order, Review.

Переход на PostgreSQL: в `schema.prisma` поменять `provider = "postgresql"`, в `.env` — `DATABASE_URL`, затем `npm run migrate`.

## API

Базовый URL: `http://localhost:4000/api`. Ошибки всегда в формате `{ "error": { "code", "message", "details?" } }`.

**Public:** `GET /services` · `GET /projects?category=&tag=` · `GET /projects/:slug` · `GET /pricing` · `GET /reviews` · `GET /faq` · `GET /team` · `GET /settings` · `POST /orders` · `POST /contact` · `POST /calculate`

**Auth:** `POST /auth/register` · `/auth/login` · `/auth/refresh` · `/auth/logout` · `GET /auth/me`

**Client (JWT):** `GET /me/orders` · `GET /me/orders/:id` · `GET|POST /me/orders/:id/messages` · `POST /me/reviews`

**Admin (JWT, ADMIN; MANAGER — только заказы и сообщения):** `CRUD /admin/{projects,services,pricing,reviews,faq,team}` · `GET /admin/orders` · `PATCH /admin/orders/:id` · `GET /admin/stats` · `GET /admin/audit-log` · `PUT /admin/settings`

Примеры:

```bash
# Расчёт стоимости без сохранения
curl -X POST localhost:4000/api/calculate -H 'Content-Type: application/json' \
  -d '{"type":"shop","extras":["seo","crm"],"urgency":"fast"}'

# Гостевая заявка
curl -X POST localhost:4000/api/orders -H 'Content-Type: application/json' \
  -d '{"name":"Анна","email":"anna@mail.ru","phone":"+79990001122","projectType":"Лендинг","message":"Нужен лендинг для кофейни"}'

# Логин (refresh уходит в httpOnly cookie)
curl -i -X POST localhost:4000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@404style.ru","password":"password123"}'

# Защищённый запрос
curl localhost:4000/api/admin/stats -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Безопасность

- Access JWT — 15 минут, refresh — 7 дней, httpOnly cookie, ротация при каждом `/auth/refresh`
- bcrypt, 12 раундов; `passwordHash` не покидает сервер
- Rate limit: 100 запросов / 15 мин общий, 5 / 15 мин на `/auth/*`
- Helmet, CORS по whitelist, Zod на всех входах, Prisma защищает от SQL-инъекций
- CSRF: double-submit токен для cookie-эндпоинтов (`/auth/refresh`, `/auth/logout`)
- XSS: DOMPurify на фронте для любого пользовательского HTML

## Тесты и качество

```bash
npm test          # Vitest + Supertest: auth (регистрация, ротация refresh, CSRF), заявки, роли, CRUD, расчёт цены
npm run lint      # ESLint 9 (flat config) + typescript-eslint, no-explicit-any = error
npm run format    # Prettier (+ сортировка Tailwind-классов)
```

Тесты используют отдельную SQLite-БД `prisma/test.db`, которая пересоздаётся перед прогоном. CI (`.github/workflows/ci.yml`): lint → test → build.

## Seed

`npm run seed` очищает таблицы и создаёт: 3 пользователей, 6 кейсов, 3 услуги, 3 тарифа, 8 отзывов (5 одобрено, 3 на модерации), 8 FAQ, 4 участников команды, 10 заказов во всех статусах (с перепиской, за последние ~25 дней — графики дашборда не пустые) и настройки сайта. В production требует `SEED_FORCE=true`.

## Docker

Один образ: Express отдаёт API и собранный фронт. `docker-compose.yml` поднимает `app` (порт 4000) и `db` (`postgres:16`, volume `pgdata`). Провайдер Prisma подставляется при сборке (`DB_PROVIDER`), схему при старте синхронизирует `prisma db push`.

```bash
cp .env.example .env                 # задайте JWT_ACCESS_SECRET и JWT_REFRESH_SECRET
docker compose up --build            # http://localhost:4000
docker compose run --rm -e SEED_FORCE=true app npm run seed
```

Для продакшена на Postgres лучше перейти на миграции: сгенерируйте их локально против Postgres (`npx prisma migrate dev`), закоммитьте `prisma/migrations` и замените `db push` в `CMD` на `prisma migrate deploy`.

## Деплой

**Вариант A — всё в одном (проще и надёжнее с cookie).** Railway / Render / Fly: собрать из `Dockerfile` (`DB_PROVIDER=postgresql`), подключить Postgres, задать переменные из `.env.example` (`NODE_ENV=production`, `DATABASE_URL`, `JWT_*_SECRET`, `SITE_URL`, `CORS_ORIGINS`, `COOKIE_SECURE=true`). Фронт и API на одном домене — `SameSite=Lax` достаточно.

**Вариант B — Vercel + Railway + Supabase.**
1. **БД (Supabase):** в `schema.prisma` поставить `provider = "postgresql"`, `DATABASE_URL` из Supabase (`?sslmode=require`), выполнить `npx prisma migrate deploy` (или `db push`).
2. **API (Railway):** build `npm run build:server`, start `npm start`, переменные из `.env.example`; `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`, `CORS_ORIGINS=https://<ваш-фронт>.vercel.app`.
3. **Фронт (Vercel):** root directory `client`, build `vite build`, output `dist`, env `VITE_API_URL=https://<api>.up.railway.app/api`. Rewrites на `index.html` уже в `client/vercel.json`.

Нюанс при разных доменах: клиент не может прочитать CSRF-cookie с домена API, поэтому берёт токен из ответа `GET /api/auth/csrf` — это уже реализовано в `client/src/lib/api.ts`. `sitemap.xml` и `robots.txt` отдаёт API; на Vercel добавьте rewrites на них или раздавайте статикой.

## Этапы

1. Стек, структура, схема, конфиги ✅
2. Бэкенд: сервер, роуты, middleware, auth ✅
3. Фронтенд: публичная часть и дизайн-система ✅
4. Фронтенд: кабинеты и админка ✅
5. Seed, тесты, Docker, деплой ✅
