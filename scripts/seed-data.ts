// Content for `pnpm seed`: neutral placeholder content for the template — the routed pages with
// their sections, the legal pages with the places the owner fills in, one page with a page below
// it. No client projects: real ones are entered in /admin.
// e2e tests import SEED_PATHS, so every seeded route is also checked for data sovereignty and a11y.
// `pnpm init:project` rewrites siteName, ownerName and contactEmail below; the texts are the
// project's to replace.

import { type Block, lexical } from "../src/cms/rich-text/build";

export { lexical };

// What every page shares: /admin → Website. The closing invitation starts from
// SITE_TEXT_DEFAULTS in src/cms/content/site-settings.ts.
export const seedSettings = {
  siteName: "Hype Agency",
  ownerName: "Hype Agency",
  tagline: "Ein kurzer Satz, der sagt, was Sie tun.",
  description:
    "Beschreibung der Website für Suchmaschinen: was Sie anbieten, für wen und wo – höchstens 160 Zeichen.",
  // Shown in the footer, on /kontakt and in the legal pages once set.
  contactEmail: "hallo@example.com" as string | null,
  socialLinks: [] as { label: string; url: string }[],
  // The closing invitation under every page; without it, SITE_TEXT_DEFAULTS.
  cta: {
    title: "Der Samstag ist noch frei?",
    text: "Figur, Paket und Ort wählen, den Endpreis sehen und den Termin gleich festhalten. Eine Anzahlung, und die Feier steht.",
    label: "Termin buchen",
  } as { title?: string; text?: string; label?: string },
};

// The sections of the pages with a route of their own (/admin → Seiten → Startseite, Kontakt);
// headings start from src/cms/content/page-sections.ts.
export const seedSections = {
  hero: {
    headline: "Wer kommt zum Kinder­geburtstag?",
    lead: "Eisprinzessin, Superheld oder Zauberer. Sie sehen sofort, was es bei Ihnen kostet und welcher Samstag noch frei ist, ganz ohne Anruf.",
  },
  // Headings of the home sections; without them, HOME_DEFAULTS.
  titles: {
    stepsTitle: "So buchen Sie",
    principlesTitle: "Worauf Sie sich verlassen können",
    faqTitle: "Fragen von Eltern",
  } as { stepsTitle?: string; principlesTitle?: string; faqTitle?: string },
  steps: [
    {
      title: "Figur wählen",
      text: "Nach Alter, Sprache oder Thema. Jede Figur bringt ihr eigenes Programm mit.",
    },
    {
      title: "Ort und Termin",
      text: "Sie sehen gleich, welche Samstage frei sind und was es bei Ihnen kostet.",
    },
    {
      title: "Anzahlung",
      text: "Mit der Anzahlung ist der Termin fest für Sie reserviert. Die Bestätigung kommt sofort per E-Mail.",
    },
    {
      title: "Die Feier",
      text: "Die Figur klingelt pünktlich, im Kostüm und mit allem, was das Programm braucht.",
    },
  ],
  principles: [
    {
      title: "Der Preis steht vorher fest",
      text: "Paket, Anfahrt und Extras sehen Sie, bevor Sie Ihre Daten eingeben. Später kommt nichts dazu.",
    },
    {
      title: "Pünktlich, mit Plan",
      text: "Wir planen die Anfahrt in jeden Termin ein. Wer bei Ihnen klingelt, kommt nicht gehetzt von der letzten Feier.",
    },
    {
      title: "In Ihrer Sprache",
      text: "Viele Figuren spielen auch auf Ukrainisch, Russisch oder Englisch. Sie wählen es bei der Buchung.",
    },
    {
      title: "Fair bei Absagen",
      text: "Sagen Sie mehr als 14 Tage vorher ab, bekommen Sie die Anzahlung zurück. Die Bedingungen stehen vor der Buchung da.",
    },
  ],
  faq: [
    {
      question: "Wie viel Platz brauchen wir?",
      answer:
        "Ein Wohnzimmer, in dem man den Tisch beiseiteschieben kann, reicht. Dazu eine freie Ecke zum Umziehen.",
    },
    {
      question: "Was passiert, wenn das Geburtstagskind krank wird?",
      answer:
        "Rufen Sie uns an oder schreiben Sie uns. Wir verschieben den Termin, solange etwas frei ist.",
    },
    {
      question: "Wo werden meine Daten gespeichert?",
      answer: "Auf unserem eigenen Server in Deutschland; wir geben sie an niemanden weiter.",
    },
  ],
  kontaktNext: {
    text: lexical([
      {
        kind: "p",
        text: "Wir lesen jede Nachricht selbst und melden uns mit einer Antwort oder einer Rückfrage.",
      },
    ]),
  },
};

