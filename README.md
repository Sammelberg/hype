# Starter

Стартовый шаблон для сайтов и приложений: Next.js 16 · Payload CMS 3 (Postgres) · React 19 ·
Tailwind v4 · shadcn/ui · TypeScript · pnpm. Немецкий интерфейс (Anrede „Sie“), суверенитет данных
(CSP только same-origin, без US-SaaS), тёмная палитра с одним акцентом, фибоначчи-сетка, полный
набор `.claude` (скиллы, хуки, `CLAUDE.md`).

## Что уже есть

- **CMS**: страницы с вложенностью, медиа, пользователи, глобальные настройки сайта; черновики,
  живой предпросмотр, мгновенная пересборка при публикации.
- **Маршруты**: `/` (страница `startseite` из CMS), любые страницы CMS, `/kontakt` (форма с
  валидацией, honeypot, без e-mail-сервисов), `/suche`, Impressum/Datenschutz, 404/ошибки, sitemap,
  robots, OG-картинка, иконки.
- **Плагины Payload**: SEO, редиректы (301/302), поиск, конструктор форм, S3 (только свой/EU).
- **Качество**: Vitest, Playwright (a11y WCAG 2 AA, суверенитет данных, форма, меню), ESLint без
  предупреждений, Prettier, commitlint, CI на GitHub Actions, Dependabot.

## Новый проект

### Из GitHub-шаблона

```bash
gh repo create kunde-x --template <owner>/starter --private --clone
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
Postgres (предлагает первые свободные) и акцентный цвет, затем:

- переписывает `package.json` (порт `pnpm dev`), `docker-compose.yml` (своё имя контейнера и
  порт — проекты не мешают друг другу), CI, Playwright, `.env.example`;
- создаёт `.env` со случайным `PAYLOAD_SECRET`;
- ставит акцент в `globals.css` (hex → OKLCH, график и P3 следуют за ним) и в OG-картинку,
  проверяет контраст;
- подставляет название и владельца в сид-данные, `CLAUDE.md` (раздел „Project“), `README.md`, Reticle;
- подключает библиотеку скиллов (симлинки, если она есть на машине) и строит индекс graft;
- по желанию начинает чистую git-историю с одним коммитом.

Без вопросов: `pnpm init:project --yes --name kunde-x --site-name "Kunde X" --owner "Kunde X GmbH"
--email hallo@kunde-x.de --accent "#ff5a1f" --git fresh`.

Дальше:

```bash
pnpm db:up     # Postgres в Docker
pnpm seed      # примерные страницы, форма, редирект
pnpm dev       # http://localhost:<порт приложения>, первый админ — на /admin
```

## После старта

1. Заменить главную (`src/app/(frontend)/page.tsx`) на свои секции — скиллы `frontend-design`,
   `cms-section`.
2. Логотип: положить в `public/brand/` (папки `public/` в шаблоне нет — создать), шапка (`site-header.tsx`), иконки `icon.png`/`apple-icon.png` вместо
   сгенерированных `icon.tsx`/`apple-icon.tsx`, OG-картинка.
3. Новая коллекция с собственными URL (блог, услуги, проекты): маршрут + одна строка в
   `src/cms/paths.ts` — редиректы, поиск, SEO, предпросмотр и sitemap подхватят её сами.
4. Настоящие тексты Impressum и Datenschutz (сид-версии помечены „Platzhalter“).
5. Схема изменилась → `pnpm migrate:create <имя>` и `pnpm generate:types` перед коммитом.

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
