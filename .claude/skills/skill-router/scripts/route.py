#!/usr/bin/env python3
"""Подбор скиллов под промт. Ищет по manifest.json, ранжирует, печатает пути.

  route.py "промт или задача"            топ-8 совпадений
  route.py -n 15 "..."                   другое число
  route.py --cat styles "..."            только в категории
  route.py --list-cats                   категории и их размеры
  route.py --show <имя>                  карточка скилла: путь, описание, справочники

Поиск: BM25 по полям скилла (имя, триггеры из aliases.json, описание, текст) с лёгким
стеммингом для русского, немецкого и английского.
"""
import argparse, json, math, os, pickle, re, sys

def _find_manifest():
    """Ищем индекс вверх по дереву — скрипт работает из любой точки проекта."""
    here = os.path.abspath(os.path.dirname(__file__))
    for base in (here, os.getcwd()):
        d = base
        for _ in range(8):
            c = os.path.join(d, ".claude", "skills-library", "manifest.json")
            if os.path.isfile(c):
                return c
            nd = os.path.dirname(d)
            if nd == d:
                break
            d = nd
    return os.path.join(here, "..", "..", "..", "skills-library", "manifest.json")


MANIFEST = _find_manifest()
ROOT = os.path.abspath(os.path.join(os.path.dirname(MANIFEST), "..", ".."))

