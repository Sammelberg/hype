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
    "Software für den Mittelstand: Web-Anwendungen für jedes Gerät, Geschäftssysteme mit E-Rechnung und Schnittstellen – auf Ihrem eigenen Server.",
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
    words: ["Web-Anwendungen", "Geschäftssysteme", "Schnittstellen", "Plattformen"].map((word) => ({
      word,
    })),
  },
  services: [
    {
      title: "Web-Anwendungen",
      short: "Web",
      slug: "web-anwendungen",
      glyph: "web" as const,
      text: "Portale, Kundenbereiche und interne Werkzeuge, die im Browser laufen – auf Smartphone, Tablet, Notebook und PC, ohne App-Store.",
      examples: [
        { text: "Kundenportal mit Auftragsstatus" },
        { text: "Auftrags- und Ressourcenplanung" },
        { text: "Internes Werkzeug, das die Excel-Liste ablöst" },
      ],
    },
    {
      title: "Geschäftssysteme",
      short: "Systeme",
      slug: "geschaeftssysteme",
      glyph: "system" as const,
      text: "Website und interne Steuerzentrale in einem System: Kunden, Termine, Aufträge und Rechnungen mit E-Rechnung – auf Ihrem Server.",
      examples: [
        { text: "Angebot, Auftrag und Rechnung ohne Medienbruch" },
        { text: "E-Rechnung, geprüft mit dem KoSIT-Validator" },
        { text: "Kalender und Wiedervorlagen mit allen Fristen" },
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
  // The home page's timeline: the dates of § 14 UStG as amended by the Wachstumschancengesetz.
  eRechnung: {
    title: "Die E-Rechnung kommt für jedes Unternehmen",
    lead: "Empfangen müssen Unternehmen E-Rechnungen schon heute, ausstellen ab 2027. Unsere Geschäftssysteme schreiben sie nach EN 16931 – geprüft mit dem Validator der KoSIT und unveränderbar archiviert.",
    milestones: [
      {
        date: "27.03.2024",
        title: "Gesetz verkündet",
        text: "Das Wachstumschancengesetz macht die E-Rechnung zwischen Unternehmen im Inland zur Pflicht.",
      },
      {
        date: "01.01.2025",
        title: "Empfangen: alle",
        text: "Jedes Unternehmen muss E-Rechnungen annehmen können, ohne Übergangsfrist.",
      },
      {
        date: "01.01.2027",
        title: "Ausstellen: über 800\u00a0000\u00a0€",
        text: "Pflicht für Unternehmen mit mehr als 800\u00a0000\u00a0€ Umsatz im Vorjahr.",
      },
      {
        date: "01.01.2028",
        title: "Ausstellen: alle",
        text: "Papier und PDF gelten zwischen Unternehmen nicht mehr als Rechnung.",
      },
    ],
  },
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
      title: "Daten auf Ihrem Server",
      text: "Ihre Anwendung läuft auf Ihrem eigenen Server – bei einem deutschen Anbieter oder bei Ihnen im Haus, ohne Dienste von US-Anbietern.",
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
        "Auf Ihrem eigenen Server – bei einem deutschen Anbieter wie IONOS oder bei Ihnen im Haus, ohne Dienste von US-Anbietern. Sie behalten die Kontrolle über Ihre Daten.",
    },
    {
      question: "Entwickeln Sie auch Apps für iOS und Android?",
      answer:
        "Nein, mit Absicht. Wir entwickeln Web-Anwendungen, die auf Smartphone, Tablet, Notebook und PC laufen – aus einem Code, ohne App-Store. Sie lassen sich wie eine App auf dem Startbildschirm ablegen und arbeiten, wo nötig, auch ohne Netz.",
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

// Every statement below rests on what the owner confirmed (.agents/product-marketing.md): no prices,
// no durations, no native apps (web applications for every device, owner 2026-10-01), no taking
// over other people's software. The stack is named on /ueber-uns/technologie (owner, 2026-10-01).
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
        text: "Schwarzwald Systems entwickelt individuelle Software für mittelständische Unternehmen: Web-Anwendungen für jedes Gerät, Geschäftssysteme mit E-Rechnung, Schnittstellen zwischen bestehenden Systemen, die Modernisierung gewachsener Software und ihren Betrieb.",
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
    // Only what the owner confirmed (.agents/product-marketing.md): no background, team size or
    // region until the owner names them.
    slug: "ueber-uns",
    title: "Über uns",
    lead: "Ein Softwareunternehmen aus Freiburg im Breisgau. Wir entwickeln individuelle Software für den Mittelstand – und wer anfragt, spricht direkt mit dem Inhaber.",
    content: [
      {
        kind: "p",
        text: "Schwarzwald Systems entwickelt Web-Anwendungen für jedes Gerät und ganze Geschäftssysteme, verbindet bestehende Systeme, modernisiert gewachsene Software und betreibt sie weiter. Wir arbeiten für mittelständische Unternehmen, deren Abläufe nicht in eine Standardsoftware passen.",
      },
      { kind: "h2", text: "Wer hinter Schwarzwald Systems steht" },
      {
        kind: "p",
        text: "Oleksandr Zamula hat Schwarzwald Systems gegründet und führt das Unternehmen als Inhaber. Wer bei uns anfragt, spricht direkt mit ihm – vom ersten Gespräch bis zum Betrieb, ohne wechselnde Ansprechpartner.",
      },
      { kind: "h2", text: "Worauf Sie sich verlassen können" },
      {
        kind: "ul",
        items: [
          "Quellcode und Dokumentation übergeben wir vollständig. Sie bleiben unabhängig von uns.",
          "Sie haben einen festen Ansprechpartner, der Ihr Projekt kennt.",
          "Ihre Anwendung läuft auf Ihrem eigenen Server – in Deutschland oder bei Ihnen im Haus, ohne Dienste von US-Anbietern.",
        ],
      },
      { kind: "h2", text: "Was wir bewusst nicht tun" },
      {
        kind: "ul",
        items: [
          "Keine nativen Apps: Eine Web-Anwendung läuft auf jedem Gerät, aus einem Code.",
          "Keine US-Cloud: Kundendaten und Rechnungen bleiben auf Ihrem Server.",
          "Kein Tracking: keine Cookies für Besucher, keine Analysedienste von Dritten.",
          "Keine Versprechen ohne Beleg: Was wir schätzen, nennen wir eine Schätzung.",
        ],
      },
      { kind: "h2", text: "Wie wir arbeiten" },
      {
        kind: "rich",
        parts: [
          "Jedes Projekt beginnt mit einem Workshop, in dem wir Ziele, Nutzer und Randbedingungen klären. Danach erhalten Sie eine schriftliche Einschätzung zu Umfang und Vorgehen, dann einen klickbaren Prototyp, dann die Software in kurzen Iterationen mit lauffähigen Zwischenständen. Die einzelnen Schritte beschreibt ",
          { text: "unsere Arbeitsweise", href: "/ueber-uns/arbeitsweise" },
          ".",
        ],
      },
      { kind: "h2", text: "Daten und Technik" },
      {
        kind: "rich",
        parts: [
          "Warum Ihre Daten auf Ihrem eigenen Server bleiben, erklärt die Seite ",
          { text: "Datensouveränität", href: "/ueber-uns/datensouveraenitaet" },
          ". Womit wir bauen, zeigt ",
          { text: "Technologie", href: "/ueber-uns/technologie" },
          ".",
        ],
      },
      { kind: "h2", text: "Ein Beispiel" },
      {
        kind: "rich",
        parts: [
          "Wie das in der Praxis aussieht, zeigt das Projekt ",
          { text: "Meistrum für Krone Parkett", href: "/projekte/meistrum-krone-parkett" },
          ": Kundenverwaltung, Kalkulation, Rechnungen, Werkzeuge und Einsatzplanung eines Parkettleger-Betriebs an einem Ort.",
        ],
      },
    ],
  },
  {
    // Expands the 4 steps + 3 principles already live on the home page into real depth —
    // no claims beyond those already published there.
    slug: "arbeitsweise",
    title: "Unsere Arbeitsweise",
    parent: "ueber-uns",
    lead: "Vier Schritte vom ersten Gespräch bis zum laufenden Betrieb – und drei Zusagen, die in jedem Projekt gelten.",
    content: [
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
        text: "Web-Anwendungen, Geschäftssysteme, Schnittstellen, Modernisierung sowie Betrieb und Weiterentwicklung: was wir für den Mittelstand entwickeln.",
      },
    ],
  },
  {
    slug: "web-anwendungen",
    title: "Web-Anwendungen",
    parent: "leistungen",
    lead: "Portale, interne Werkzeuge und Planungssysteme, die im Browser laufen – auf Smartphone, Tablet, Notebook und PC, zugeschnitten auf die Abläufe Ihres Betriebs.",
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
        "Eine Anwendung für Smartphone, Tablet und PC, ohne App-Store",
        "Installierbar und offline nutzbar, wo es nötig ist",
        "Anbindung an Ihre bestehenden Systeme, wo nötig",
        "Vollständiger Quellcode und Dokumentation",
        "Betrieb auf Ihrem eigenen Server in Deutschland",
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
            "Ja. Eine Web-Anwendung läuft im Browser, also auf jedem Gerät mit aktuellem Browser. Auf Wunsch lässt sie sich wie eine App auf dem Startbildschirm ablegen und arbeitet auch ohne Netz weiter; Eingaben werden abgeglichen, sobald wieder eine Verbindung besteht.",
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
            "Auf Ihrem eigenen Server – bei einem deutschen Anbieter oder bei Ihnen im Haus, ohne Dienste von US-Anbietern.",
        },
      ],
      projekt: MEISTRUM,
    },
    content: [
      {
        kind: "p",
        text: "Wir entwickeln Web-Anwendungen, die im Browser laufen – auf Smartphone, Tablet, Notebook und PC, aus einem Code und ohne App-Store. Das reicht vom Kundenportal mit Auftragsstatus über interne Werkzeuge, die eine gewachsene Excel-Liste ablösen, bis zur vollständigen Auftrags- und Ressourcenplanung.",
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
    // Was "Mobile Apps" until 2026-10-01 (no native apps, the owner's call); scripts/seed.ts moves
    // that page here, so its address redirects. What the system includes is the Büro (src/buero)
    // and the CMS of this very codebase.
    slug: "geschaeftssysteme",
    title: "Geschäftssysteme",
    parent: "leistungen",
    lead: "Ihre Website und Ihre interne Steuerzentrale in einem System: Kunden, Angebote, Aufträge, Verträge, Rechnungen und Termine – mit E-Rechnung, auf Ihrem eigenen Server.",
    leistung: {
      fit: [
        {
          title: "Ihre Abläufe stecken in fünf Programmen",
          text: "Kunden in einer Liste, Angebote im Textprogramm, Rechnungen in einem dritten Werkzeug: Jede Übergabe kostet Zeit und erzeugt Fehler. Ein Geschäftssystem führt alles an einer Stelle zusammen.",
        },
        {
          title: "Die E-Rechnung wird Pflicht",
          text: "Ab 2027 müssen Unternehmen mit mehr als 800\u00a0000\u00a0€ Vorjahresumsatz E-Rechnungen ausstellen, ab 2028 alle. Das System schreibt sie als XRechnung nach EN 16931.",
        },
        {
          title: "Fristen gehen im Alltag unter",
          text: "Fällige Rechnungen, Mahnfristen, Kündigungstermine, Wiedervorlagen: Der Kalender zeigt jedes Datum, das Ihr Unternehmen kennt.",
        },
      ],
      scope: [
        "Website mit eigenem CMS: Entwürfe, Vorschau, Versionen, Zeitplan",
        "Kunden, Angebote, Aufträge und Verträge mit fortlaufenden Nummern",
        "Rechnungen, Abschläge, Schlussrechnung und Storno als XRechnung",
        "Offene Posten, Teilzahlungen und Mahnungen mit Verzugszinsen",
        "Kalender und Wiedervorlagen mit allen Fristen",
        "Export für den Steuerberater, auch als DATEV-Buchungsstapel",
        "Rollen, unveränderbares Protokoll, Betrieb auf Ihrem Server",
      ],
      steps: [
        {
          title: "Abläufe aufnehmen",
          text: "Wir sehen uns an, wie heute ein Auftrag durch Ihr Unternehmen läuft: von der Anfrage über Angebot und Rechnung bis zum Steuerberater.",
        },
        {
          title: "Kern einrichten",
          text: "Website, Kundenverwaltung, Dokumente und Rechnungen stehen als erprobter Kern bereit. Wir stellen ihn auf Ihre Begriffe, Nummernkreise und Firmendaten ein.",
        },
        {
          title: "Ihre Abläufe automatisieren",
          text: "Was nur Ihr Unternehmen so macht, bauen wir dazu: eigene Dokumente, Freigaben, Auswertungen und Schnittstellen.",
        },
        {
          title: "Betreiben und weiterentwickeln",
          text: "Das System läuft auf Ihrem Server. Wir halten es aktuell und erweitern es, wenn neue Anforderungen oder Vorschriften dazukommen.",
        },
      ],
      faq: [
        {
          question: "Ist die E-Rechnung schon eingebaut?",
          answer:
            "Ja. Das System erzeugt Rechnungen als XRechnung 3.0 (UBL) nach EN 16931; jede Rechnungsart ist mit dem Validator der KoSIT geprüft, gestellte Rechnungen werden unveränderbar archiviert. Ab wann die Pflicht für Ihr Unternehmen gilt, klären Sie am besten mit Ihrem Steuerberater.",
        },
        {
          question: "Ersetzt das System unsere Buchhaltung?",
          answer:
            "Nein. Es schreibt Angebote und Rechnungen und verfolgt Zahlungen. Die Buchhaltung bleibt bei Ihrem Steuerberater; er erhält Rechnungsjournal, Umsatzsteuer je Monat und einen DATEV-Buchungsstapel als Datei.",
        },
        {
          question: "Wo laufen das System und unsere Daten?",
          answer:
            "Auf Ihrem eigenen Server – bei einem deutschen Anbieter oder bei Ihnen im Haus. Kundendaten und Rechnungen gehen an keine Dienste von US-Anbietern.",
        },
      ],
      projekt: MEISTRUM,
    },
    content: [
      {
        kind: "p",
        text: "Eine Website bringt Anfragen. Was danach kommt – Angebot, Auftrag, Vertrag, Rechnung, Zahlung – läuft in vielen Unternehmen über mehrere getrennte Programme. Ein Geschäftssystem führt beides zusammen: das Schaufenster nach außen und die Steuerzentrale nach innen, mit einer Datenbank und einer Anmeldung.",
      },
      {
        kind: "p",
        text: "Der Kern ist für jedes Unternehmen gleich und erprobt. Darüber bauen wir, was nur Ihr Betrieb so macht: Dokumente, Freigaben, Auswertungen und Automatisierungen für Ihre Abläufe.",
      },
      {
        kind: "p",
        text: "Das System läuft auf Ihrem eigenen Server. Quellcode und Dokumentation gehören Ihnen.",
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
    // An overview: no h2 of its own, so the pages below it are its body (one row each).
    slug: "branchen",
    title: "Branchen",
    lead: "Jede Branche hat ihre eigenen Abläufe, Begriffe und Vorschriften. Hier zeigen wir, wie unsere Software in einer Branche konkret aussieht.",
    content: [
      {
        kind: "rich",
        parts: [
          "Der Kern unserer Geschäftssysteme ist für jedes Unternehmen gleich: Kunden, Dokumente, Rechnungen, Kalender. Darüber bauen wir, was Ihre Branche braucht – für Dienstleister Verträge mit laufenden Rechnungen, für den Handel Shop und E-Rechnung, für Produktion und Technik Wartungsverträge und Fristen. Ihre Branche ist hier nicht dabei? Unsere ",
          { text: "Leistungen", href: "/leistungen" },
          " sind an keine Branche gebunden – ",
          { text: "erzählen Sie uns von Ihrem Vorhaben", href: "/kontakt" },
          ".",
        ],
      },
    ],
  },
  {
    // The only branch with real evidence behind it so far: Meistrum + the Krone-Parkett case.
    slug: "handwerk",
    title: "Handwerk",
    parent: "branchen",
    lead: "Kunden, Kalkulation, Rechnungen, Werkzeuge und Einsätze an einem Ort: Software für Handwerksbetriebe, wie wir sie mit Meistrum selbst entwickeln und betreiben.",
    content: [
      {
        kind: "p",
        text: "Bodenleger, Maler und andere Handwerksbetriebe verwalten ihren Alltag oft über mehrere getrennte Werkzeuge: eine Liste für Kunden, ein Ordner für Kalkulationen, ein weiteres System für Rechnungen. Wir entwickeln Software, die das zusammenführt.",
      },
      { kind: "h2", text: "Meistrum: unser eigenes Produkt für diese Branche" },
      {
        kind: "p",
        text: "Mit Meistrum entwickeln und betreiben wir selbst eine Anwendung für Handwerksbetriebe – von der Anfrage über die Baustelle bis zur Rechnung. Vorlagen gibt es für Bodenleger, Maler, Fliesenleger und Estrichleger. Jeder Betrieb bekommt seine eigene Instanz auf eigener Infrastruktur, ohne geteilte Cloud.",
      },
      { kind: "h2", text: "Ein Arbeitsplatz für jede Rolle" },
      {
        kind: "p",
        text: "Jede Rolle sieht nur, was sie für ihre Arbeit braucht:",
      },
      {
        kind: "ul",
        items: [
          "Geschäftsführung",
          "Büro und Teamleitung",
          "Baustelle, auch offline",
          "Kundenportal",
          "Subunternehmer",
          "Steuerberater",
        ],
      },
      { kind: "h2", text: "Von der Baustelle bis zur Rechnung" },
      {
        kind: "p",
        text: "Aufmaß, Bautagebuch mit Wetterdaten, CM-Messung, Rapport mit Unterschrift, Mängel und Nachträge entstehen vor Ort auf Smartphone oder Tablet, auch ohne Netz. Im Büro werden daraus Angebot, Abschläge und Schlussrechnung, als XRechnung oder ZUGFeRD. Werkzeug, Material und Zeiten führt Meistrum mit.",
      },
      { kind: "h2", text: "Anschluss an Ihre Partner" },
      {
        kind: "ul",
        items: [
          "DATEV für Buchhaltung und Lohn",
          "GAEB für Leistungsverzeichnisse",
          "Datanorm für die Preise der Händler",
          "iCal und CalDAV für jeden Kalender",
        ],
      },
      { kind: "h2", text: "Ein Beispiel aus der Praxis" },
      {
        kind: "rich",
        parts: [
          "Krone Parkett, ein Parkettleger-Betrieb, setzt Meistrum für die tägliche Betriebssteuerung ein. Wie das aussieht, zeigt das Projekt ",
          { text: "Meistrum für Krone Parkett", href: "/projekte/meistrum-krone-parkett" },
          ".",
        ],
      },
      { kind: "h2", text: "Was das für Ihren Betrieb bedeuten kann" },
      {
        kind: "rich",
        parts: [
          "Ob eine bestehende Anwendung wächst oder eine neue entsteht: Wir entwickeln ",
          { text: "Web-Anwendungen", href: "/leistungen/web-anwendungen" },
          " für Büro und Baustelle und ganze ",
          { text: "Geschäftssysteme", href: "/leistungen/geschaeftssysteme" },
          ", verbinden sie mit Ihren bestehenden Systemen und bleiben nach dem Start für Betrieb und Weiterentwicklung ansprechbar.",
        ],
      },
    ],
  },
  {
    // The headline topic of the owner's offer (2026-10-01). Legal facts: § 14 UStG as amended by
    // the Wachstumschancengesetz, BMF-Schreiben of 15.10.2024; what we deliver: src/buero
    // (XRechnung 3.0, KoSIT- and Mustang-checked, GoBD triggers). Numbered h2s: one way of steps.
    slug: "e-rechnung",
    title: "E-Rechnung",
    lead: "Empfangen müssen Unternehmen E-Rechnungen schon heute, ab 2027 auch ausstellen. Unsere Systeme schreiben sie nach EN 16931 – geprüft mit dem Validator der KoSIT und unveränderbar archiviert.",
    content: [
      {
        kind: "p",
        text: "Eine E-Rechnung ist ein strukturierter Datensatz, den Software ohne Abtippen verarbeitet. Ein PDF per E-Mail ist keine E-Rechnung. Hier steht, was das Gesetz verlangt, welche Standards wir einhalten und was die E-Rechnung Ihrem Unternehmen bringt.",
      },
      { kind: "h2", text: "1. Was das Gesetz verlangt" },
      {
        kind: "p",
        text: "Mit dem Wachstumschancengesetz wird die E-Rechnung zwischen Unternehmen im Inland Pflicht (§ 14 UStG). Seit dem 1. Januar 2025 muss jedes Unternehmen E-Rechnungen empfangen können. Ab dem 1. Januar 2027 müssen Unternehmen mit mehr als 800\u00a0000\u00a0€ Vorjahresumsatz sie ausstellen, ab dem 1. Januar 2028 alle.",
      },
      {
        kind: "p",
        text: "Ausgenommen sind unter anderem Kleinbetragsrechnungen bis 250\u00a0€ und Rechnungen an Privatkunden. Wie die Regeln für Ihr Unternehmen gelten, klärt Ihr Steuerberater; die Verwaltung erläutert sie im BMF-Schreiben vom 15. Oktober 2024.",
      },
      { kind: "h2", text: "2. Welche Formate zählen" },
      {
        kind: "p",
        text: "Eine E-Rechnung folgt der europäischen Norm EN 16931. In Deutschland sind das vor allem XRechnung, reines XML, und ZUGFeRD ab Version 2.0.1, ein PDF mit eingebettetem XML. Nach der Übergangszeit ist eine Papier- oder PDF-Rechnung zwischen Unternehmen keine ordnungsgemäße Rechnung mehr. Ihre Kunden werden E-Rechnungen verlangen, denn davon hängt ihr Vorsteuerabzug ab.",
      },
      { kind: "h2", text: "3. Was wir liefern" },
      {
        kind: "p",
        text: "Unsere Systeme erzeugen Rechnungen als XRechnung 3.0 (UBL 2.1). Jede Rechnungsart – Rechnung, Abschlag, Schlussrechnung mit Abzug der Abschläge, Storno und laufende Rechnungen aus Verträgen – ist mit dem Validator der KoSIT geprüft und zusätzlich mit einem zweiten Prüfwerkzeug. Fehlt eine Pflichtangabe nach § 14 Abs. 4 UStG, lässt sich die Rechnung nicht stellen.",
      },
      { kind: "h2", text: "4. Unveränderbar archiviert" },
      {
        kind: "p",
        text: "Eine gestellte Rechnung bekommt die nächste fortlaufende Nummer und ist danach eingefroren: Die Datenbank selbst verweigert jede Änderung und Löschung, Korrekturen laufen als Storno. Die erste exportierte XRechnung wird mit ihrer Prüfsumme archiviert und danach unverändert ausgegeben. So erfüllen Sie die GoBD und die Aufbewahrungsfrist von acht Jahren.",
      },
      { kind: "h2", text: "5. Was es Ihrem Unternehmen bringt" },
      {
        kind: "p",
        text: "Die Rechnung geht am Tag der Leistung hinaus und landet beim Kunden direkt in der Buchhaltung. Betrag, Bankverbindung und Steuernummer kommen aus dem Auftrag, nicht aus einer Abschrift. Teilzahlungen, offene Posten und Mahnungen mit Verzugszinsen nach § 288 BGB verfolgt das System, und Ihr Steuerberater erhält Rechnungsjournal, Umsatzsteuer je Monat und einen DATEV-Buchungsstapel als Datei.",
      },
      { kind: "h2", text: "Ein Rechenbeispiel" },
      {
        kind: "p",
        text: "150 Rechnungen im Monat, zehn Minuten weniger Arbeit je Rechnung, 60\u00a0€ Stundensatz im Büro: 1\u00a0500\u00a0€ im Monat. Werden Rechnungen zehn Tage früher bezahlt, liegen bei 200\u00a0000\u00a0€ Monatsumsatz dauerhaft rund 66\u00a0700\u00a0€ mehr auf Ihrem Konto. Das sind Beispielannahmen, keine Zusage – rechnen Sie mit Ihren eigenen Zahlen.",
      },
      { kind: "h2", text: "Wo die E-Rechnung bei uns steckt" },
      {
        kind: "rich",
        parts: [
          "Die E-Rechnung ist Teil jedes ",
          { text: "Geschäftssystems", href: "/leistungen/geschaeftssysteme" },
          ", das wir bauen, und unseres Handwerksprodukts Meistrum. ",
          { text: "Sprechen Sie uns an", href: "/kontakt" },
          ", wenn Sie wissen möchten, wie sie in Ihre Abläufe passt.",
        ],
      },
    ],
  },
  {
    // Same stack as the Geschäftssysteme plus a shop core (Medusa, the owner's shop project);
    // payment providers are the one service that sees data, so the EU preference is stated.
    slug: "online-shops",
    title: "Online-Shops",
    lead: "Ein Online-Shop auf Ihrem eigenen Server: derselbe Stack wie unsere Geschäftssysteme, mit Katalog, Kasse, Zahlung, Versand und Rechnungen nach GoBD.",
    content: [
      {
        kind: "p",
        text: "Ein Shop ist für uns ein Geschäftssystem mit Kasse. Er läuft auf Ihrem Server, die Kundendaten bleiben bei Ihnen, und Bestellungen, Rechnungen und der Export für den Steuerberater liegen an einer Stelle.",
      },
      { kind: "h2", text: "Was der Shop mitbringt" },
      {
        kind: "ul",
        items: [
          "Katalog, Suche und Produktseiten",
          "Warenkorb und Kasse",
          "Kundenkonto mit Bestellungen",
          "Versandarten und Versandzonen",
          "Rechnungen nach GoBD, 19\u00a0% und 7\u00a0%",
          "E-Rechnung für Geschäftskunden",
        ],
      },
      { kind: "h2", text: "Zahlung" },
      {
        kind: "p",
        text: "Den Zahlungsanbieter wählen Sie. Wir empfehlen Anbieter mit Sitz in der EU und binden auf Wunsch auch PayPal oder Stripe an. Der Anbieter erhält nur, was er für die Zahlung braucht; Kundenkonto, Bestellungen und Rechnungen bleiben auf Ihrem Server.",
      },
      { kind: "h2", text: "Recht und Barrierefreiheit" },
      {
        kind: "p",
        text: "Seit dem 28. Juni 2025 gilt das Barrierefreiheitsstärkungsgesetz für die meisten Shops, die an Verbraucher verkaufen. Wir prüfen jede Seite automatisch nach WCAG 2 AA. Datenexport und Löschung im Kundenkonto, Widerrufsbelehrung und Rechtstexte gehören von Anfang an dazu; die Texte selbst prüft Ihre Kanzlei.",
      },
      { kind: "h2", text: "Technik" },
      {
        kind: "p",
        text: "Der Shop baut auf Medusa, einem offenen Shop-Kern, und Next.js für die Oberfläche, mit PostgreSQL und einer selbst betriebenen Suche. Wie alles bei uns läuft er ohne Tracking-Dienste und ohne US-Cloud.",
      },
    ],
  },
  {
    // Why everything runs on the customer's own server (owner, 2026-10-01). The legal points are
    // general information, not advice; the technical ones describe this codebase (CSP, the
    // data-sovereignty e2e test, the audit chain, restic with restore tests, retention).
    slug: "datensouveraenitaet",
    title: "Datensouveränität",
    parent: "ueber-uns",
    lead: "Ihre Daten verlassen Ihren Server nicht. Alles läuft bei einem deutschen Anbieter oder bei Ihnen im Haus – ohne US-Cloud, ohne Fremddienste, ohne Telemetrie.",
    content: [
      {
        kind: "p",
        text: "Datensouveränität heißt für uns: Sie besitzen Server, Daten und Code. Kein Kundendatensatz, keine Rechnung und keine Nachricht geht an Dienste, die Sie nicht selbst kontrollieren. Die rechtlichen Hinweise ersetzen keine Beratung.",
      },
      { kind: "h2", text: "Warum das zählt" },
      {
        kind: "ul",
        items: [
          "DSGVO Art. 28 und 32: Wer Daten verarbeiten lässt, haftet für die Wahl des Dienstleisters und für angemessene Sicherheit.",
          "DSGVO Art. 44 ff.: Daten dürfen nur mit tragfähiger Grundlage in Drittländer. Der EuGH hat 2020 den Privacy Shield gekippt (Schrems II, C-311/18); sein Nachfolger beruht erneut auf Zusagen der USA.",
          "US CLOUD Act (2018): US-Anbieter müssen US-Behörden Daten herausgeben, auch aus Rechenzentren in Europa.",
          "GeschGehG § 2: Ein Geschäftsgeheimnis ist nur geschützt, wenn Sie angemessene Geheimhaltungsmaßnahmen nachweisen.",
          "NIS-2: Seit Dezember 2025 haften Geschäftsleitungen betroffener Einrichtungen persönlich für die Cybersicherheit.",
        ],
      },
      { kind: "h2", text: "Nur Ihr eigener Server" },
      {
        kind: "p",
        text: "Die Sicherheitsrichtlinie des Browsers lässt nur Ihren Server zu; Schriften, Bilder, Suche und Formulare liegen dort. Ein automatischer Test lädt jede Seite und schlägt fehl, sobald eine Anfrage an einen fremden Server geht.",
      },
      { kind: "h2", text: "Nachvollziehbar und unveränderbar" },
      {
        kind: "p",
        text: "Anmeldungen, Veröffentlichungen, Löschungen und gestellte Rechnungen stehen in einem Protokoll, dessen Einträge als Hash-Kette verbunden sind. Die Datenbank verweigert jede Änderung daran.",
      },
      { kind: "h2", text: "Gesichert und wiederhergestellt" },
      {
        kind: "p",
        text: "Sicherungen werden verschlüsselt, bevor sie den Server verlassen, und jeden Monat probeweise zurückgespielt und verglichen. Löschfristen laufen automatisch.",
      },
      { kind: "h2", text: "Zwei Wege zum eigenen Server" },
      {
        kind: "p",
        text: "Die meisten Unternehmen wählen einen eigenen Server bei einem deutschen Anbieter wie IONOS, mit einem Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO; wir richten ihn ein und betreiben ihn. Wer eine eigene IT hat, betreibt das System im Haus, und wir greifen nur auf Ihre Freigabe zu.",
      },
    ],
  },
  {
    // The stack, named by the owner's wish (2026-10-01); logos only in the presentation, since
    // rich text has no logo block. List-only parts: promises.
    slug: "technologie",
    title: "Technologie",
    parent: "ueber-uns",
    lead: "Offene, bewährte Technik, die auf Ihrem Server läuft – ohne Telemetrie und ohne Bindung an einen Anbieter.",
    content: [
      {
        kind: "p",
        text: "Wir bauen mit Werkzeugen, die offen, weit verbreitet und gut dokumentiert sind. So kann auch ein anderes Team an Ihrer Software weiterarbeiten, und keines davon sendet Ihre Daten an Dritte.",
      },
      { kind: "h2", text: "Oberfläche" },
      {
        kind: "ul",
        items: [
          "Next.js und React",
          "TypeScript, streng geprüft",
          "Tailwind CSS und shadcn/ui",
          "GSAP und Three.js für Bewegung",
        ],
      },
      { kind: "h2", text: "Daten" },
      {
        kind: "ul",
        items: [
          "PostgreSQL",
          "Drizzle und Prisma",
          "Zod an jeder Eingabe",
          "Volltextsuche auf Deutsch",
        ],
      },
      { kind: "h2", text: "Betrieb" },
      {
        kind: "ul",
        items: [
          "Linux-Server in Deutschland",
          "Docker und Caddy mit TLS",
          "WireGuard für den Wartungszugang",
          "Verschlüsselte Sicherungen mit restic",
        ],
      },
      { kind: "h2", text: "Qualität" },
      {
        kind: "ul",
        items: [
          "Vitest und Playwright",
          "Barrierefreiheit nach WCAG 2 AA",
          "Test gegen Anfragen an fremde Server",
          "Prüfung bei jeder Änderung",
        ],
      },
      { kind: "h2", text: "Was Sie davon haben" },
      {
        kind: "p",
        text: "Sie erhalten den vollständigen Quellcode und die Dokumentation. Die Technik ist so verbreitet, dass Sie für die Weiterentwicklung nicht auf uns angewiesen sind.",
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

// The sections of the navigation in their order (cms.pages.sort_order); Seiten → Reihenfolge
// changes it later.
export const SEED_NAV_ORDER = [
  "leistungen",
  "e-rechnung",
  "online-shops",
  "branchen",
  "projekte",
  "ueber-uns",
];

// Pages whose slug the seed changed: scripts/seed.ts moves an existing page to its new slug and
// publishes it, so its old address redirects (redirectMoves) instead of the page being doubled.
export const SEED_RENAMED = [{ from: "mobile-apps", to: "geschaeftssysteme" }];

export const SEED_PATHS = [
  "/kontakt",
  "/suche",
  "/impressum",
  "/datenschutz",
  "/ueber-uns",
  "/ueber-uns/arbeitsweise",
  "/ueber-uns/datensouveraenitaet",
  "/ueber-uns/technologie",
  "/e-rechnung",
  "/online-shops",
  "/projekte",
  "/leistungen",
  "/leistungen/web-anwendungen",
  "/leistungen/geschaeftssysteme",
  "/leistungen/schnittstellen",
  "/leistungen/modernisierung",
  "/leistungen/betrieb",
  "/branchen",
  "/branchen/handwerk",
];
