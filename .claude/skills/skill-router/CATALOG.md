# Каталог библиотеки скиллов

Скиллы ниже не загружены, но проверены полным чтением и полезны этому проекту. Когда задача
совпадает с описанием по смыслу — даже если пользователь описывает ситуацию или симптом, а не
приём, — прочитай `.claude/skills-library/<путь>/SKILL.md` перед работой и одной строкой скажи,
что подключил. Правила CLAUDE.md сильнее скилла. Чего здесь нет — ищи
`python3 .claude/skills/skill-router/scripts/route.py "<задача>"` (ещё ~400 скиллов).
Библиотеки нет (`.claude/skills-library/` пуст) — `.claude/skills/skill-router/scripts/link-library.sh`.

## Скролл, движение, эффекты

- `web-effects/scroll-scrubbed-word-reveal` — текст проявляется слово за словом в такт прокрутке, обратимо, с доступной копией.
- `web-effects/masked-reveal` — слова заголовка выезжают из-под невидимой линии при входе в экран (⚠ разметку брать из word-reveal).
- `web-effects/scroll-scrubbed-visual-sequence` — видео или серия кадров перематывается прокруткой на липкой сцене.
- `web-effects/scroll-progress-timeline` — этапы процесса с линией, которая заполняется при прокрутке.
- `web-effects/reveal-hover-effect` — под курсором проявляется второе изображение: до/после, ч/б→цвет, ретушь.
- `web-effects/progressive-blur` — плавно нарастающее размытие, например шапка поверх фото.
- `web-effects/css-alpha-masking` — края ленты или галереи мягко уходят в прозрачность.
- `web-effects/cinematic-gsap-lenis-motion-system` — «дорогое кино»: система плавного скролла, пинов и выездов (⚠ перенести на useGSAP).
- `web-effects/cinematic-scroll-storytelling` — стопка карточек на скролле, футер, открывающийся снизу.
- `web-effects/build-threejs-scroll-worlds` — вся страница как 3D-пространство, камера летит при прокрутке.
- `web-effects/scroll-world-storytelling` — выбор формы для длинной истории/кейса на скролле.
- `web-effects/add-mouse-driven-orbit` — 3D-объект или камера спокойно поворачиваются за мышью.
- `kern/gsap-plugins` — Flip (элемент перелетает на новое место), SplitText (текст на буквы/слова), Observer, DrawSVG, ScrollTo.
- `kern/gsap-utils` — пересчёт чисел: mapRange, clamp, interpolate, wrap, snap.
- `kern/improve-animations` — обзор всех анимаций сайта с планом, что переделать, без правок.
- `meta-tooling/optimize-web-animations` — сайт со временем тормозит, греется, «течёт»: анимации и циклы за экраном, утечки.
- `kern/animation-vocabulary` — как называется эффект, который пользователь описывает словами.
- `media/video-to-superprompt` — разобрать видео с чужим эффектом или сайтом в точное описание для повторения.
- `kern/explain-interface` — как сделан эффект или переход на чужом сайте (по ссылке).

## Интерфейс и UX