# Русские и разговорные термины -> английские, которыми размечен индекс.
LEX = {
    "цвет": "color palette", "цвета": "color palette", "палитр": "palette color",
    "шрифт": "typography font", "типографик": "typography type", "текст": "copy writing text",
    "отступ": "spacing padding", "спейсинг": "spacing", "сетк": "grid layout",
    "верстк": "layout css", "макет": "layout mockup", "лейаут": "layout",
    "анимац": "animation motion", "движен": "motion animation", "переход": "transition animation",
    "скролл": "scroll scrolltrigger", "паралакс": "parallax scroll", "параллакс": "parallax scroll",
    "кнопк": "button component", "форм": "form input", "инпут": "input form",
    "модал": "modal dialog overlay", "тост": "toast notification", "таблиц": "table data",
    "график": "chart data visualization", "диаграм": "chart diagram",
    "иконк": "icon", "логотип": "logo brand", "картинк": "image asset", "изображен": "image asset",
    "тем": "theme theming dark mode", "темн": "dark mode theme", "светл": "light mode theme",
    "токен": "token design token", "переменн": "variable token css",
    "компонент": "component", "библиотек": "library component",
    "доступност": "accessibility a11y", "контраст": "contrast accessibility",
    "адаптив": "responsive breakpoint", "мобильн": "mobile responsive native",
    "лендинг": "landing page marketing", "главн": "landing hero page",
    "дашборд": "dashboard admin", "админк": "admin dashboard",
    "презентац": "slides presentation deck", "статья": "article content",
    "бренд": "brand identity", "стил": "style aesthetic visual",
    "минимал": "minimal clean", "брутал": "brutalism raw", "стекл": "glassmorphism glass",
    "ретро": "retro vintage", "неон": "neon glow", "градиент": "gradient",
    "тен": "shadow elevation", "скруглен": "radius rounded corner",
    "редизайн": "redesign audit improve", "аудит": "audit review critique",
    "критик": "critique review", "ревью": "review audit", "полиров": "polish refine",
    "проверк": "audit test qa", "тест": "test qa testing", "баг": "bug debug diagnose",
    "безопасн": "security vulnerability audit", "уязвим": "security vulnerability",
    "производительност": "performance optimize", "оптимиз": "optimize performance",
    "рефактор": "refactor architecture", "архитектур": "architecture design module",
    "исследован": "research user interview", "интервью": "interview research",
    "персон": "persona user research", "путь польз": "journey map",
    "маркетинг": "marketing growth", "реклам": "ads advertising campaign",
    "рассылк": "email newsletter", "письм": "email cold outreach",
    "соцсет": "social media content", "сео": "seo search", "seo": "seo search",
    "конверс": "conversion cro funnel", "цен": "pricing offer",
    "воронк": "funnel conversion", "запуск": "launch go-to-market",
    "игр": "game gameplay", "3d": "threejs webgl 3d", "шейдер": "shader webgl",
    "нативн": "native ios android", "мобильное прил": "mobile app native",
    "документац": "documentation docs", "спек": "spec specification",
    "тикет": "ticket issue task", "план": "plan planning roadmap",
    "промт": "prompt engineering", "скилл": "skill authoring",
    "видео": "video", "звук": "audio sound", "голос": "voice tts",
    "герой": "hero section", "секц": "section layout", "карточк": "card component",
    "навигац": "navigation menu nav", "меню": "menu navigation",
    "загрузк": "loading skeleton state", "состояни": "state variant",
    "пуст": "empty state", "ошибк": "error state handling",
    "онбординг": "onboarding first-run", "слоп": "slop generic ai-generated",
    "размыт": "blur backdrop progressive", "блюр": "blur backdrop",
    "маск": "mask masking reveal", "появлен": "reveal enter animation",
    "бегущ": "marquee loop ticker", "курсор": "cursor pointer trail",
    "частиц": "particle emitter", "свечен": "glow beam neon",
    "граница": "border outline", "рамк": "border frame", "обводк": "border outline",
    "фон": "background surface", "текстур": "texture pattern noise",
    "сайдбар": "sidebar navigation", "хедер": "header nav top-bar",
    "футер": "footer", "прайс": "pricing page plan", "тариф": "pricing plan",
    "портфолио": "portfolio editorial", "блог": "blog article editorial",
    "магазин": "ecommerce shop product", "корзин": "cart checkout ecommerce",
    "поиск": "search ux", "фильтр": "filter facet search",
    "локализац": "localization i18n", "перевод": "localization i18n translation",
    "печат": "print poster editorial", "постер": "poster print",
    "экспорт": "export capture screenshot", "скриншот": "screenshot capture",
    "сравнен": "comparison competitor", "конкурент": "competitor comparison",
    "метрик": "metrics analytics measurement", "аналитик": "analytics metrics",
    "документ": "documentation docs spec", "гайд": "guideline documentation",
    "система": "system design-system tokens", "дизайн-систем": "design system tokens",
    "верстальщик": "frontend css layout", "фронт": "frontend web ui",
    "реакт": "react component", "next": "nextjs react", "тейлвинд": "tailwind css",
    "свифт": "swift swiftui ios", "андроид": "android material native",
    "экран": "screen viewport page", "страниц": "page screen layout",
    # Разговорные слова владельца: чем он описывает проблему, а не термин.
    "нейросет": "ai generated slop", "ии": "ai generated slop", "шаблонн": "generic slop",
    "лаг": "performance jank", "тормоз": "performance jank", "висн": "performance freeze",
    "подвис": "performance jank", "груз": "loading performance", "долго": "performance loading",
    "всплываш": "toast notification", "уведомлен": "notification toast",
    "либу": "library package", "либа": "library package", "либы": "library package",
    "газет": "press media public relations", "журнал": "press media magazine", "пресс": "press media",
    "интервью в": "press interview", "заявк": "inquiry conversion lead", "обращен": "inquiry lead",
    "дыры в без": "security vulnerability", "взлом": "security attack", "взгляд": "attention hierarchy focus",
    "внимани": "attention hierarchy", "бросается": "emphasis hierarchy", "дырк": "gap empty state",
    "пересобер": "refactor", "разнес": "critique challenge grill", "покритику": "critique review",
    "стиль сайт": "design direction style guide", "вкус": "taste aesthetic direction",
    "повтор": "recreate reference", "референс": "reference inspiration", "чуж": "reference external site",
    "фотк": "photo image", "фото": "photo image photography", "ролик": "video film",
    "съемк": "shoot photography production", "клиент": "client customer", "заказчик": "client customer",
    "конкурент": "competitor", "коллег": "competitor peer", "продвиж": "marketing promotion growth",
    "инстаграм": "instagram social", "сторис": "instagram social", "посты": "post social", "постов": "post social",
}
# Немецкие разговорные слова — к английским терминам индекса.
LEX_DE = {
    "anfrag": "inquiry conversion lead", "kontaktseit": "contact form conversion",
    "kontaktformular": "contact form", "titelbild": "image cover", "generier": "generate image",
    "bild": "image photo", "foto": "photo image", "presse": "press media",
    "wettbewerb": "competitor", "konkurrent": "competitor", "beitrag": "post social",
    "lad": "loading", "langsam": "performance slow", "sicherheit": "security",
}



ALIASES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "aliases.json")