export type SeedPage = {
  slug: string;
  title: string;
  parent?: string;
  lead?: string;
  content: Block[];
};

export const seedPages: SeedPage[] = [
  {
    // HOME_SLUG: rendered at `/` from its sections (seedSections); the text below is what the
    // site search shows for the home page.
    slug: "startseite",
    title: "Startseite",
    content: [
      {
        kind: "p",
        text: "Hier steht in zwei, drei Sätzen, was das Unternehmen anbietet. Die Suche der Website zeigt diesen Text für die Startseite.",
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
          "[Name des Unternehmens]",
          "Inhaber: [Vor- und Nachname]",
          "[Straße und Hausnummer]",
          "[PLZ Ort]",
          "Deutschland",
        ],
      },
      { kind: "h2", text: "Kontakt" },
      { kind: "p", text: "Sie erreichen uns über das Kontaktformular auf der Seite „Kontakt“." },
      { kind: "h2", text: "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV" },
      { kind: "p", text: "[Vor- und Nachname], Anschrift wie oben." },
      { kind: "h2", text: "Verbraucherstreitbeilegung" },
      {
        kind: "p",
        text: "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
      },
    ],
  },
  {
    // Written from what the template actually does (CLAUDE.md, data sovereignty): no cookies for
    // visitors, no third-party services, contact messages in our own database, deleted after six
    // months, announced by mail through the owner's mailbox, IONOS hosting, server logs kept 14 days. A project that changes any of it changes
    // this text; the bracketed places are the owner's to fill before launch.
    slug: "datenschutz",
    title: "Datenschutzerklärung",
    content: [
      {
        kind: "p",
        text: "Diese Website setzt beim Besuch keine Cookies, nutzt keine Analyse- oder Werbedienste und lädt Schriften und Bilder ausschließlich von unserem eigenen Server. Personenbezogene Daten verarbeiten wir nur in drei Fällen: in den technisch notwendigen Protokollen des Servers, wenn Sie uns über das Kontaktformular schreiben und wenn Sie eine Feier buchen oder anfragen.",
      },
      { kind: "h2", text: "Verantwortlicher" },
      {
        kind: "lines",
        lines: [
          "[Vor- und Nachname]",
          "[Name des Unternehmens]",
          "[Straße und Hausnummer]",
          "[PLZ Ort]",
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
      { kind: "h2", text: "Buchungen" },
      {
        kind: "p",
        text: "Wenn Sie eine Feier buchen oder anfragen, speichern wir in der Datenbank auf unserem Server Ihren Namen, Ihre E-Mail-Adresse und Telefonnummer, die Adresse der Feier, Figur, Paket, Extras und Termin sowie, wenn Sie sie angeben, Vorname und Alter des Geburtstagskinds, die Zahl der Kinder, die gewünschte Sprache und Ihre Hinweise. Wir brauchen diese Angaben, um den Besuch zu planen und durchzuführen; Adresse, Termin und Ihre Hinweise erhält die Darstellerin oder der Darsteller, die oder der zu Ihnen kommt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.",
      },
      {
        kind: "p",
        text: "Über einen persönlichen Link sehen Sie Ihre Buchung und können sie absagen. Den Link kennen nur Sie; wir speichern ihn ausschließlich verschlüsselt, damit wir ihn in E-Mails an Sie einsetzen können.",
      },
      {
        kind: "p",
        text: "Kommt eine Buchung nicht zustande (eine Anfrage ohne Buchung, eine abgelehnte Anfrage oder ein Termin, dessen Anzahlung nicht eingeht), löschen wir die Angaben sechs Monate nach der letzten Änderung automatisch. Gebuchte und abgesagte Feiern bewahren wir mit den zugehörigen Rechnungen so lange auf, wie handels- und steuerrechtliche Fristen es verlangen, höchstens zehn Jahre. [In unseren verschlüsselten Datensicherungen, die nur der Wiederherstellung dienen, können Buchungsdaten bis zu zehn Jahre erhalten bleiben; bitte prüfen lassen.]",
      },
      { kind: "h2", text: "Online-Zahlung" },
      {
        kind: "p",
        text: "Die Anzahlung können Sie online über die Mollie B.V., Keizersgracht 126, 1015 CW Amsterdam, Niederlande, bezahlen. Wir übermitteln Mollie dafür nur den Betrag, eine Beschreibung mit der Buchungsnummer und die Adresse, zu der Sie nach der Zahlung zurückkehren (sie enthält Ihren persönlichen Buchungslink). Ihre Zahlungsdaten geben Sie direkt auf der Seite von Mollie ein; wir erhalten sie nicht. Mollie verarbeitet sie als eigener Verantwortlicher, um die Zahlung auszuführen und gesetzliche Pflichten zu erfüllen, etwa zur Verhinderung von Geldwäsche; Näheres steht in der Datenschutzerklärung von Mollie. Wählen Sie eine Zahlungsart wie PayPal oder Klarna, verarbeitet auch deren Anbieter Ihre Daten nach seinen Bedingungen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.",
      },
      { kind: "h2", text: "E-Mail" },
      {
        kind: "p",
        text: "Die Website versendet E-Mails über unser eigenes Postfach bei [E-Mail-Anbieter mit Anschrift]: eine Benachrichtigung an uns, wenn Sie das Kontaktformular nutzen (mit dem Inhalt Ihrer Nachricht) oder eine Feier buchen, die E-Mails zu Ihrer Buchung an Sie (die Bestätigung mit Kalendereintrag, den Eingang Ihrer Anfrage, eine Absage, eine Erinnerung eine Woche vor der Feier und eine am Vortag) sowie Antworten oder Unterlagen, die wir Ihnen schicken. Der Anbieter verarbeitet die E-Mails in unserem Auftrag nach Art. 28 DSGVO. Welche E-Mails gesendet wurden (Empfänger, Betreff, Zeitpunkt), halten wir in einem Versandprotokoll fest; die E-Mails selbst liegen in unserem Postfach.",
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
        text: "Sie können sich bei einer Datenschutz-Aufsichtsbehörde beschweren. Für uns zuständig ist [die Datenschutz-Aufsichtsbehörde des Bundeslands, mit Anschrift].",
      },
      { kind: "p", text: "Stand: [Monat Jahr]" },
    ],
  },
  {
    // Hype Agency's terms for bookings, written from what the booking engine does (the cancellation
    // grid of src/buchung/logik/storno.ts, the hold, Mollie, the invoice). Bracketed places are the
    // owner's; the whole text needs a lawyer's eye before launch.
    slug: "agb",
    title: "Allgemeine Geschäftsbedingungen",
    content: [
      {
        kind: "p",
        text: "Stand: [Monat Jahr]. [Bitte vor dem Start von einer Anwältin oder einem Anwalt prüfen lassen.]",
      },
      { kind: "h2", text: "1. Geltungsbereich" },
      {
        kind: "p",
        text: "Diese Bedingungen gelten für alle Buchungen von Besuchen unserer Figuren bei Kindergeburtstagen und anderen Feiern, die Sie bei [Name des Unternehmens, Anschrift] („wir“) über diese Website, telefonisch oder schriftlich vornehmen.",
      },
      { kind: "h2", text: "2. Vertragsschluss" },
      {
        kind: "p",
        text: "Mit dem Klick auf „Zahlungspflichtig buchen“ geben Sie ein verbindliches Angebot ab. Der Vertrag kommt zustande, wenn die Anzahlung bei uns eingeht oder, bei Zahlung auf Rechnung, wenn wir Ihre Buchung per E-Mail bestätigen. Bis dahin halten wir den Termin für Sie: bei Online-Zahlung [30] Minuten, bei Zahlung auf Rechnung bis zu unserer Bestätigung. Eine Anfrage ist noch kein Vertrag; wir antworten darauf mit einem Angebot.",
      },
      { kind: "h2", text: "3. Preise" },
      {
        kind: "p",
        text: "Der Preis setzt sich aus dem Paket, der Anfahrt nach der Zone Ihres Ortes und den gewählten Extras zusammen und wird vor der Buchung vollständig angezeigt. Alle Preise sind Endpreise. [Sie enthalten die gesetzliche Umsatzsteuer. / Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.]",
      },
      { kind: "h2", text: "4. Zahlung" },
      {
        kind: "p",
        text: "Bei der Buchung zahlen Sie eine Anzahlung von [25] % des Preises, online über unseren Zahlungsdienstleister Mollie (unter anderem PayPal, Kreditkarte, Apple Pay, Google Pay, Klarna, SEPA-Lastschrift) oder, für Kitas, Schulen und Unternehmen, auf Rechnung. Den Restbetrag zahlen Sie [nach der Feier auf Rechnung innerhalb von 14 Tagen].",
      },
      { kind: "h2", text: "5. Unsere Leistung" },
      {
        kind: "p",
        text: "Die Figur kommt zum vereinbarten Beginn an die angegebene Adresse und bleibt für die Dauer des gebuchten Pakets. Verspäten wir uns, verlängern wir die Zeit entsprechend oder erstatten den anteiligen Preis. Programm und Ablauf richten wir nach Alter und Zahl der Kinder. Unsere Figuren tragen eigene Namen und eigene Kostüme.",
      },
      { kind: "h2", text: "6. Ihre Mitwirkung" },
      {
        kind: "p",
        text: "Bitte sorgen Sie für eine Ecke oder einen Raum zum Umziehen, für Platz zum Spielen und, wenn möglich, für einen Parkplatz in der Nähe. Die Aufsicht über die Kinder bleibt während des Besuchs bei Ihnen. Kann die Feier aus Gründen, die bei Ihnen liegen, nicht beginnen, wartet die Figur [30] Minuten; danach gilt der Termin als wahrgenommen.",
      },
      { kind: "h2", text: "7. Absage durch Sie" },
      {
        kind: "p",
        text: "Sie können jederzeit absagen, über den Link in Ihrer Bestätigung oder mit einer Nachricht an uns. Es gilt:",
      },
      {
        kind: "ul",
        items: [
          "mehr als 14 Tage vor der Feier: kostenlos, Sie bekommen die Anzahlung zurück;",
          "14 bis 7 Tage vorher: wir behalten die Anzahlung;",
          "weniger als 7 Tage bis 48 Stunden vorher: die Hälfte des Preises;",
          "weniger als 48 Stunden vorher: der volle Preis.",
        ],
      },
      {
        kind: "p",
        text: "Ihnen bleibt der Nachweis, dass uns kein oder ein geringerer Schaden entstanden ist. Statt abzusagen können Sie den Termin verschieben, solange ein anderer frei ist.",
      },
      { kind: "h2", text: "8. Absage durch uns" },
      {
        kind: "p",
        text: "Können wir einen Termin nicht wahrnehmen, etwa weil eine Darstellerin oder ein Darsteller erkrankt, schicken wir nach Möglichkeit eine andere Person mit derselben Figur oder bieten Ihnen eine andere Figur an. Ist beides nicht möglich oder lehnen Sie es ab, bekommen Sie alles Gezahlte zurück.",
      },
      { kind: "h2", text: "9. Haftung" },
      {
        kind: "p",
        text: "Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit. Bei leichter Fahrlässigkeit haften wir nur für die Verletzung wesentlicher Vertragspflichten und begrenzt auf den vorhersehbaren, vertragstypischen Schaden.",
      },
      { kind: "h2", text: "10. Kein Widerrufsrecht" },
      {
        kind: "p",
        text: "Bei Verträgen über Dienstleistungen im Zusammenhang mit Freizeitbetätigungen, die zu einem bestimmten Termin erbracht werden, besteht kein Widerrufsrecht (§ 312g Abs. 2 Nr. 9 BGB). Für Absagen gelten die Bedingungen unter 7.",
      },
      { kind: "h2", text: "11. Fotos" },
      {
        kind: "p",
        text: "Unsere Darstellerinnen und Darsteller fotografieren und filmen bei Ihrer Feier nicht. Wenn Sie selbst fotografieren, achten Sie bitte auf die Rechte der anderen Kinder und ihrer Eltern.",
      },
      { kind: "h2", text: "12. Streitbeilegung" },
      {
        kind: "p",
        text: "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
      },
      { kind: "h2", text: "13. Schlussbestimmungen" },
      {
        kind: "p",
        text: "Es gilt deutsches Recht. Wohnen Sie als Verbraucherin oder Verbraucher in einem anderen Staat, bleibt Ihnen der Schutz durch dessen zwingende Vorschriften erhalten.",
      },
    ],
  },
  {
    slug: "ueber-uns",
    title: "Über uns",
    lead: "Wer hinter dem Unternehmen steht.",
    content: [
      {
        kind: "p",
        text: "Eine Inhaltsseite: Titel, Einleitung und Text, alles unter /admin → Seiten bearbeitet. Seiten darunter erscheinen am Ende als Karten und im Menü.",
      },
      { kind: "h2", text: "Wer wir sind" },
      { kind: "p", text: "Ein paar Sätze über das Unternehmen und die Menschen dahinter." },
    ],
  },
  {
    slug: "arbeitsweise",
    title: "Arbeitsweise",
    parent: "ueber-uns",
    lead: "Wie eine Zusammenarbeit abläuft.",
    content: [
      {
        kind: "p",
        text: "Eine Seite unter „Über uns“: ihre Adresse ist /ueber-uns/arbeitsweise, im Menü steht sie unter ihrer Elternseite.",
      },
    ],
  },
  { slug: "projekte", title: "Projekte", content: [] },
  { slug: "kontakt", title: "Kontakt", content: [] },
];

// The local test mailbox (Mailpit from docker-compose.yml, in CI a service): the seed points
// „E-Mail-Versand“ at it once, only while no mailbox is set up and MAIL_SECRET is there, so a
// mailbox entered in /admin is never replaced. Mails land on http://localhost:8025.
export const SEED_MAILBOX = {
  settings: {
    provider: "andere",
    fromAddress: "website@example.com",
    fromName: seedSettings.siteName,
    host: "localhost",
    port: 1025,
    security: "none",
    notifyAddress: "anfragen@example.com",
  },
  password: "mailpit",
} as const;

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
  fallbackPassword: "e2e-passwort-kern",
};

// An editor next to it, for the role checks (e2e/admin-rollen.spec.ts); same password.
export const E2E_REDAKTEUR = { email: "e2e-redaktion@example.com" };

// An account only for „Passwort vergessen“ (e2e/mail.spec.ts): its password changes in the test.
export const E2E_VERGESSEN = { email: "e2e-vergessen@example.com" };

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
export const SEED_NAV_ORDER = ["ueber-uns", "projekte"];

// Pages whose slug the seed changed: scripts/seed.ts moves an existing page to its new slug and
// publishes it, so its old address redirects (redirectMoves) instead of the page being doubled.
export const SEED_RENAMED: { from: string; to: string }[] = [];

export const SEED_PATHS = [
  "/kontakt",
  "/suche",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/ueber-uns",
  "/ueber-uns/arbeitsweise",
  "/projekte",
  // The booking engine's pages (scripts/seed-buchung-data.ts)
  "/figuren",
  "/figuren?alter=3-5",
  "/figuren/eisprinzessin",
  "/preise",
  "/kindergeburtstag/aschaffenburg",
  "/buchen",
  "/buchen?figur=eisprinzessin&ort=hanau&paket=klassik",
  "/uk",
  "/ru",
];
