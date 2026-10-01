// Content for `pnpm seed`: the site's own pages, the legal pages with the owner's details
// (Einzelunternehmen, 2026-09-29) and the home content. No client projects: real ones are entered in
// /admin (the Krone Parkett project lives only in the database).
// e2e tests import SEED_PATHS, so every seeded route is also checked for data sovereignty and a11y.
// `pnpm init:project` rewrites siteName, ownerName and contactEmail below.

import { type Block, lexical } from "../src/cms/rich-text/build";

export { lexical };

// What every page shares: /admin → Website. The closing invitation starts from
// SITE_TEXT_DEFAULTS in src/cms/content/site-settings.ts.
export const seedSettings = {
  siteName: "Schwarzwald Systems",
  ownerName: "Schwarzwald Systems",
  tagline: "Individuelle Software für den Mittelstand.",
  description:
    "Schwarzwald Systems entwickelt individuelle Software für mittelständische Unternehmen: Web-Anwendungen, mobile Apps und Schnittstellen.",
  // Shown in the footer, on /kontakt and in the legal pages once set (the owner's address follows).
  contactEmail: null as string | null,
  socialLinks: [] as { label: string; url: string }[],
};

// The sections of the pages with a route of their own (/admin → Seiten → Startseite, Leistungen,
// Kontakt); headings and leads start from src/cms/content/page-sections.ts. The examples, steps,
// principles and FAQ describe kinds of work, not references; the principles' claims are
// confirmed by the owner (2026-09-29).
export const seedSections = {
  hero: {
    // What we build, from the services below.
    words: ["Web-Anwendungen", "mobile Apps", "Schnittstellen", "Plattformen"].map((word) => ({
      word,
    })),
  },
  services: [
    {
      title: "Web-Anwendungen",
      short: "Web",
      slug: "web-anwendungen",
      glyph: "web" as const,
      text: "Portale, Kundenbereiche und interne Werkzeuge, die im Browser laufen – ohne Installation, auf jedem Gerät.",
      examples: [
        { text: "Kundenportal mit Auftragsstatus" },
        { text: "Auftrags- und Ressourcenplanung" },
        { text: "Internes Werkzeug, das die Excel-Liste ablöst" },
      ],
    },
    {
      title: "Mobile Apps",
      short: "Mobile",
      slug: "mobile-apps",
      glyph: "mobile" as const,
      text: "Apps für iOS und Android, wenn Ihre Mitarbeitenden oder Kunden unterwegs arbeiten.",
      examples: [
        { text: "Außendienst und Montage vor Ort" },
        { text: "Lager, Inventur und Kommissionierung" },
        { text: "Offline nutzbar, später abgeglichen" },
      ],
    },
    {
      title: "Schnittstellen und Integration",
      short: "Schnittstellen",
      slug: "schnittstellen",
      glyph: "integration" as const,
      text: "Wir verbinden ERP, CRM, Shop und Fachsysteme, damit Daten nicht mehr von Hand übertragen werden.",
      examples: [
        { text: "ERP mit Webshop und Marktplatz" },
        { text: "CRM mit Fachanwendung" },
        { text: "Automatischer Abgleich statt Doppeleingabe" },
      ],
    },
    {
      title: "Modernisierung",
      short: "Modernisierung",
      slug: "modernisierung",
      glyph: "modernisation" as const,
      text: "Gewachsene Altsysteme überführen wir schrittweise in eine wartbare Architektur, während der Betrieb weiterläuft.",
      examples: [
        { text: "Ablösung in Etappen, ohne Stillstand" },
        { text: "Neue Oberfläche auf bestehender Datenbasis" },
        { text: "Dokumentierte, wartbare Architektur" },
      ],
    },
    {
      title: "Betrieb und Weiterentwicklung",
      short: "Betrieb",
      slug: "betrieb",
      glyph: "operations" as const,
      text: "Nach dem Start bleiben wir ansprechbar: Updates, Überwachung und neue Funktionen.",
      examples: [
        { text: "Updates und Sicherheitskorrekturen" },
        { text: "Überwachung und Fehleranalyse" },
        { text: "Neue Funktionen nach Bedarf" },
      ],
    },
  ],
  steps: [
    {
      title: "Verstehen",
      text: "In einem Workshop klären wir Ziele, Nutzer und Randbedingungen. Danach erhalten Sie eine schriftliche Einschätzung zu Umfang und Vorgehen.",
    },
    {
      title: "Entwerfen",
      text: "Ein klickbarer Prototyp zeigt früh, wie sich die Anwendung anfühlt – bevor viel Code entsteht.",
    },
    {
      title: "Entwickeln",
      text: "Wir bauen in kurzen Iterationen und zeigen Ihnen regelmäßig lauffähige Zwischenstände.",
    },
    {
      title: "Betreiben",
      text: "Wir bringen die Software in Betrieb und entwickeln sie mit Ihnen weiter.",
    },
  ],
  principles: [
    {
      title: "Ihr Code gehört Ihnen",
      text: "Quellcode und Dokumentation übergeben wir vollständig. Sie bleiben unabhängig von uns.",
    },
    {
      title: "Feste Ansprechpartner",
      text: "Sie sprechen mit den Menschen, die Ihre Software entwickeln – vom ersten Gespräch bis zum Betrieb.",
    },
    {
      title: "Daten in Europa",
      text: "Auf Wunsch betreiben wir Ihre Anwendung auf Servern in Deutschland, ohne Dienste von US-Anbietern.",
    },
  ],
  kontaktNext: {
    text: lexical([
      {
        kind: "rich",
        parts: [
          "Wir lesen Ihre Nachricht und melden uns mit ersten Fragen. Danach klären wir in einem Workshop Ziele, Nutzer und Randbedingungen – wie es weitergeht, ",
          { text: "zeigt unsere Arbeitsweise", href: "/ueber-uns/arbeitsweise" },
          ".",
        ],
      },
    ]),
  },
  faq: [
    {
      question: "Wo werden unsere Daten gespeichert?",
      answer:
        "Auf Wunsch ausschließlich auf Servern in Deutschland, ohne Dienste von US-Anbietern. Sie behalten die Kontrolle über Ihre Daten.",
    },
    {
      question: "Was passiert nach der Übergabe?",
      answer:
        "Sie erhalten Quellcode und Dokumentation vollständig. Wenn Sie möchten, bleiben wir für Betrieb, Updates und Weiterentwicklung ansprechbar – eine Verpflichtung dazu gibt es nicht.",
    },
    {
      question: "Wie läuft die Zusammenarbeit ab?",
      answer:
        "Nach einem Workshop erhalten Sie eine schriftliche Einschätzung zu Umfang und Vorgehen. Wir entwickeln in kurzen Iterationen und zeigen regelmäßig lauffähige Zwischenstände.",
    },
    {
      question: "Arbeiten Sie mit Festpreis oder nach Aufwand?",
      answer: "Das hängt vom Projekt ab und besprechen wir konkret im ersten Gespräch.",
    },
    {
      question: "Wie groß muss ein Projekt sein, damit es sich lohnt?",
      answer:
        "Wir arbeiten sowohl an einzelnen Schnittstellen als auch an kompletten Plattformen. Sprechen Sie uns an, auch wenn Sie sich unsicher sind.",
    },
  ],
};

