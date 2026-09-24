#!/usr/bin/env python3
"""Проверка лексического роутера (route.py) на задачах этого проекта. Запускать после правки
route.py, aliases.json или индекса. Каталог (CATALOG.md) проверяется отдельно — вслепую моделью.

  bench.py        сводка + провалы
  bench.py -v     каждая строка
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import route  # noqa: E402

# (запрос, допустимые ответы в топ-3 библиотеки)
CASES = [
    ("текст появляется по словам при скролле", {"scroll-scrubbed-word-reveal"}),
    ("видео проигрывается кадрами при прокрутке", {"scroll-scrubbed-visual-sequence"}),
    ("таймлайн этапов работы в кейсе", {"scroll-progress-timeline"}),
    ("сравнение до и после ретуши наведением мыши", {"reveal-hover-effect"}),
    ("как называется эффект когда элемент пружинит", {"animation-vocabulary"}),
    ("аудит безопасности кода", {"security-audit"}),
    ("форма обратной связи ошибки валидации", {"form-design", "error-handling-ux"}),
    ("страница поиска ничего не найдено", {"search-ux"}),
    ("права на фотографии людей и alt тексты", {"image"}),
    ("отзывы клиентов для кейсов", {"customer-research"}),
    ("структура портфолио фотографа главы проекты", {"editorial-portfolio-chapters"}),
    ("разобрать как сделан эффект на чужом сайте", {"explain-interface"}),
    ("по видео-референсу понять анимацию", {"video-to-superprompt"}),
    ("анимации работают за экраном и тормозят", {"optimize-web-animations"}),
    ("анкета для владельца сайта с вопросами", {"to-questionnaire"}),
    ("разрешить конфликт при мерже", {"resolving-merge-conflicts"}),
    ("SplitText Flip плагины gsap", {"gsap-plugins"}),
    ("навигация и хлебные крошки меню", {"navigation-patterns"}),
    ("размытие шапки поверх фотографии", {"progressive-blur"}),
    ("передать работу другому агенту", {"handoff"}),
    # Другие формулировки тех же и соседних задач
    ("слова заголовка проявляются одно за другим пока листаешь", {"scroll-scrubbed-word-reveal", "masked-reveal"}),
    ("шкала прогресса процесса при прокрутке страницы", {"scroll-progress-timeline"}),
    ("vorher nachher Vergleich mit Maus", {"reveal-hover-effect"}),
    ("Bildrechte Personen auf Fotos Einwilligung", {"image"}),
    ("Kundenstimmen einholen DSGVO", {"customer-research"}),
    ("утечки памяти и лишние requestAnimationFrame", {"optimize-web-animations"}),
    ("как на том сайте сделан скролл, повтори", {"explain-interface"}),
    ("вопросы заказчику для юридических текстов", {"to-questionnaire"}),
    ("пустой результат поиска что показать", {"search-ux"}),
    ("сообщение об успешной отправке формы", {"feedback-patterns", "form-design"}),
    ("экран загрузки скелетон", {"loading-states"}),
    ("проверить сайт по эвристикам Нильсена", {"heuristic-evaluation"}),
    ("куда смотрит глаз на секции, иерархия", {"critique-visual-hierarchy"}),
    ("хардкод значений мимо токенов", {"design-token-audit"}),
    ("сайт выглядит как сгенерированный ИИ, убрать шаблонность", {"no-ai-design-slop", "audit-ai-design-slop"}),
    ("не скопировали ли мы референс слишком близко", {"audit-reference-originality"}),
    ("скриншот всей страницы пустой из-за анимаций", {"stitched-full-page-capture"}),
    ("сайт-карта и структура урлов", {"site-architecture", "information-architecture"}),
    ("посты в инстаграм из проектов", {"social"}),
    ("мастер пошаговой настройки сервера для человека", {"wizard"}),
]


# Независимый набор: написан отдельным агентом только по описаниям скиллов, без доступа к
# aliases.json и route.py. Триггеры под эти фразы не подгонять — иначе проверка теряет смысл.
HOLDOUT = [
    ("чтобы заголовок проявлялся по словам пока скроллишь, и назад тоже", {"scroll-scrubbed-word-reveal"}),
    ("хочу на главной чтоб при прокрутке камера как бы проезжала через кадры моего ролика, типа скраббинг видео", {"scroll-scrubbed-visual-sequence"}),
    ("в разделе как я работаю сделай этапы съемки линией которая заполняется при скролле", {"scroll-progress-timeline"}),
    ("навожу мышкой на чб фотку а под курсором она цветная кругом", {"reveal-hover-effect"}),
    ("заголовки секций пусть выезжают снизу из под невидимой линии по одному слову когда доходишь до них", {"masked-reveal"}),
    ("хочу целый 3д мир на фоне где камера летит дальше чем ниже листаешь", {"build-threejs-scroll-worlds"}),
    ("у меня в хиро 3д камера стоит мертво, пусть чуть поворачивается за мышкой но спокойно", {"add-mouse-driven-orbit"}),
    ("шапка поверх фоток, хочу чтоб снизу у нее размытие плавно нарастало слоями а не резко", {"progressive-blur"}),
    ("лента с фото справа и слева обрезается резко, сделай чтоб края в прозрачность уходили", {"css-alpha-masking"}),
    ("как разбить текст на буквы в gsap и чтоб карточки плавно перестраивались при фильтре", {"gsap-plugins"}),
    ("пройдись по всем анимациям на сайте и скажи что переделать в первую очередь, сам не меняй", {"improve-animations"}),
    ("как называется эффект когда кнопка чуть пружинит при нажатии и потом возвращается", {"animation-vocabulary"}),
    ("после пары минут на главной все начинает лагать и вентилятор воет, где то анимации текут", {"optimize-web-animations"}),
    ("вот ссылка на видео с сайтом одного студии, разбери что там происходит чтоб я мог повторить", {"video-to-superprompt"}),
    ("мне кажется сайт выглядит как будто его нейросеть собрала, проверь честно что палится", {"audit-ai-design-slop"}),
    ("скриншот всей страницы выходит пустой серый внизу, потому что анимации не срабатывают", {"stitched-full-page-capture"}),
    ("вот сайт https://example.studio, как у них сделан этот переход между проектами?", {"explain-interface"}),
    ("хочу зафиксировать стиль сайта в одном файле чтоб потом все по нему делали, поспрашивай меня что я люблю", {"design-md-planner"}),
    ("нужны всплывашки внизу типа сообщение отправлено, какую либу взять и как настроить", {"ask-sonner"}),
    ("я придумал переделать всю главную вот план, попробуй его разнести в пух", {"grilling"}),
    ("сессия длинная уже, запиши где мы остановились чтоб новый чат продолжил", {"handoff"}),
    ("git pull сломался конфликты в трех файлах помоги разрулить", {"resolving-merge-conflicts"}),
    ("мне надо самому настроить сервер на ионосе и ключи, сделай пошаговую штуку в терминале чтоб я по ней прошел", {"wizard"}),
    ("проверь сайт на дыры в безопасности, особенно форму и админку", {"security-audit"}),
    ("на странице проекта взгляд сразу падает на дату а не на фото, почему так", {"critique-visual-hierarchy"}),
    ("пока грузятся большие фотки в галерее белые дыры, как это красиво обыграть", {"loading-states"}),
    ("о чем мне вообще писать в блог и соцсети чтоб клиенты находили, на полгода план", {"content-strategy"}),
    ("хочу чтобы про меня написали в местной газете или в журнале по фото, как подойти", {"public-relations"}),
    ("хочу главную как у крутых студий, огромные фото на весь экран и проекты как главы", {"editorial-portfolio-chapters", "documentary-brutalist-agency"}),
    ("сетка из фоток на всю ширину с тонкими линиями между ними и подписями в углах", {"image-first-grid-layout"}),
    ("Ich brauche ein Titelbild für den Blogartikel, darf ich da einfach was generieren lassen?", {"image"}),
    ("Kannst du mir Instagram-Posts für die nächsten zwei Wochen zu meinem neuen Film vorbereiten", {"social"}),
    ("Kaum jemand schreibt mir über die Kontaktseite, woran liegt das?", {"cro"}),
    ("Schau dir mal an, wie sich der Fotograf Müller aus Köln online aufstellt, Preise, Zielgruppe usw", {"competitor-profiling"}),
    ("Das Kontaktformular ist zu lang und die Fehlermeldungen nerven, bitte neu durchdenken", {"form-design"}),
]

# Второй независимый набор (другой агент, те же условия). Пока он не тронут подстройкой,
# это самая честная оценка роутера.
HOLDOUT2 = [
    ("хочу чтобы текст про меня на главной проявлялся слово за словом пока скролишь вниз", {"scroll-scrubbed-word-reveal"}),
    ("можно сделать так чтоб при прокрутке видео с дрона крутилось вперед назад вместе со скролом", {"scroll-scrubbed-visual-sequence"}),
    ("на странице про меня хочу этапы работы от брифинга до сдачи с линией которая заполняется при скролле", {"scroll-progress-timeline"}),
    ("хочу на фотке ч/б а где мышка там цветное кружком просвечивает", {"reveal-hover-effect"}),
    ("сайт должен ощущаться как дорогой фильм плавный скрол всё медленно выезжает как у топовых студий", {"cinematic-gsap-lenis-motion-system", "cinematic-scroll-storytelling"}),
    ("заголовки секций пусть выезжают снизу по словам как будто из под невидимой полоски", {"masked-reveal"}),
    ("хочу чтобы вся главная была одним 3д пространством и камера летела сквозь него когда листаешь", {"build-threejs-scroll-worlds"}),
    ("в 3д сцене на главной пусть камера чуть поворачивается за мышкой но совсем немного", {"add-mouse-driven-orbit"}),
    ("шапка сверху должна размывать фото под ней но плавно от сильного к слабому", {"progressive-blur"}),
    ("лента с фотками по краям обрезается резко сделай чтоб края плавно растворялись в прозрачность", {"css-alpha-masking"}),
    ("при клике на превью фотка должна плавно перелететь на своё место в большом просмотре", {"gsap-plugins"}),
    ("мне надо число прогресса скрола от 0 до 1 перевести в масштаб от 1 до 1.3 и ограничить", {"gsap-utils"}),
    ("на планшете страница проекта разваливается колонки налезают друг на друга не пойму что куда должно уходить", {"better-layout"}),
    ("видел на одном сайте эффект с изогнутыми картинками при скролле как они это сделали вот ссылка", {"explain-interface"}),
    ("пройдись по всем анимациям на сайте и скажи что сделано плохо и что переделать в первую очередь", {"improve-animations"}),
    ("хочу один документ где зафиксирован весь визуальный стиль сайта цвета шрифты настроение чтоб дальше по нему работать", {"design-md-planner"}),
    ("после отправки формы нужна всплывашка в углу что сообщение ушло", {"ask-sonner"}),
    ("я хочу переделать всё портфолио на одну длинную страницу вот мой план разнеси его по полной задавай неудобные вопросы", {"grilling"}),
    ("заканчиваю на сегодня собери всё что мы сделали чтобы завтра новый чат продолжил с этого места", {"handoff"}),
    ("гит пишет конфликт после pull в двух файлах и я не понимаю что оставить", {"resolving-merge-conflicts"}),
    ("мне надо самому настроить сервер и ключи на ионосе проведи меня по шагам скриптом чтоб я ничего не забыл", {"wizard"}),
    ("как называется эффект когда элемент чуть перелетает и пружинит назад хочу такой же", {"animation-vocabulary"}),
    ("проверь сайт на дыры можно ли взломать админку или форму контактов", {"security-audit"}),
    ("через пару минут на главной всё начинает тормозить и вентилятор ноута воет", {"optimize-web-animations"}),
    ("вот видео с сайта который мне нравится разбери его подробно чтоб можно было сделать похожее", {"video-to-superprompt"}),
    ("мне кажется сайт выглядит как все сайты сделанные нейросетью проверь что конкретно выдаёт шаблонность", {"audit-ai-design-slop"}),
    ("скриншот всей страницы получается с пустыми белыми кусками где должны быть фото", {"stitched-full-page-capture"}),
    ("хочу сделать пару постов в инсту про новый проект и расписать что постить в ближайший месяц", {"social"}),
    ("посмотри что за фотограф вот его сайт чем он берёт клиентов и сколько просит", {"competitor-profiling"}),
    ("люди заходят на сайт смотрят фотки но почти никто не пишет через контакты что не так", {"cro"}),
    ("Ich möchte, dass Magazine und Lokalzeitungen über meine neue Ausstellung berichten, wie gehe ich das an", {"public-relations"}),
    ("Das Kontaktformular ist zu lang und verwirrend, welche Felder brauche ich wirklich und in welcher Reihenfolge", {"form-design"}),
    ("Beim Öffnen eines Projekts sieht man erst ewig eine leere weiße Fläche bis die Bilder da sind", {"loading-states"}),
    ("Wenn man in der Suche nichts findet, steht da nur leer, was soll man da anzeigen", {"search-ux"}),
    ("Ich weiß nicht, ob oben ein Menü, Tabs oder ein Burger besser passt für Foto, Film und Über mich", {"navigation-patterns"}),
    ("Auf der Startseite schaut jeder zuerst auf den Footer-Link statt auf meine Bilder, warum", {"critique-visual-hierarchy"}),
    ("Die Projektseite fühlt sich irgendwie unausgewogen an, links zu voll, rechts zu leer, schau mal drauf", {"critique-composition"}),
    ("хочу чтобы главная была как журнал проекты большими главами на весь экран темно и крупные подписи", {"editorial-portfolio-chapters"}),
    ("Ich will eine Galerie wo die Fotos randlos das Raster bilden und feine Linien die Struktur zeigen", {"image-first-grid-layout"}),
    ("Darf ich Fotos von Kunden-Shootings mit erkennbaren Personen einfach auf der Website und für Werbung nutzen", {"image"}),
]


def run(rows, label, cases, verbose):
    hits = 0
    for q, want in cases:
        lib = [r["name"] for _, r in route.rank(rows, q)[0][:3]]
        ok = bool(want & set(lib))
        hits += ok
        if verbose or not ok:
            print(("✓ " if ok else "✗ ") + f"{q[:70]} → {', '.join(lib) or '—'}")
    print(f"{label}: top-3 {hits}/{len(cases)}")
    return hits / len(cases)


def main():
    verbose = "-v" in sys.argv
    rows = route.load()
    tuned = run(rows, "настроечный", CASES, verbose)
    held = run(rows, "независимый-1", HOLDOUT, verbose)
    held2 = run(rows, "независимый-2", HOLDOUT2, verbose)
    sys.exit(0 if tuned >= 0.9 and min(held, held2) >= 0.6 else 1)


if __name__ == "__main__":
    main()