- `ux-research/form-design` — форма: какие поля, порядок, подписи, валидация, длина.
- `ux-research/error-handling-ux` — что и как сказать при ошибке, страницы ошибок.
- `ux-research/feedback-patterns` — подтверждение действия: «сообщение отправлено», тост или сообщение в строке.
- `kern/ask-sonner` — всплывающие уведомления на библиотеке sonner (уже в зависимостях): подключение и настройка.
- `ux-research/loading-states` — что показать, пока грузятся фото и страницы: скелетоны, пустые белые места.
- `ux-research/search-ux` — поиск по сайту: пустой результат, подсветка, количество.
- `ux-research/navigation-patterns` — меню, вкладки, бургер, хлебные крошки, активный пункт.
- `ux-research/information-architecture` — структура разделов и контента сайта.
- `ux-research/critique-visual-hierarchy` — взгляд падает не туда: что первым бросается в глаза и почему.
- `ux-research/critique-composition` — секция ощущается несбалансированной: перегруз, пустота, ритм.
- `ux-research/critique-affordance` — непонятно, что кликабельно.
- `ux-research/law-of-figure-ground` — текст плохо читается поверх фото.
- `ux-research/heuristic-evaluation` — юзабилити-проверка по эвристикам Нильсена.
- `ux-research/doherty-threshold` — сайт кажется медленным в отклике, когда нужен индикатор.
- `ux-research/state-machine` — состояния формы или сложного элемента.
- `ux-research/gesture-patterns` — свайпы и перетаскивание на тач-устройствах.
- `ux-research/peak-end-rule` — сильный финал: конец формы, кейса, главной.
- `ux-research/design-token-audit` — значения, захардкоженные мимо токенов.
- `ux-research/design-qa-checklist` — чеклист перед сдачей: все состояния, размеры, reduced motion.
- `kern/better-layout` — вёрстка разваливается на планшете или мобильном: группировка, порядок, перестроение.
- `kern/better-ui` — мелкая полировка: радиусы, обводки фото в тёмной теме, переходы.
- `kern/better-writing` — тексты кнопок, ошибок, пустых состояний (немецкий — через copywriting-de).
- `kern/better-interface` — комплексный разбор экрана по всем осям одним вердиктом.
- `kern/interface-review` — разбор изменений интерфейса в текущей работе или ветке.
- `kern/design-md-planner` — зафиксировать визуальный стиль сайта в одном документе по интервью.

## Раскладки и стили (только по запросу, палитра и сетка проекта сильнее)

- `styles/editorial-portfolio-chapters` — главная как журнал: работы, услуги или темы большими главами (⚠ без цветовых полей).
- `styles/documentary-brutalist-agency` — сайт агентства или студии, документальная подача.
- `styles/image-first-grid-layout` — изображения на весь экран, сетка, где картинки ведут.
- `styles/framed-grid-layout` — сетка в тонких рамках с уголками.
- `styles/split-layout-technical` — две колонки: медиа и технические данные.
- `styles/technical-wireframe-info-layout` — каркасный 3D-объект с подписями.
- `meta-tooling/no-ai-design-slop` — убрать шаблонность «как от нейросети» при редизайне.
- `meta-tooling/audit-ai-design-slop` — проверить, что выдаёт в сайте ИИ-шаблон, отчёт без правок.
- `meta-tooling/audit-reference-originality` — не получилось ли слишком похоже на референс.

## Контент, маркетинг, права

- `marketing/image` — права на фото (люди в кадре, клиенты, здания), alt-тексты, оптимизация, можно ли генерировать картинки.
- `marketing/customer-research` — отзывы и цитаты клиентов с согласием (DSGVO).
- `marketing/content-strategy` — о чём писать: блог, журнал, план публикаций.
- `marketing/social` — посты для Instagram/LinkedIn из материалов сайта, контент-план.
- `marketing/public-relations` — пресса, пресс-кит, мероприятия, запуск.
- `marketing/cro` — люди смотрят сайт, но не пишут: почему мало заявок.
- `marketing/marketing-ideas` — как получать больше заказов, идеи продвижения.
- `marketing/competitor-profiling` — разобрать конкурента: подача, цены, аудитория.
- `marketing/competitors` — страница сравнения с конкурентом (редко нужна).
- `marketing/site-architecture` — карта сайта, структура URL, внутренние ссылки.

## Работа и процессы

- `kern/security-audit` — проверить сайт на уязвимости: админка, форма, API.
- `kern/grilling` — жёстко проверить план вопросами, прежде чем делать.
- `kern/grill-with-docs` — то же, с записью решений (ADR, глоссарий).
- `kern/handoff` — сохранить, где остановились, чтобы новая сессия продолжила.
- `kern/research` — исследовать вопрос по первоисточникам.
- `kern/prototype-logic` — быстрый прототип логики, чтобы проверить поток.
- `kern/improve-codebase-architecture` — найти, где упростить и углубить модули кода.
- `workflow/resolving-merge-conflicts` — конфликты после pull, merge или rebase.
- `workflow/to-questionnaire` — анкета для владельца или заказчика: юридические тексты, факты, контент.
- `workflow/wizard` — пошаговый скрипт в терминале для ручной настройки (сервер, ключи, деплой).
- `meta-tooling/iterate-until-verified` — большая задача с явными проверками готовности.
- `meta-tooling/stitched-full-page-capture` — скриншот всей страницы выходит пустым из-за анимаций.
