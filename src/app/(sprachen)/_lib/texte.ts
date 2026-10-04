// The two landing pages for Ukrainian- and Russian-speaking parents: one page each, no i18n layer
// (CLAUDE.md → Project). Prices, names of Figuren and towns come from the booking engine; the
// booking form itself stays German, which these pages say plainly.

export type Fremdsprache = "uk" | "ru";

type Texte = {
  lang: string;
  ogLocale: string;
  titel: string;
  beschreibung: string;
  h1: string;
  lead: string;
  karteTitel: string;
  ab: (preis: string) => string;
  paket: (name: string, minuten: number) => string;
  anfahrt: (von: string, bis: string) => string;
  buchen: string;
  formHinweis: string;
  figurenTitel: string;
  alleFiguren: string;
  jahre: (von: number, bis: number) => string;
  schritteTitel: string;
  schritte: string[];
  fragenTitel: string;
  fragenText: string;
  schreiben: string;
  deutsch: string;
  sprachwahl: string;
  rechtliches: string;
};

export const TEXTE: Record<Fremdsprache, Texte> = {
  uk: {
    lang: "uk",
    ogLocale: "uk_UA",
    titel: "Аніматор на дитячий день народження українською",
    beschreibung:
      "Персонажі-аніматори для дитячих свят в Ашаффенбурзі, Франкфурті, Ганау й околицях. Програма українською, ціна від 149 € одразу онлайн.",
    h1: "Аніматор на дитяче свято українською мовою",
    lead: "Принцеса, супергерой чи піратка приходять до вас і граються з дітьми українською. Ціну й вільні дати ви бачите одразу, без дзвінків.",
    karteTitel: "Свято в Rhein-Main",
    ab: (preis) => `від ${preis}`,
    paket: (name, minuten) => `${name}, ${minuten} хвилин.`,
    anfahrt: (von, bis) => `Доїзд залежно від міста: ${von}–${bis}.`,
    buchen: "Забронювати онлайн",
    formHinweis:
      "Форма бронювання німецькою, але проста. Мову програми оберіть у кроці «Ihre Angaben»: «Ukrainisch».",
    figurenTitel: "Хто грає українською",
    alleFiguren: "Усі персонажі",
    jahre: (von, bis) => `${von}–${bis} років`,
    schritteTitel: "Як це працює",
    schritte: [
      "Оберіть персонажа й пакет.",
      "Вкажіть місто й дату: вільні суботи видно одразу.",
      "Внесіть передоплату онлайн, і дата ваша.",
      "Персонаж приходить вчасно, у костюмі та з програмою.",
    ],
    fragenTitel: "Маєте запитання?",
    fragenText: "Напишіть нам через форму, можна українською.",
    schreiben: "Написати",
    deutsch: "Deutsch",
    sprachwahl: "Мова сторінки",
    rechtliches: "німецькою",
  },
  ru: {
    lang: "ru",
    ogLocale: "ru_RU",
    titel: "Аниматор на детский день рождения на русском",
    beschreibung:
      "Аниматоры-персонажи для детских праздников в Ашаффенбурге, Франкфурте, Ханау и окрестностях. Программа на русском, цена от 149 € сразу онлайн.",
    h1: "Аниматор на детский праздник на русском языке",
    lead: "Принцесса, супергерой или пиратка приходят к вам и играют с детьми на русском. Цену и свободные даты вы видите сразу, без звонков.",
    karteTitel: "Праздник в Rhein-Main",
    ab: (preis) => `от ${preis}`,
    paket: (name, minuten) => `${name}, ${minuten} минут.`,
    anfahrt: (von, bis) => `Выезд в зависимости от города: ${von}–${bis}.`,
    buchen: "Забронировать онлайн",
    formHinweis:
      "Форма бронирования на немецком, но простая. Язык программы выберите на шаге «Ihre Angaben»: «Russisch».",
    figurenTitel: "Кто играет на русском",
    alleFiguren: "Все персонажи",
    jahre: (von, bis) => `${von}–${bis} лет`,
    schritteTitel: "Как это работает",
    schritte: [
      "Выберите персонажа и пакет.",
      "Укажите город и дату: свободные субботы видны сразу.",
      "Внесите предоплату онлайн, и дата ваша.",
      "Персонаж приходит вовремя, в костюме и с программой.",
    ],
    fragenTitel: "Есть вопросы?",
    fragenText: "Напишите нам через форму, можно на русском.",
    schreiben: "Написать",
    deutsch: "Deutsch",
    sprachwahl: "Язык страницы",
    rechtliches: "на немецком",
  },
};