# Вес поля в BM25: имя и триггеры решают, текст скилла лишь добирает.
FIELDS = {"name": 3.0, "alias": 3.0, "desc": 2.0, "body": 0.5}
# Нормализация по длине: триггеры — независимые фразы, их число не должно ослаблять каждую.
FIELD_B = {"name": 0.3, "alias": 0.0, "desc": 0.75, "body": 0.75}
K1 = 1.2

STOPWORDS = set("""и в во на с со по к ко о об от до из за для что как это то же ли не ни а но или
у при над под про без так там тут где когда чтобы нужно надо можно сделать сделай хочу мне нам
наш наша наши свой все всё его её их она они оно был была были быть есть этот эта эти тот та те
пока чтоб типа вот еще ещё очень просто вообще уже тоже также потом сам сама весь вся всех чем если раз
даже только какой какая какие какое кто кого чего где-то как-то тоже будет было давай пусть сейчас
der die das und oder mit von für auf ein eine einer eines den dem des ist sind wie was bei im zu
the a an and or of for to in on with is are be as by it this that from at into how what when""".split())

RU_END = sorted("""иями ями ами ией ого его ому ему ыми ими ией иях ах ях ов ев ей ой ый ий ая яя
ое ее ые ие ам ям ом ем ую юю ии ия ью ть ет ют ат ят ит ишь ешь ся сь а я о е ы и у ю ь й""".split(),
                key=len, reverse=True)
LAT_END = ["ations", "ation", "ings", "ing", "ies", "es", "ed", "ly", "en", "er", "s", "e", "n"]


def stem(w):
    w = w.lower().replace("ё", "е")
    if re.search("[а-я]", w):
        for e in RU_END:
            if w.endswith(e) and len(w) - len(e) >= 3:
                return w[: -len(e)]
        return w
    w = w.replace("ä", "a").replace("ö", "o").replace("ü", "u").replace("ß", "ss")
    for e in LAT_END:
        if w.endswith(e) and len(w) - len(e) >= 4:
            return w[: -len(e)]
    return w


def terms(text):
    words = re.findall(r"[a-zа-яёäöüß0-9]+", text.lower())
    return [stem(w) for w in words if len(w) >= 2 and w not in STOPWORDS]


def expand(q):
    """Запрос + английские термины индекса для русских слов (по НАЧАЛУ слова: иначе 'система'
    ловится стемом 'тем' и дизайн-система уезжает в тёмную тему)."""
    ql = q.lower().replace("ё", "е")
    words = re.findall(r"[a-zа-я0-9\-]+", ql)
    extra = []
    for k, v in LEX.items():
        key = k.replace("ё", "е")
        hit = key in ql if (" " in key or "-" in key) else any(w.startswith(key) for w in words)
        if hit:
            extra.append(v)
    for w in re.findall(r"[a-zäöüß]+", ql):
        extra += [v for k, v in LEX_DE.items() if w.startswith(k)]
    return terms(q), terms(" ".join(extra))


_INDEX = {}


def index(rows):
    """Частоты термов по полям и IDF. Кэш на диске рядом с manifest.json: сборка индекса
    занимает ~0.3 с, поиск — миллисекунды. Кэш сбрасывается, когда меняется
    индекс, триггеры или этот файл."""
    key = id(rows)
    if key in _INDEX:
        return _INDEX[key]
    stamp = tuple(os.path.getmtime(p) if os.path.isfile(p) else 0
                  for p in (MANIFEST, ALIASES_FILE, os.path.abspath(__file__)))
    cache = os.path.join(os.path.dirname(MANIFEST), ".route-index.pkl")
    try:
        with open(cache, "rb") as f:
            saved_stamp, saved = pickle.load(f)
        if saved_stamp == stamp and len(saved[0]) == len(rows):
            _INDEX[key] = saved
            return saved
    except (OSError, EOFError, pickle.UnpicklingError, ValueError):
        pass
    aliases = {}
    if os.path.isfile(ALIASES_FILE):
        aliases = {k: v for k, v in json.load(open(ALIASES_FILE, encoding="utf-8")).items()
                   if not k.startswith("_")}
    docs = []
    for r in rows:
        fields = {
            "name": terms(r["name"].replace("-", " ")),
            "alias": terms(" ".join(aliases.get(r["name"], []))),
            "desc": terms(r["desc"] + " " + " ".join(r["kw"])),
            "body": terms(r.get("body", "")),
        }
        tf = {f: {} for f in FIELDS}
        for f, ts in fields.items():
            for t in ts:
                tf[f][t] = tf[f].get(t, 0) + 1
        docs.append((r, tf, {f: len(ts) for f, ts in fields.items()}))
    n = len(docs)
    avg = {f: max(1.0, sum(d[2][f] for d in docs) / n) for f in FIELDS}
    df = {}
    for _, tf, _ in docs:
        for t in set().union(*(tf[f].keys() for f in FIELDS)):
            df[t] = df.get(t, 0) + 1
    idf = {t: math.log(1 + (n - c + 0.5) / (c + 0.5)) for t, c in df.items()}
    _INDEX[key] = (docs, avg, idf)
    try:
        with open(cache, "wb") as f:
            pickle.dump((stamp, _INDEX[key]), f)
    except OSError:
        pass
    return _INDEX[key]