// A service's own page (under /leistungen) also carries its sections; `projekt` names a project by
// its slug (projects live only in the database, so it is linked when one with that slug exists).
export type SeedLeistung = {
  fit: { title: string; text: string }[];
  scope: string[];
  steps: { title: string; text: string }[];
  faq: { question: string; answer: string }[];
  projekt?: string;
};

export type SeedPage = {
  slug: string;
  title: string;
  parent?: string;
  lead?: string;
  content: Block[];
  leistung?: SeedLeistung;
};

// Every statement below rests on what the owner confirmed (.agents/product-marketing.md): no stack,
// no prices, no durations, no store publishing, no taking over other people's software.
const MEISTRUM = "meistrum-krone-parkett";

export const seedPages: SeedPage[] = [
  {
    // HOME_SLUG: rendered at `/` from its sections (seedSections); the text below is what the
    // site search shows for the home page.
    slug: "startseite",
    title: "Startseite",
    content: [
      {
        kind: "p",
        text: "Schwarzwald Systems entwickelt individuelle Software für mittelständische Unternehmen: Web-Anwendungen, mobile Apps, Schnittstellen zwischen bestehenden Systemen, die Modernisierung gewachsener Software und ihren Betrieb.",
      },
    ],
  },
  {
    slug: "impressum",
    title: "Impressum",
    content: [
      { kind: "p", text: "Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)" },
      {
        kind: "lines",
        lines: [
          "Schwarzwald Systems",
          "Inhaber: Oleksandr Zamula",
          "Merianhof 5",
          "79104 Freiburg im Breisgau",
          "Deutschland",
        ],
      },
      { kind: "h2", text: "Kontakt" },
      { kind: "p", text: "Sie erreichen uns über das Kontaktformular auf der Seite „Kontakt“." },
      { kind: "h2", text: "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV" },
      { kind: "p", text: "Oleksandr Zamula, Anschrift wie oben." },
      { kind: "h2", text: "Verbraucherstreitbeilegung" },
      {
        kind: "p",
        text: "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
      },
    ],
  },
  {
    // Written from what the site actually does (CLAUDE.md, data sovereignty): no cookies for
    // visitors, no third-party services, contact messages stored in our own database.
    slug: "datenschutz",
    title: "Datenschutzerklärung",
    content: [
      {
        kind: "p",
        text: "Diese Website setzt beim Besuch keine Cookies, nutzt keine Analyse- oder Werbedienste und lädt Schriften und Bilder ausschließlich von unserem eigenen Server. Personenbezogene Daten verarbeiten wir nur in zwei Fällen: in den technisch notwendigen Protokollen des Servers und wenn Sie uns über das Kontaktformular schreiben.",
      },
      { kind: "h2", text: "Verantwortlicher" },
      {
        kind: "lines",
        lines: [
          "Oleksandr Zamula",
          "Schwarzwald Systems",
          "Merianhof 5",
          "79104 Freiburg im Breisgau",
          "Deutschland",
        ],
      },
      { kind: "p", text: "Sie erreichen uns über das Kontaktformular dieser Website." },
      { kind: "h2", text: "Hosting" },
      {
        kind: "p",
        text: "Die Website läuft auf einem Server der IONOS SE, Elgendorfer Straße 57, 56410 Montabaur, in einem Rechenzentrum in Deutschland. IONOS verarbeitet die Daten in unserem Auftrag; dafür besteht ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO.",
      },
      { kind: "h2", text: "Server-Protokolle" },
      {
        kind: "p",
        text: "Bei jedem Aufruf einer Seite speichert der Server automatisch Ihre IP-Adresse, Datum und Uhrzeit, die aufgerufene Adresse, die übertragene Datenmenge, den Browser und das Betriebssystem sowie die zuvor besuchte Seite. Wir brauchen diese Angaben, um die Website sicher und stabil zu betreiben und Angriffe zu erkennen. Rechtsgrundlage ist unser berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO. Die Protokolle werden nach 14 Tagen gelöscht.",
      },
      { kind: "h2", text: "Kontaktformular" },
      {
        kind: "p",
        text: "Wenn Sie uns über das Kontaktformular schreiben, speichern wir Ihren Namen, Ihre E-Mail-Adresse und Ihre Nachricht in der Datenbank auf unserem Server, um Ihre Anfrage zu beantworten. Die Angaben werden an niemanden weitergegeben. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, wenn Ihre Anfrage einen Auftrag vorbereitet, sonst unser berechtigtes Interesse an der Beantwortung nach Art. 6 Abs. 1 lit. f DSGVO.",
      },
      {
        kind: "p",
        text: "Wir löschen Ihre Nachricht, sobald Ihr Anliegen erledigt ist, spätestens sechs Monate nach ihrem Eingang; das geschieht automatisch. In unseren Datensicherungen bleibt sie danach noch höchstens zwei Wochen erhalten. Wird aus der Anfrage ein Auftrag, übernehmen wir die nötigen Angaben in unsere Kundenunterlagen und bewahren sie so lange auf, wie es handels- und steuerrechtliche Fristen verlangen.",
      },
      { kind: "h2", text: "Verschlüsselung" },
      {
        kind: "p",
        text: "Die Website wird ausschließlich über eine verschlüsselte Verbindung (HTTPS) ausgeliefert. Was Sie im Kontaktformular eingeben, kann unterwegs nicht mitgelesen werden.",
      },
      { kind: "h2", text: "Ihre Rechte" },
      { kind: "p", text: "Sie haben das Recht auf" },
      {
        kind: "ul",
        items: [
          "Auskunft über die zu Ihnen gespeicherten Daten (Art. 15 DSGVO),",
          "Berichtigung unrichtiger Daten (Art. 16 DSGVO),",
          "Löschung (Art. 17 DSGVO) und Einschränkung der Verarbeitung (Art. 18 DSGVO),",
          "Herausgabe Ihrer Daten in einem gängigen Format (Art. 20 DSGVO),",
          "Widerspruch gegen eine Verarbeitung, die auf unserem berechtigten Interesse beruht (Art. 21 DSGVO).",
        ],
      },
      { kind: "p", text: "Dafür genügt eine Nachricht über das Kontaktformular." },
      { kind: "h2", text: "Beschwerde bei einer Aufsichtsbehörde" },
      {
        kind: "p",
        text: "Sie können sich bei einer Datenschutz-Aufsichtsbehörde beschweren. Für uns zuständig ist der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg, Lautenschlagerstraße 20, 70173 Stuttgart.",
      },
      { kind: "p", text: "Stand: September 2026" },
    ],
  },
  {
    slug: "ueber-uns",
    title: "Über uns",
    content: [
      {
        kind: "p",
        text: "Schwarzwald Systems ist ein Softwareunternehmen aus Freiburg im Breisgau. Wir entwickeln individuelle Software für mittelständische Unternehmen: Web-Anwendungen, mobile Apps, Schnittstellen zwischen bestehenden Systemen, die Modernisierung gewachsener Software und ihren Betrieb.",
      },
      { kind: "h2", text: "Wer hinter Schwarzwald Systems steht" },
      {
        kind: "p",
        text: "Oleksandr Zamula hat Schwarzwald Systems gegründet und führt das Unternehmen als Inhaber. Wer bei uns anfragt, spricht direkt mit ihm.",
      },
      { kind: "h2", text: "Wie wir arbeiten" },
      {
        kind: "p",
        text: "Jedes Projekt beginnt mit einem Workshop, in dem wir Ziele, Nutzer und Randbedingungen klären. Danach entsteht ein klickbarer Prototyp, dann die Software in kurzen Iterationen mit regelmäßig lauffähigen Zwischenständen. Wie das im Einzelnen abläuft, beschreibt die Seite „Unsere Arbeitsweise“.",
      },
    ],
  },
  {
    // Expands the 4 steps + 3 principles already live on the home page into real depth —
    // no claims beyond those already published there.
    slug: "arbeitsweise",
    title: "Unsere Arbeitsweise",
    parent: "ueber-uns",
    content: [
      { kind: "h2", text: "So arbeiten wir" },
      {
        kind: "p",
        text: "Vier Schritte, die sich in jedem Projekt wiederholen — vom ersten Gespräch bis zum laufenden Betrieb.",
      },
      { kind: "h2", text: "1. Verstehen" },
      {
        kind: "p",
        text: "In einem Workshop klären wir Ziele, Nutzer und Randbedingungen: Was soll die Software leisten, wer arbeitet damit, welche bestehenden Systeme muss sie berücksichtigen. Danach erhalten Sie eine schriftliche Einschätzung zu Umfang und Vorgehen — bevor eine Zeile Code entsteht.",
      },
      { kind: "h2", text: "2. Entwerfen" },
      {
        kind: "p",
        text: "Ein klickbarer Prototyp zeigt früh, wie sich die Anwendung anfühlt. Das macht Annahmen sichtbar und lässt sich korrigieren, solange eine Änderung noch nichts kostet.",
      },
      { kind: "h2", text: "3. Entwickeln" },
      {
        kind: "p",
        text: "Wir bauen in kurzen Iterationen und zeigen Ihnen regelmäßig lauffähige Zwischenstände — nicht erst kurz vor der Abgabe. So bleibt jederzeit nachvollziehbar, woran wir arbeiten und was als Nächstes ansteht.",
      },
      { kind: "h2", text: "4. Betreiben" },
      {
        kind: "p",
        text: "Wir bringen die Software in Betrieb und entwickeln sie mit Ihnen weiter. Software ist selten fertig: Anforderungen ändern sich, Nutzungszahlen wachsen, neue Vorschriften kommen hinzu.",
      },
      { kind: "h2", text: "Ihr Code gehört Ihnen" },
      {
        kind: "p",
        text: "Quellcode und Dokumentation übergeben wir vollständig — Sie bleiben unabhängig von uns. Es gibt keine Bindung an uns als Anbieter, die über das hinausgeht, was Sie selbst wollen.",
      },
      { kind: "h2", text: "Feste Ansprechpartner" },
      {
        kind: "p",
        text: "Sie sprechen mit den Menschen, die Ihre Software tatsächlich entwickeln — vom ersten Gespräch bis zum Betrieb. Keine wechselnden Kontakte, kein Callcenter dazwischen.",
      },
      { kind: "h2", text: "Daten in Europa" },
      {
        kind: "p",
        text: "Auf Wunsch betreiben wir Ihre Anwendung auf Servern in Deutschland, ohne Dienste von US-Anbietern. Das betrifft nicht nur den Hosting-Ort, sondern auch die Werkzeuge, mit denen wir arbeiten — wo immer möglich, setzen wir auf selbst betriebene oder europäische Alternativen statt auf US-SaaS.",
      },
    ],
  },
  {
    // Rendered by its own route from its sections (the five services, the FAQ); the five pages
    // below it hold each service's text. The text below is what the site search shows.
    slug: "leistungen",
    title: "Leistungen",
    content: [
      {
        kind: "p",
        text: "Web-Anwendungen, mobile Apps, Schnittstellen, Modernisierung sowie Betrieb und Weiterentwicklung: was wir für den Mittelstand entwickeln.",
      },
    ],
  },
  {
    slug: "web-anwendungen",
    title: "Web-Anwendungen",
    parent: "leistungen",
    lead: "Portale, interne Werkzeuge und Planungssysteme, die im Browser laufen – zugeschnitten auf die Abläufe Ihres Betriebs.",
    leistung: {
      fit: [
        {
          title: "Die Excel-Liste kommt an ihre Grenzen",
          text: "Mehrere Personen pflegen dieselbe Datei, Stände laufen auseinander, niemand weiß, welcher gilt. Eine Web-Anwendung hält die Daten an einer Stelle und zeigt jedem, was er braucht.",
        },
        {
          title: "Kunden fragen nach dem Stand ihres Auftrags",
          text: "Statt Rückrufen und E-Mails sehen Ihre Kunden den Auftragsstatus in einem eigenen Portal, zusammen mit den Unterlagen, die sie betreffen.",
        },
        {
          title: "Standardsoftware passt nicht zu Ihren Abläufen",
          text: "Wenn Sie Ihre Arbeitsweise einer Software anpassen müssten statt umgekehrt, lohnt sich eine Anwendung, die genau Ihre Abläufe abbildet.",
        },
      ],
      scope: [
        "Workshop zu Zielen, Nutzern und Randbedingungen",
        "Schriftliche Einschätzung zu Umfang und Vorgehen",
        "Klickbarer Prototyp, bevor programmiert wird",
        "Entwicklung in kurzen Iterationen mit lauffähigen Zwischenständen",
        "Anbindung an Ihre bestehenden Systeme, wo nötig",
        "Vollständiger Quellcode und Dokumentation",
        "Betrieb auf Servern in Deutschland, auf Wunsch",
      ],
      steps: [
        {
          title: "Abläufe verstehen",
          text: "Wir sehen uns an, wie heute gearbeitet wird: welche Listen, Werkzeuge und Übergaben es gibt und wo Zeit verloren geht.",
        },
        {
          title: "Prototyp ausprobieren",
          text: "Ein klickbarer Prototyp zeigt die wichtigsten Ansichten. Sie und Ihr Team probieren ihn aus, bevor eine Zeile Code entsteht.",
        },
        {
          title: "In Etappen bauen",
          text: "Wir entwickeln in kurzen Iterationen. Jeder Zwischenstand läuft und lässt sich prüfen, so bleibt sichtbar, was als Nächstes kommt.",
        },
        {
          title: "Einführen und weiterentwickeln",
          text: "Wir bringen die Anwendung in Betrieb und erweitern sie, wenn neue Anforderungen dazukommen.",
        },
      ],
      faq: [
        {
          question: "Läuft die Anwendung auch auf Tablet und Smartphone?",
          answer:
            "Ja. Eine Web-Anwendung läuft im Browser, also auf jedem Gerät mit aktuellem Browser und ohne Installation. Muss sie auch ohne Netz funktionieren, ist eine mobile App die bessere Wahl.",
        },
        {
          question: "Können wir die Anwendung später von jemand anderem weiterentwickeln lassen?",
          answer:
            "Ja. Sie erhalten den vollständigen Quellcode und die Dokumentation. Damit kann auch ein anderes Team daran weiterarbeiten.",
        },
        {
          question: "Wie lange dauert die Entwicklung?",
          answer:
            "Das hängt vom Umfang ab. Nach dem ersten Workshop erhalten Sie eine schriftliche Einschätzung zu Umfang und Vorgehen als Grundlage für Ihre Entscheidung.",
        },
        {
          question: "Wo werden die Daten gespeichert?",
          answer:
            "Auf Wunsch ausschließlich auf Servern in Deutschland, ohne Dienste von US-Anbietern.",
        },
      ],
      projekt: MEISTRUM,
    },
    content: [
      {
        kind: "p",
        text: "Wir entwickeln Web-Anwendungen, die im Browser laufen – ohne Installation, auf jedem Gerät erreichbar. Das reicht vom Kundenportal mit Auftragsstatus über interne Werkzeuge, die eine gewachsene Excel-Liste ablösen, bis zur vollständigen Auftrags- und Ressourcenplanung.",
      },
      {
        kind: "p",
        text: "Technisch setzen wir auf bewährte, wartbare Grundlagen statt auf kurzlebige Trends. Die Anwendung wächst mit Ihrem Betrieb: neue Funktionen lassen sich ergänzen, ohne die bestehende Struktur zu gefährden.",
      },
      {
        kind: "p",
        text: "Am Ende erhalten Sie vollständigen Zugriff auf Quellcode und Dokumentation.",
      },
    ],
  },
  {
    slug: "mobile-apps",
    title: "Mobile Apps",
    parent: "leistungen",
    lead: "Apps für iOS und Android für Menschen, die unterwegs arbeiten – auch dort, wo das Netz nicht reicht.",
    leistung: {
      fit: [
        {
          title: "Ihr Team arbeitet beim Kunden vor Ort",
          text: "Montage, Wartung, Außendienst: Wer unterwegs ist, braucht Aufträge, Pläne und Formulare auf dem Gerät, nicht im Büro.",
        },
        {
          title: "Auf der Baustelle oder im Lager fehlt das Netz",
          text: "Die App speichert Eingaben auf dem Gerät und gleicht sie automatisch ab, sobald wieder eine Verbindung besteht.",
        },
        {
          title: "Papierformulare kommen zu spät im Büro an",
          text: "Was vor Ort erfasst wird, landet direkt im System, statt Tage später abgetippt zu werden.",
        },
      ],
      scope: [
        "App für iOS und Android",
        "Offline nutzbar mit automatischem Abgleich, wo nötig",
        "Anbindung an Ihre Web-Anwendung oder Ihr Fachsystem",
        "Klickbarer Prototyp vor der Entwicklung",
        "Entwicklung in kurzen Iterationen mit lauffähigen Zwischenständen",
        "Vollständiger Quellcode und Dokumentation",
      ],
      steps: [
        {
          title: "Einsatz klären",
          text: "Wir klären, wo und wie die App genutzt wird: unterwegs, mit wenig Zeit, oft ohne verlässliches Netz.",
        },
        {
          title: "Prototyp ausprobieren",
          text: "Ein klickbarer Prototyp zeigt die wichtigsten Abläufe. Ihr Team probiert ihn aus, bevor entwickelt wird.",
        },
        {
          title: "Entwickeln und anbinden",
          text: "Wir entwickeln die App in kurzen Iterationen und verbinden sie mit den Systemen, in denen Ihre Daten heute liegen.",
        },
        {
          title: "Einführen und pflegen",
          text: "Nach dem Start bleiben wir ansprechbar: für Updates und für neue Funktionen nach Bedarf.",
        },
      ],
      faq: [
        {
          question: "Funktioniert die App ohne Internet?",
          answer:
            "Wo es nötig ist, ja. Die App speichert Eingaben auf dem Gerät und gleicht sie automatisch ab, sobald wieder eine Verbindung besteht.",
        },
        {
          question: "Brauchen wir dafür auch eine Web-Anwendung?",
          answer:
            "Nicht unbedingt. Oft gibt es schon ein System, in dem die Daten liegen; die App wird daran angebunden. Fehlt es, entwickeln wir beides aufeinander abgestimmt.",
        },
        {
          question: "Gehört uns der Code der App?",
          answer:
            "Ja. Sie erhalten den vollständigen Quellcode und die Dokumentation und bleiben unabhängig von uns.",
        },
      ],
    },
    content: [
      {
        kind: "p",
        text: "Für iOS und Android entwickeln wir Apps, wenn Ihre Mitarbeitenden oder Kunden unterwegs arbeiten: im Außendienst, bei Montage vor Ort, in Lager und Kommissionierung.",
      },
      {
        kind: "p",
        text: "Wo eine durchgehende Verbindung nicht garantiert ist, bauen wir die App offline nutzbar – Daten werden gespeichert und automatisch abgeglichen, sobald wieder eine Verbindung besteht.",
      },
      {
        kind: "p",
        text: "Eine mobile App ist selten ein eigenständiges Projekt: meist verbindet sie sich mit einer bestehenden Web-Anwendung oder einem Fachsystem. Diese Anbindung planen wir von Anfang an mit.",
      },
    ],
  },
  {
    slug: "schnittstellen",
    title: "Schnittstellen und Integration",
    parent: "leistungen",
    lead: "ERP, CRM, Webshop und Fachsysteme tauschen ihre Daten selbst aus – damit niemand sie mehr von Hand überträgt.",
    leistung: {
      fit: [
        {
          title: "Daten werden doppelt erfasst",
          text: "Bestellungen aus dem Shop werden ins ERP abgetippt, Kundendaten in zwei Systemen gepflegt. Jede Übertragung kostet Zeit und öffnet die Tür für Fehler.",
        },
        {
          title: "Zwischen den Systemen steht eine Person",
          text: "Wenn nur eine Kollegin weiß, wie die Daten von einem System ins andere kommen, hängt ein Teil des Betriebs an ihr.",
        },
        {
          title: "Ein neues System soll zu den alten passen",
          text: "Ein neuer Shop, ein neues CRM: Die Schnittstelle sorgt dafür, dass das Neue mit dem Bestehenden zusammenarbeitet.",
        },
      ],
      scope: [
        "Bestandsaufnahme der Systeme und Datenflüsse",
        "Entwurf der Schnittstelle, bevor gebaut wird",
        "Automatischer Abgleich statt Doppeleingabe",
        "Dokumentation der Datenflüsse",
        "Betrieb und Überwachung der Schnittstelle, auf Wunsch",
      ],
      steps: [
        {
          title: "Bestandsaufnahme",
          text: "Welche Systeme sprechen bereits miteinander, wo entstehen Brüche, welche Daten müssen wirklich fließen.",
        },
        {
          title: "Entwurf",
          text: "Wir legen fest, welche Daten in welche Richtung fließen, wann und nach welchen Regeln. Erst dann wird gebaut.",
        },
        {
          title: "Umsetzung",
          text: "Wir bauen die Schnittstelle, prüfen sie gründlich und nehmen sie erst dann in Betrieb.",
        },
        {
          title: "Betrieb",
          text: "Läuft die Schnittstelle, behalten wir sie auf Wunsch im Blick und passen sie an, wenn sich eines der Systeme ändert.",
        },
      ],
      faq: [
        {
          question: "Welche Systeme lassen sich anbinden?",
          answer:
            "Das klären wir in der Bestandsaufnahme. Entscheidend ist, welche Wege ein System für den Datenaustausch anbietet, etwa eine Programmierschnittstelle, Datei-Exporte oder den Zugriff auf seine Datenbank.",
        },
        {
          question: "Müssen wir dafür Systeme austauschen?",
          answer: "Nein. Eine Schnittstelle verbindet die Systeme, die Sie bereits haben.",
        },
        {
          question: "Was passiert, wenn sich eines der Systeme ändert?",
          answer:
            "Die Schnittstelle ist dokumentiert, Anpassungen bleiben nachvollziehbar. Auf Wunsch übernehmen wir den Betrieb und passen sie selbst an.",
        },
      ],
    },
    content: [
      {
        kind: "p",
        text: "Viele Betriebe verlieren Zeit, weil Daten von Hand zwischen Systemen übertragen werden: ERP, CRM, Webshop, Marktplatz, Fachanwendungen. Wir verbinden diese Systeme über Schnittstellen, sodass Daten automatisch abgeglichen werden statt doppelt erfasst zu werden.",
      },
      {
        kind: "p",
        text: "Jede Integration beginnt mit einer genauen Bestandsaufnahme: Welche Systeme sprechen bereits miteinander, wo entstehen Brüche, welche Daten müssen wirklich fließen. Erst danach entwerfen wir die Schnittstelle.",
      },
      {
        kind: "p",
        text: "Das Ergebnis ist eine Architektur, die dokumentiert und nachvollziehbar bleibt – auch wenn sich einzelne Systeme später ändern.",
      },
    ],
  },
  {
    slug: "modernisierung",
    title: "Modernisierung",
    parent: "leistungen",
    lead: "Gewachsene Software Schritt für Schritt erneuern, während der Betrieb weiterläuft.",
    leistung: {
      fit: [
        {
          title: "Nur noch eine Person kennt das System",
          text: "Das Wissen über die Software steckt in wenigen Köpfen. Fällt jemand aus, steht ein Teil des Betriebs still.",
        },
        {
          title: "Die Technik ist in die Jahre gekommen",
          text: "Das System läuft auf veralteten Werkzeugen, Updates sind schwierig oder gar nicht mehr möglich.",
        },
        {
          title: "Jede Änderung wird zum Risiko",
          text: "Neue Anforderungen lassen sich kaum umsetzen, und jede Anpassung droht an anderer Stelle etwas zu beschädigen.",
        },
      ],
      scope: [
        "Bestandsaufnahme des gewachsenen Systems",
        "Plan für die Ablösung in Etappen",
        "Neue Oberfläche auf der bestehenden Datenbasis, wo sinnvoll",
        "Eine funktionierende Anwendung nach jeder Etappe",
        "Dokumentierte, wartbare Architektur",
        "Vollständiger Quellcode und Dokumentation",
      ],
      steps: [
        {
          title: "Bestand verstehen",
          text: "Wir sehen uns an, was das System heute leistet, wer damit arbeitet und welche Teile am dringendsten erneuert werden müssen.",
        },
        {
          title: "Etappen planen",
          text: "Wir teilen die Ablösung in Etappen, nach denen jeweils eine funktionierende Anwendung steht.",
        },
        {
          title: "Neue Oberfläche",
          text: "Häufig beginnt es mit einer neuen Oberfläche auf der bestehenden Datenbasis. So entsteht früh sichtbarer Nutzen.",
        },
        {
          title: "Datenbasis erneuern",
          text: "Danach modernisieren wir die Datenbasis selbst, bis das alte System abgeschaltet werden kann.",
        },
      ],
      faq: [
        {
          question: "Müssen wir den Betrieb für die Umstellung unterbrechen?",
          answer:
            "Nein. Genau dafür gibt es die Etappen: An jedem Punkt läuft eine funktionierende Anwendung.",
        },
        {
          question: "Ist eine Neuentwicklung in einem Zug nicht einfacher?",
          answer:
            "Selten. Eine Ablösung in einem Zug ist für die meisten Betriebe weder realistisch noch risikoarm. In der Bestandsaufnahme klären wir, welcher Weg zu Ihrem System passt.",
        },
        {
          question: "Was passiert mit unseren Daten?",
          answer:
            "Sie bleiben erhalten. Die neue Oberfläche arbeitet zunächst auf der bestehenden Datenbasis, die anschließend Schritt für Schritt modernisiert wird.",
        },
      ],
    },
    content: [
      {
        kind: "p",
        text: "Gewachsene Altsysteme überführen wir schrittweise in eine wartbare Architektur, während der Betrieb weiterläuft. Eine Ablösung in einem Zug ist selten realistisch und riskant; wir gehen in Etappen vor, sodass an jedem Punkt eine funktionierende Anwendung existiert.",
      },
      {
        kind: "p",
        text: "Häufig beginnt das mit einer neuen Oberfläche auf der bestehenden Datenbasis, bevor die Datenbasis selbst modernisiert wird. So entsteht früh sichtbarer Nutzen, ohne dass Sie auf das Gesamtergebnis warten müssen.",
      },
      {
        kind: "p",
        text: "Am Ende steht eine dokumentierte, wartbare Architektur, die nicht mehr von einzelnen Personen oder veralteten Werkzeugen abhängt.",
      },
    ],
  },
  {
    slug: "betrieb",
    title: "Betrieb und Weiterentwicklung",
    parent: "leistungen",
    lead: "Nach dem Start bleiben wir ansprechbar: für Updates, Überwachung und neue Funktionen.",
    leistung: {
      fit: [
        {
          title: "Die Anwendung läuft, aber niemand pflegt sie",
          text: "Updates bleiben liegen, Fehler fallen erst auf, wenn sich jemand beschwert. Laufende Pflege hält die Anwendung sicher und verlässlich.",
        },
        {
          title: "Ihre Anforderungen wachsen",
          text: "Neue Abläufe, mehr Nutzer, neue Vorschriften: Software ist selten fertig, sie entwickelt sich mit Ihrem Betrieb.",
        },
        {
          title: "Ihre Daten sollen in Deutschland bleiben",
          text: "Auf Wunsch betreiben wir die Anwendung auf Servern in Deutschland, ohne Dienste von US-Anbietern.",
        },
      ],
      scope: [
        "Updates und Sicherheitskorrekturen",
        "Überwachung und Fehleranalyse",
        "Neue Funktionen nach Bedarf",
        "Betrieb auf Servern in Deutschland, ohne US-Anbieter",
        "Feste Ansprechpartner statt wechselnder Kontakte",
      ],
      steps: [
        {
          title: "Inbetriebnahme",
          text: "Wir bringen die Anwendung auf die Server und richten die Überwachung ein.",
        },
        {
          title: "Laufende Pflege",
          text: "Updates und Sicherheitskorrekturen spielen wir regelmäßig ein; meldet die Überwachung einen Fehler, gehen wir ihm nach.",
        },
        {
          title: "Weiterentwicklung",
          text: "Neue Funktionen entwickeln wir, wenn Sie sie brauchen, in derselben Arbeitsweise wie zu Beginn.",
        },
      ],
      faq: [
        {
          question: "Müssen wir den Betrieb bei Ihnen beauftragen?",
          answer:
            "Nein. Sie erhalten Quellcode und Dokumentation vollständig und können den Betrieb auch selbst oder mit einem anderen Partner übernehmen.",
        },
        {
          question: "Wo läuft unsere Anwendung?",
          answer: "Auf Wunsch auf Servern in Deutschland, ohne Dienste von US-Anbietern.",
        },
        {
          question: "Mit wem haben wir es im Betrieb zu tun?",
          answer:
            "Mit den Menschen, die Ihre Software entwickeln, vom ersten Gespräch bis zum Betrieb. Keine wechselnden Kontakte, kein Callcenter dazwischen.",
        },
      ],
      projekt: MEISTRUM,
    },
    content: [
      {
        kind: "p",
        text: "Nach dem Start einer Anwendung bleiben wir ansprechbar: für Updates und Sicherheitskorrekturen, für Überwachung und Fehleranalyse, für neue Funktionen nach Bedarf.",
      },
      {
        kind: "p",
        text: "Software ist selten fertig – Anforderungen ändern sich, Nutzungszahlen wachsen, neue Vorschriften kommen hinzu. Wir begleiten diese Entwicklung, statt nach der Übergabe den Kontakt zu verlieren.",
      },
      {
        kind: "p",
        text: "Auf Wunsch betreiben wir Ihre Anwendung auf Servern in Deutschland, ohne Dienste von US-Anbietern.",
      },
    ],
  },
  {
    // Nesting anchor + real intro content (unlike "leistungen", nothing overrides its own route).
    slug: "branchen",
    title: "Branchen",
    content: [
      {
        kind: "p",
        text: "Wir entwickeln Software für unterschiedliche Branchen des Mittelstands. Hier zeigen wir, wie das konkret aussieht.",
      },
    ],
  },
  {
    // The only branch with real evidence behind it so far: Meistrum + the Krone-Parkett case.
    slug: "handwerk",
    title: "Handwerk",
    parent: "branchen",
    content: [
      { kind: "h2", text: "Software für Handwerksbetriebe" },
      {
        kind: "p",
        text: "Bodenleger, Maler und andere Handwerksbetriebe verwalten ihren Alltag oft über mehrere getrennte Werkzeuge: eine Liste für Kunden, ein Ordner für Kalkulationen, ein weiteres System für Rechnungen. Wir entwickeln Software, die das zusammenführt.",
      },
      { kind: "h2", text: "Meistrum: unser eigenes Produkt für diese Branche" },
      {
        kind: "p",
        text: "Mit Meistrum bauen und betreiben wir selbst eine Anwendung für Handwerksbetriebe: Kundenverwaltung, Kalkulation, Rechnungsstellung, Werkzeug-Inventar sowie Team- und Objektplanung an einem Ort. Jede Instanz läuft single-tenant auf eigener Infrastruktur – ohne geteilte Cloud.",
      },
      { kind: "h2", text: "Ein Beispiel aus der Praxis" },
      {
        kind: "p",
        text: "Krone Parkett, ein Parkettleger-Betrieb, setzt Meistrum für die tägliche Betriebssteuerung ein. Mehr dazu im Projekt „Meistrum für Krone Parkett“ unter /projekte.",
      },
      { kind: "h2", text: "Was das für Ihren Betrieb bedeuten kann" },
      {
        kind: "p",
        text: "Unabhängig davon, ob eine bestehende Anwendung wächst oder eine neue entsteht: Wir entwickeln Web-Anwendungen und mobile Apps, verbinden sie mit Ihren bestehenden Systemen und bleiben nach dem Start für Betrieb und Weiterentwicklung ansprechbar.",
      },
    ],
  },
  // Rendered by their own routes; the pages carry the lead, the SEO fields and their sections.
  { slug: "projekte", title: "Projekte", content: [] },
  { slug: "kontakt", title: "Kontakt", content: [] },
];

