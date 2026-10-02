# Starter

Стартовый шаблон для сайтов: Next.js 16 · собственная CMS (Drizzle + Postgres, админка на shadcn/ui) ·
React 19 · Tailwind v4 · TypeScript · pnpm. Немецкий интерфейс (Anrede „Sie“), суверенитет данных
(CSP только same-origin, без внешних сервисов), полный набор `.claude` (скиллы, хуки, `CLAUDE.md`).

Дизайн сайта в шаблоне нейтральный: каждый проект получает свой с нуля. Админка (`/admin`) — своя,
«Forstamt»: светлая «бумага» с еловым акцентом, тёмный режим, ⌘K, черновики, версии, предпросмотр.

## Что уже есть

- **CMS без сторонних сервисов**: страницы с вложенностью и черновиками, проекты, настройки сайта,
  медиа (варианты через sharp, фокусная точка), редиректы, полнотекстовый поиск (Postgres, `german`),
  контактная форма с редактируемыми полями и входящими, версии с восстановлением, живой предпросмотр,
  мгновенная пересборка при публикации, свои аккаунты (argon2id, сессии в базе, блокировка).
- **Маршруты**: `/` (страница `startseite`), любые страницы CMS, `/projekte/[slug]`, `/kontakt`
  (валидация, honeypot, без e-mail-сервисов), `/suche`, Impressum/Datenschutz, 404/ошибки, sitemap,
  robots, OG-картинки, иконки.
- **Качество**: Vitest (чистая логика + тесты репозиториев на живой базе), Playwright (a11y WCAG 2 AA,
  суверенитет данных, сайт и админка), ESLint без предупреждений, Prettier, commitlint, CI, Dependabot.

## Новый проект

### Из GitHub-шаблона

```bash
gh repo create kunde-x --template Sammelberg/start --private --clone
cd kunde-x
pnpm install
pnpm init:project
```

### Из локальной копии (без GitHub)

```bash
git clone --depth 1 ~/Schreibtisch/starter ~/Schreibtisch/kunde-x
cd ~/Schreibtisch/kunde-x
pnpm install
pnpm init:project
```

`pnpm init:project` спрашивает имя проекта, название сайта, владельца, e-mail, порты приложения и
Postgres (предлагает первые свободные), затем:

- переписывает `package.json` (порт `pnpm dev`), `docker-compose.yml` (своё имя контейнера и
  порт — проекты не мешают друг другу), CI, Playwright, `.env.example`, создаёт `.env`;
- подставляет название и владельца в сид-данные, `CLAUDE.md` (раздел „Project“), `README.md`, Reticle;
- подключает библиотеку скиллов (симлинки, если она есть на машине) и строит индекс graft;
- по желанию начинает чистую git-историю с одним коммитом.

Без вопросов: `pnpm init:project --yes --name kunde-x --site-name "Kunde X" --owner "Kunde X GmbH"
--email hallo@kunde-x.de --git fresh`.

Дальше:

```bash
pnpm db:up     # Postgres в Docker
pnpm migrate   # таблицы CMS (схема `cms`)
pnpm seed      # примерные страницы, форма, редирект, настройки
pnpm cms:passwort ihre@adresse.de --anlegen   # первый аккаунт, временный пароль один раз
pnpm dev       # http://localhost:<порт приложения>/admin
```

## После старта

1. Придумать дизайн проекта с нуля (скиллы `frontend-design`, `variate`): палитра и тема в
   `globals.css`, шрифты, шапка, главная. Итог записать в `CLAUDE.md` → „Project“ → „Design direction“.
2. Логотип: положить в `public/brand/`, шапка (`site-header.tsx`), иконки `icon.png`/`apple-icon.png`
   вместо сгенерированных `icon.tsx`/`apple-icon.tsx`, OG-картинка.
3. Новая коллекция с собственными URL (блог, услуги): таблица в `src/cms/db/schema.ts`, репозиторий в
   `src/cms/content/`, маршрут, раздел в админке — скилл `cms-section` ведёт по всем шагам.