def score(doc, avg, idf, qterms, weight=1.0):
    r, tf, ln = doc
    s = 0.0
    for t in set(qterms):
        w = 0.0
        for f, fw in FIELDS.items():
            c = tf[f].get(t, 0)
            if c:
                b = FIELD_B[f]
                w += fw * c / (c + K1 * (1 - b + b * ln[f] / avg[f]))
        s += idf.get(t, 0) * w * weight
    return s


def rank(rows, q, cat=None):
    """(библиотека, ядро, исключённые): списки (оценка, скилл) по убыванию."""
    docs, avg, idf = index(rows)
    own, extra = expand(q)
    ranked = []
    for doc in docs:
        if cat and doc[0]["cat"] != cat:
            continue
        s = score(doc, avg, idf, own) + score(doc, avg, idf, extra, 0.4)
        if s > 0:
            ranked.append((s, doc[0]))
    ranked.sort(key=lambda x: -x[0])
    blocked = [r["name"] for s, r in ranked[:15] if r["name"] in BLOCKED][:5]
    ranked = [(s, r) for s, r in ranked if r["name"] not in BLOCKED]
    lib = [(s, r) for s, r in ranked if not r["active"] and r["name"] not in DUPLICATES]
    core = [(s, r) for s, r in ranked if r["active"]][:4]
    return lib, core, blocked


# Скиллы, которые в этом проекте вредят (проверено полным чтением библиотеки 2026-09-24).
# BLOCKED в выдачу не попадают; WARN показываются с пометкой — брать только идею.
BLOCKED = {
    "dark-mode-design": "переключатель тем и обесцвечивание фирменного цвета; сайт только тёмный",
    "spacing-system": "сетка 4/8 вместо Фибоначчи",
    "layout-grid": "сетка 4/8 вместо Фибоначчи и золотого сечения",
    "motion-system": "токены противоречат animate и globals.css",
    "theming-system": "архитектура нескольких тем; сайт только тёмный",
    "expo-data-fetching": "React Native; требует себя для любой сетевой работы",
    "performance-profiling": "только Apple Instruments, не веб",
    "marketing-psychology": "opt-out-подписки и давление — нарушает DSGVO/UWG",
    "tastemaker": "сам ходит в Openverse/Pixabay/Iconify, пишет в ~/.tastemaker",
    "ui-ux-pro-max": "сломанный путь к скрипту (CLAUDE_PLUGIN_ROOT)",
    "frontend-ui-ux": "ссылки на несуществующие файлы, ставит зависимости, curl lazyweb.com",
    "anti-ui-slop": "платный MCP UIZZE — внешний сервис",
    "aura-asset-images": "удалённые картинки (Supabase-хотлинки)",
    "unsplash-asset-images": "удалённые стоковые картинки",
    "gpt-image-2": "ключи уходят на сторонние шлюзы",
    "design": "Gemini API и несуществующие скиллы",
    "banner-design": "Gemini API и несуществующие скиллы",
    "premium-frontend-ui": "Lenis с CDN, устаревший @studio-freight/lenis",
    "gpt-taste": "picsum, анимация на всём, «симуляция Python»",
    "design-taste-frontend-v1": "picsum, бесконечные микро-анимации; есть v2",
    "tailwindcss": "советы Tailwind v3, у нас v4",
    "gsap": "убивает все ScrollTrigger страницы; есть официальные gsap-*",
    "animation-on-scroll": "вставляет <script> в <head>, нет prefers-reduced-motion",
    "staggered-word-reveal": "aria-label на <p> роняет axe; лучше scroll-scrubbed-word-reveal",
}
WARN = {
    "masked-reveal": "aria-label на <p> роняет axe; разметку брать из scroll-scrubbed-word-reveal",
    "cinematic-gsap-lenis-motion-system": "ванильный код и aria-label на <p>; переносить на useGSAP",
    "cinematic-scroll-storytelling": "то же, что cinematic-gsap-lenis-motion-system",
    "design-taste-frontend": "picsum и CDN-иконки, запрет тире ломает немецкую типографику",
    "taste-redesign-existing-projects": "picsum, выдуманные данные, cookie-баннер по умолчанию",
    "editorial-portfolio-chapters": "цветовые поля проектов — не брать, палитра фиксирована",
    "webgl-laser": "resize запускает лишний rAF-цикл, нет паузы за экраном",
    "directory-submissions": "непроверенная статистика",
}