// Rendered at /kontakt (looked up by title). Anrede: Sie.
export const seedContactForm = {
  title: "Kontakt",
  submitButtonLabel: "Nachricht senden",
  confirmationType: "message" as const,
  confirmation: [
    {
      kind: "p" as const,
      text: "Vielen Dank für Ihre Nachricht. Wir melden uns in der Regel innerhalb von zwei Werktagen.",
    },
  ],
  fields: [
    { blockType: "text" as const, name: "name", label: "Name", required: true, width: 50 },
    { blockType: "email" as const, name: "email", label: "E-Mail", required: true, width: 50 },
    { blockType: "textarea" as const, name: "nachricht", label: "Nachricht", required: true },
  ],
};

// An old URL pointing at a page, to exercise the redirects plugin end to end.
// Sender address of the contact form e2e test; scripts/clean-e2e.ts deletes its messages again.
export const E2E_EMAIL = "erika@example.com";

export const SEED_REDIRECT = { from: "/about", toPage: "ueber-uns", toPath: "/ueber-uns" };

// The admin account the e2e tests sign in with. scripts/prepare-e2e.ts creates it before every
// run (the seed too, when E2E_ADMIN_PASSWORD is set, as in CI); scripts/clean-e2e.ts deletes it.
export const E2E_ADMIN = {
  email: "e2e-admin@example.com",
  fallbackPassword: "e2e-passwort-schwarzwald",
};

// An editor next to it, for the role checks (e2e/admin-rollen.spec.ts); same password.
export const E2E_REDAKTEUR = { email: "e2e-redaktion@example.com" };

export type SeedProject = {
  slug: string;
  title: string;
  kunde: string;
  summary: string;
  content: Block[];
};

// Real projects are entered in /admin; the seed brings none (no invented clients).
export const seedProjects: SeedProject[] = [];

export const SEED_PATHS = [
  "/kontakt",
  "/suche",
  "/impressum",
  "/datenschutz",
  "/ueber-uns",
  "/ueber-uns/arbeitsweise",
  "/projekte",
  "/leistungen",
  "/leistungen/web-anwendungen",
  "/leistungen/mobile-apps",
  "/leistungen/schnittstellen",
  "/leistungen/modernisierung",
  "/leistungen/betrieb",
  "/branchen",
  "/branchen/handwerk",
];
