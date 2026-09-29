// Content for `pnpm seed`: the site's own pages, the legal pages with the owner's details
// (Einzelunternehmen, 2026-09-29) and the home content. No client projects: real ones are entered in
// /admin (the Krone Parkett project lives only in the database).
// e2e tests import SEED_PATHS, so every seeded route is also checked for data sovereignty and a11y.
// `pnpm init:project` rewrites siteName, ownerName and contactEmail below.

type Text = { type: "text"; text: string };
type Block =
  | { kind: "p" | "h2"; text: string }
  /** One paragraph with line breaks (an address). */
  | { kind: "lines"; lines: string[] }
  | { kind: "ul"; items: string[] }
  /** One paragraph with links inside (a part with `href` becomes a link). */
  | { kind: "rich"; parts: (string | { text: string; href: string })[] };

// The examples/steps/principles/FAQ describe kinds of work, not references; the principles' claims
// are confirmed by the owner (2026-09-29). Edited under /admin → Website-Einstellungen.
export const seedSettings = {
  siteName: "Schwarzwald Systems",
  ownerName: "Schwarzwald Systems",
  tagline: "Individuelle Software für den Mittelstand.",
  description:
    "Schwarzwald Systems entwickelt individuelle Software für mittelständische Unternehmen: Web-Anwendungen, mobile Apps und Schnittstellen.",
  // Shown in the footer, on /kontakt and in the legal pages once set (the owner's address follows).
  contactEmail: null as string | null,
  socialLinks: [] as { label: string; url: string }[],
  // The other home and page texts (headings, leads, the closing invitation) are the fields' default
  // values in src/cms/globals/SiteSettings.ts; a fresh database gets them from there.
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
    ]) as never,
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

export type SeedPage = { slug: string; title: string; parent?: string; content: Block[] };

export const seedPages: SeedPage[] = [
  {
    // HOME_SLUG (src/cms/collections/Pages.ts): rendered at `/` by code; this doc carries the SEO
    // tab and what the site search shows for the home page.
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
        text: "Wir löschen Ihre Nachricht, sobald Ihr Anliegen erledigt ist. Wird aus der Anfrage ein Auftrag, bewahren wir sie so lange auf, wie es handels- und steuerrechtliche Fristen verlangen.",
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
    // Exists only as the nested-docs anchor for the 5 children below — /leistungen itself is
    // rendered by its own route (src/app/(frontend)/leistungen/page.tsx), not by this content.
    slug: "leistungen",
    title: "Leistungen",
    content: [{ kind: "p", text: "Anker für die einzelnen Leistungsseiten. Kein eigener Inhalt." }],
  },
  {
    slug: "web-anwendungen",
    title: "Web-Anwendungen",
    parent: "leistungen",
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
    { blockType: "text", name: "name", label: "Name", required: true, width: 50 },
    { blockType: "email", name: "email", label: "E-Mail", required: true, width: 50 },
    { blockType: "textarea", name: "nachricht", label: "Nachricht", required: true },
  ],
};

// An old URL pointing at a page, to exercise the redirects plugin end to end.
// Sender address of the contact form e2e test; scripts/clean-e2e.ts deletes its messages again.
export const E2E_EMAIL = "erika@example.com";

export const SEED_REDIRECT = { from: "/about", toPage: "ueber-uns", toPath: "/ueber-uns" };

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

// Minimal Lexical document (the shape Payload's richText field stores).
export function lexical(blocks: Block[]) {
  const text = (value: string): Text & Record<string, unknown> => ({
    type: "text",
    text: value,
    format: 0,
    detail: 0,
    mode: "normal",
    style: "",
    version: 1,
  });
  const common = { format: "", indent: 0, version: 1, direction: "ltr" as const };
  return {
    root: {
      type: "root",
      ...common,
      children: blocks.map((b) => {
        if (b.kind === "h2")
          return { type: "heading", tag: "h2", ...common, children: [text(b.text)] };
        if (b.kind === "lines")
          return {
            type: "paragraph",
            textFormat: 0,
            ...common,
            children: b.lines.flatMap((line, i) =>
              i === 0 ? [text(line)] : [{ type: "linebreak", version: 1 }, text(line)],
            ),
          };
        if (b.kind === "ul")
          return {
            type: "list",
            listType: "bullet",
            tag: "ul",
            start: 1,
            ...common,
            children: b.items.map((item, i) => ({
              type: "listitem",
              value: i + 1,
              ...common,
              children: [text(item)],
            })),
          };
        if (b.kind === "rich")
          return {
            type: "paragraph",
            textFormat: 0,
            ...common,
            children: b.parts.map((part) =>
              typeof part === "string"
                ? text(part)
                : {
                    type: "link",
                    fields: { linkType: "custom", url: part.href, newTab: false },
                    ...common,
                    version: 3,
                    children: [text(part.text)],
                  },
            ),
          };
        return { type: "paragraph", textFormat: 0, ...common, children: [text(b.text)] };
      }),
    },
  };
}