# Библиотечные копии скиллов, которые уже доступны (ядро проекта или ~/.claude/skills):
# в выдаче они только занимают места.
DUPLICATES = {
    "copywriting": "copywriting-de", "product-marketing": "product-marketing-de",
    "seo-audit": "seo-audit-de", "ai-seo": "ai-seo-de", "vermenschlichen": "vermenschlichen",
    "schema": "schema", "case-study": "case-study", "minimalist-ui": "minimalist-ui",
    "industrial-brutalist-ui": "industrial-brutalist-ui",
}


def load():
    if not os.path.isfile(MANIFEST):
        sys.exit(f"нет индекса: {MANIFEST}\nпересоберите: reindex.py")
    return json.load(open(MANIFEST, encoding="utf-8"))


def main():
    p = argparse.ArgumentParser(add_help=False)
    p.add_argument("query", nargs="*")
    p.add_argument("-n", type=int, default=8)
    p.add_argument("--cat")
    p.add_argument("--list-cats", action="store_true")
    p.add_argument("--show")
    p.add_argument("-h", "--help", action="store_true")
    a = p.parse_args()
    if a.help:
        print(__doc__)
        return
    rows = load()

    if a.list_cats:
        cats = {}
        for r in rows:
            cats.setdefault(r["cat"], 0)
            cats[r["cat"]] += 1
        for c, n in sorted(cats.items(), key=lambda x: -x[1]):
            print(f"{n:>4}  {c}")
        return

    if a.show:
        for r in rows:
            if r["name"] == a.show:
                print(f"{r['name']}  [{r['cat']}{'/АКТИВЕН' if r['active'] else ''}]")
                if r["name"] in BLOCKED:
                    print(f"ЗАБЛОКИРОВАН для проекта: {BLOCKED[r['name']]}")
                elif r["name"] in WARN:
                    print(f"⚠ {WARN[r['name']]}")
                print(f"путь: {r['path']}/SKILL.md")
                print(f"описание: {r['desc']}")
                if r["refs"]:
                    print("справочники: " + ", ".join(r["refs"]))
                return
        sys.exit(f"не найден: {a.show}")

    q = " ".join(a.query)
    if not q:
        print(__doc__)
        return
    lib, core, blocked = rank(rows, q, a.cat)
    lib = lib[: a.n]
    if not lib and not core:
        print("совпадений нет — попробуйте другие слова или --cat")
        return

    if lib:
        print("ПОДКЛЮЧИТЬ ИЗ БИБЛИОТЕКИ (прочитать файл; копировать не нужно):")
        for s, r in lib:
            print(f"  {s:6.1f}  {r['name']:<32} [{r['cat']}]")
            print(f"          {r['desc'][:145]}")
            if r["name"] in WARN:
                print(f"          ⚠ {WARN[r['name']]}")
            print(f"          {r['path']}/SKILL.md")
            if r["refs"]:
                print(f"          + {', '.join(r['refs'][:5])}")
    if core:
        print("\nУЖЕ В ЯДРЕ (доступны сразу, читать не нужно):")
        for s, r in core:
            print(f"  {r['name']:<32} {r['desc'][:95]}")
    if blocked:
        print("\nИСКЛЮЧЕНЫ для проекта (route.py, BLOCKED): " + ", ".join(blocked))


if __name__ == "__main__":
    main()
