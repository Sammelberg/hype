#!/usr/bin/env python3
"""Подбор скиллов под промт. Ищет по manifest.json, ранжирует, печатает пути.

  route.py "промт или задача"            топ-8 совпадений
  route.py -n 15 "..."                   другое число
  route.py --cat styles "..."            только в категории
  route.py --list-cats                   категории и их размеры
  route.py --show <имя>                  карточка скилла: путь, описание, справочники
"""
import argparse, json, os, re, sys

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
}
CAT_HINT = {
    "styles": "style aesthetic visual look theme brand mood",
    "web-effects": "effect webgl threejs shader scroll parallax canvas animation",
    "ux-research": "research ux law usability persona interview strategy critique",
    "marketing": "marketing seo ads email social conversion pricing growth",
    "native": "native ios android expo swiftui material mobile",
    "game-dev": "game gameplay enemy level combat inventory",
    "media": "image video article slides brand asset generation",
    "meta-tooling": "skill authoring capture profiling audit tooling",
    "workflow": "ticket spec issue triage wizard workflow process",
    "core": "",
}


def expand(q):
    """Русские стемы -> английские термины индекса.

    Сопоставляем по НАЧАЛУ слова, иначе 'система' ловится стемом 'тем'
    и запрос про дизайн-систему уезжает в тёмную тему.
    """
    ql = q.lower().replace("ё", "е")
    words = re.findall(r"[a-zа-я0-9\-]+", ql)
    extra = []
    for k, v in LEX.items():
        key = k.replace("ё", "е")
        hit = key in ql if (" " in key or "-" in key) else any(w.startswith(key) for w in words)
        if hit:
            extra.append(v)
    return ql + " " + " ".join(extra)


def tokens(s):
    return [t for t in re.findall(r"[a-zA-Zа-яА-ЯёЁ0-9\-]{3,}", s.lower())]


def score(row, terms, qtext):
    name = row["name"].lower()
    namewords = set(name.split("-"))
    kws = set(row["kw"])
    desc = row["desc"].lower()
    s = 0.0
    for t in terms:
        if t == name:
            s += 30
        elif t in namewords:
            s += 12
        elif t in name:
            s += 6
        if t in kws:
            s += 4
        elif any(t in k or k in t for k in kws):
            s += 1.5
        if t in desc:
            s += 2
    hint = CAT_HINT.get(row["cat"], "")
    if hint:
        s += 1.5 * sum(1 for t in terms if t in hint)
    if row["active"]:
        s *= 0.55  # ядро уже загружено — не занимать им места в выдаче
    return s


def load():
    if not os.path.isfile(MANIFEST):
        sys.exit(f"нет индекса: {MANIFEST}\nпересоберите: route.py --reindex")
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
    terms = list(dict.fromkeys(tokens(expand(q))))
    cand = [r for r in rows if not a.cat or r["cat"] == a.cat]
    ranked = sorted(((score(r, terms, q), r) for r in cand), key=lambda x: -x[0])
    ranked = [(s, r) for s, r in ranked if s > 3]
    lib = [(s, r) for s, r in ranked if not r["active"]][: a.n]
    core = [(s, r) for s, r in ranked if r["active"]][:4]
    if not lib and not core:
        print("совпадений нет — попробуйте другие слова или --cat")
        return

    if lib:
        print("ПОДКЛЮЧИТЬ ИЗ БИБЛИОТЕКИ (прочитать файл; копировать не нужно):")
        for s, r in lib:
            print(f"  {s:6.1f}  {r['name']:<32} [{r['cat']}]")
            print(f"          {r['desc'][:145]}")
            print(f"          {r['path']}/SKILL.md")
            if r["refs"]:
                print(f"          + {', '.join(r['refs'][:5])}")
    if core:
        print("\nУЖЕ В ЯДРЕ (доступны сразу, читать не нужно):")
        for s, r in core:
            print(f"  {r['name']:<32} {r['desc'][:95]}")


if __name__ == "__main__":
    main()
