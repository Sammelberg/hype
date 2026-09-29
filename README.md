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
pnpm dev       # http://localhost:<порт приложения>; первый аккаунт — на /admin/einrichtung
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

## Скиллы

Все скиллы из таблицы в `CLAUDE.md` лежат в `.claude/skills/`: свои и ядро, скопированное из
`~/.claude/skills` (список — `.claude/skills/skill-router/vendored-skills.txt`). Поправили скилл
в `~/.claude/skills` — обновите копии: `.claude/skills/skill-router/scripts/vendor-skills.sh`.
Библиотека (~470 скиллов для роутера) — локальные симлинки:
`.claude/skills/skill-router/scripts/link-library.sh`.

## Обновление самого шаблона

Шаблон — обычный проект: правки коммитятся сюда, новые проекты получают их при создании. В уже
созданные проекты изменения переносятся вручную (`git diff` шаблона → патч).