4. Настоящие тексты Impressum и Datenschutz.
5. Схема изменилась → `pnpm migrate:create <имя>`, проверить SQL, закоммитить `src/cms/migrations/`.

Проверка перед сдачей: `pnpm check` и `pnpm test:e2e`. Правила проекта для агента — в `CLAUDE.md`
(раздел „Project“ заполнить сразу).

## Эксплуатация на сервере

Деплой, обновления через git с автодеплоем, ночные задачи и общий вход с HTTPS описаны в
[`deploy/README.md`](deploy/README.md). Здесь только то, что важно знать о работе приложения.

- **Переменные окружения** (`deploy/.env`, создаёт `deploy/einrichten.sh`): `NEXT_PUBLIC_SERVER_URL`
  (https), `FORM_SECRET` и `CRON_SECRET` (у каждого сервера свои), `POSTGRES_PASSWORD`.
  `DATABASE_URL` и `MEDIA_DIR` задаёт `deploy/compose.yml`.
- **Прокси впереди обязателен.** Приложение снаружи видно только через Caddy общего входа. Caddy
  сам записывает адрес клиента в `X-Forwarded-For`. Лимиты на вход и на форму доверяют только этой
  последней записи, поэтому без прокси их легко обойти.
- **Первый аккаунт:** `deploy/admin.sh <e-mail>` (на сервере), локально
  `pnpm cms:passwort <e-mail> --anlegen`. Страницы для первичной настройки нет.
- **Публикация по расписанию** (`pnpm cms:geplant`, на сервере `deploy/aufgabe.sh geplant` каждые
  5 минут): спрашивает работающее приложение (`POST /next/geplant` с `CRON_SECRET`), оно публикует
  страницы и проекты, чьё время пришло, и пересобирает их.
- **Сроки хранения** (`pnpm cms:aufbewahrung`, на сервере каждую ночь): заявки удаляются через
  6 месяцев, прочитанные они или нет; заодно удаляются истёкшие сессии и старые счётчики лимитов.
  Каждый прогон пишется в журнал. Сам журнал и счета не удаляются.
- **Бэкап** (`scripts/backup/sicherung.sh`, restic, данные шифруются ещё на сервере). Нужны
  `RESTIC_REPOSITORY`, `RESTIC_PASSWORD_FILE` и `PG_CONTAINER=schwarzwald-prod-postgres-1`.
  Репозиторий создаётся один раз: `restic init`. Цель ещё не выбрана: объектное хранилище IONOS
  или второй сервер, в любом случае в Германии.
  - Группа `starter-daten` (база без заявок и медиатека) хранится 14 дней, 8 недель, 24 месяца и
    10 лет. Счета нужно держать 8 лет.
  - Группа `starter-anfragen` (только заявки) хранится 14 дней. Это обещает Datenschutzerklärung.
  - Ключ restic хранится отдельно от сервера: без него ни один снимок не прочитать.
- **Проверка восстановления** (`scripts/backup/wiederherstellung-test.sh`) поднимает последние снимки
  во временную базу и сравнивает их с живыми данными: число строк, цепочку журнала, триггеры GoBD,
  загруженные файлы. Настоящее восстановление делается теми же шагами, они описаны в шапке скрипта.
- **Контент на сервере** правится в админке. Полный `pnpm seed` там не запускается: он затёр бы
  правки. Первый контент переносится из локальной базы (`scripts/inhalt-exportieren.sh`).

## Скиллы

Все скиллы из таблицы в `CLAUDE.md` лежат в `.claude/skills/`: свои и ядро, скопированное из
`~/.claude/skills` (список — `.claude/skills/skill-router/vendored-skills.txt`). Поправили скилл
в `~/.claude/skills` — обновите копии: `.claude/skills/skill-router/scripts/vendor-skills.sh`.
Библиотека (~470 скиллов для роутера) — локальные симлинки:
`.claude/skills/skill-router/scripts/link-library.sh`.

## Обновление самого шаблона

Шаблон — обычный проект: правки коммитятся сюда, новые проекты получают их при создании. В уже
созданные проекты изменения переносятся вручную (`git diff` шаблона → патч).
