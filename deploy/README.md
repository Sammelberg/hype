# Деплой на свой сервер (IONOS)

Сайт работает на сервере `31.70.152.175` рядом с другими сайтами (Winterhalder, jpxmedia). У
стека два контейнера, больше ничего:

| Контейнер  | Что делает                                                       |
| ---------- | ---------------------------------------------------------------- |
| `app`      | Сайт и админка (Next.js, своя CMS, бюро со счетами и E-Rechnung) |
| `postgres` | База: страницы, проекты, заявки, клиенты, счета, журнал          |

HTTPS для всех сайтов этого сервера даёт **общий вход** (`edge`, Caddy из проекта `port`,
`~/port/deploy/edge`). Наш `app` подключается к его сети под именем `kern-app`, а файл
сайта `deploy/edge.caddy` (на сервере: `~/port/deploy/edge/sites/kern.caddy`, закоммичен
в `port`) направляет туда домен `example.de` и перенаправляет `www`.

Данные не уходят с сервера: нет внешних сервисов, нет почты, нет аналитики.

## Первая установка

1. **DNS у IONOS** (Domains & SSL → example.de → DNS):
   - `A` для `@` → `31.70.152.175`;
   - запись `AAAA` для `@` удалить: она ведёт на парковку IONOS, и Let's Encrypt проверял бы
     через неё;
   - `A` для `www` → `31.70.152.175`.

   Почта (MX) от этого не меняется.

2. **Доступ сервера к репозиторию** (он приватный): ключ сервера добавить в GitHub →
   Sammelberg/kern → Settings → Deploy keys (только чтение):
   `ssh deploy@31.70.152.175 cat .ssh/id_ed25519.pub` (тот же ключ, что у Winterhalder, GitHub
   принимает один ключ только на один репозиторий: при отказе создать второй и прописать его в
   `~/.ssh/config` для `github.com-start`).
3. **Код:** `git clone git@github.com:Sammelberg/<projekt>.git ~/kern`.
4. **Настройки:** `~/kern/deploy/einrichten.sh` создаёт `deploy/.env` с новыми
   секретами (пароль базы, `FORM_SECRET`, `CRON_SECRET`, `MAIL_SECRET`) и ставит в crontab ночные
   задачи. На уже настроенном сервере `MAIL_SECRET` добавить в `deploy/.env` вручную
   (`openssl rand -base64 48 | tr -d '/+=' | cut -c1-48`), иначе пароль почтового ящика не сохранить.
5. **Контент** (на своём компьютере, один раз): страницы, проект, настройки, редиректы и форма
   из локальной базы:
   `scripts/inhalt-exportieren.sh | ssh deploy@31.70.152.175 'kern/deploy/inhalt.sh'`.
   Если на сервере уже есть страницы, скрипт откажется: дальше контент правится в админке.
6. **Первый доступ в админку:** `ssh deploy@31.70.152.175 'kern/deploy/admin.sh <e-mail>'`
   показывает временный пароль один раз; при первом входе его нужно сменить.
7. **Деплой:** `ssh deploy@31.70.152.175 'kern/deploy/deploy.sh'`. Скрипт запускает
   миграции, собирает образ по боевой базе (страницы пререндерятся из неё) и стартует `app`.
8. **Общий вход:** `deploy/edge.caddy` → `~/port/deploy/edge/sites/kern.caddy`, затем
   `cd ~/port/deploy/edge && docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile`.
   Этот же файл закоммитить в проекте `port`, иначе его следующий `git pull` на сервере
   остановится.
9. **Админка:** `https://example.de/admin` → «Firma»: Steuernummer, IBAN, телефон
   (без них счёт не выставить).

## Обновление

Код и дизайн меняются через git. Как только изменение попадает в `main` на GitHub, сервер
обновляется сам:

1. Изменение попадает в `main`: пуш отсюда, Merge Pull Request в GitHub (в том числе с телефона)
   или облачная сессия Claude Code на `Sammelberg/kern`.
2. GitHub прогоняет CI: проверки, тесты, сборку, e2e. Это около 15 минут.
3. Если CI зелёный, `.github/workflows/deploy.yml` заходит на сервер и запускает
   `git pull --ff-only && deploy/deploy.sh`, затем проверяет, что сайт отвечает. Ещё около
   5 минут.

Вручную тот же деплой: GitHub → Actions → Deploy → Run workflow. С сервера:
`cd ~/kern && git pull && deploy/deploy.sh`.

**Файлы на сервере руками не правим.** Локальная правка остановит `git pull --ff-only`.

**Тексты, проекты, картинки** меняются в админке, без git и без деплоя: публикация сразу
пересобирает страницу.

### Автоматически: ключ GitHub

Ключ в секрете `DEPLOY_SSH_KEY` умеет на сервере только одно. Его строка в
`~deploy/.ssh/authorized_keys`:

```
command="cd ~/kern && git pull --ff-only && deploy/deploy.sh",restrict ssh-ed25519 AAAA… github-deploy-kern
```

Переменные репозитория (Settings → Secrets and variables → Actions → Variables):

| Переменная           | Значение                                     |
| -------------------- | -------------------------------------------- |
| `DEPLOY_HOST`        | `deploy@31.70.152.175`                       |
| `DEPLOY_KNOWN_HOSTS` | вывод `ssh-keyscan -t ed25519 31.70.152.175` |
| `SITE_URL`           | `https://example.de`                         |

## Ночные задачи

`deploy/einrichten.sh` ставит в crontab пользователя `deploy`:

- `deploy/aufgabe.sh aufbewahrung` каждую ночь. Удаляет заявки старше шести месяцев и
  закончившиеся сессии. Это обещает Datenschutzerklärung.
- `deploy/aufgabe.sh geplant` каждые 5 минут. Публикует страницы и проекты, запланированные в
  админке.

Журнал: `~/kern-aufgaben.log`.

## Бэкап

Ещё не настроен: нужно выбрать хранилище (объектное хранилище IONOS или второй сервер, в
Германии). Счета хранятся 8 лет (GoBD), поэтому до первого настоящего счёта бэкап обязателен.
Скрипт `scripts/backup/sicherung.sh` работает с Postgres в Docker: `PG_CONTAINER=kern-prod-postgres-1`.

## Тестовый стенд

Тот же стек локально, без общего входа:

```sh
docker network create kern-edge-test
# deploy/.env: NEXT_PUBLIC_SERVER_URL=http://localhost:3000, POSTGRES_HOST_PORT=5438,
# EDGE_NETWORK=kern-edge-test
deploy/einrichten.sh --ohne-cron && scripts/inhalt-exportieren.sh | deploy/inhalt.sh && deploy/deploy.sh
docker run --rm --network kern-edge-test curlimages/curl -sI http://kern-app:3000/
```

Удалить: `docker compose --env-file deploy/.env -f deploy/compose.yml down -v`.
