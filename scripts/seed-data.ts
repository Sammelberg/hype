// Development content for `pnpm seed`. Fictional on purpose: no real clients, no real legal text.
// e2e tests import SEED_PATHS, so every seeded route is also checked for data sovereignty and a11y.

type Text = { type: "text"; text: string };
type Block = { kind: "p" | "h2"; text: string };

export const seedSettings = {
  siteName: "Portfolio",
  ownerName: "Max Mustermann",
  tagline: "Gestaltung und Entwicklung von Websites für Kultur, Handwerk und Mittelstand.",
  description:
    "Portfolio von Max Mustermann: ausgewählte Web-Projekte aus Gestaltung und Entwicklung.",
  contactEmail: "hallo@example.com",
};

export type SeedProject = {
  slug: string;
  title: string;
  summary: string;
  year: number;
  role: string;
  client: string;
  tags: string[];
  featured: boolean;
  palette: [string, string];
  content: Block[];
  galleryCount: number;
};

export const seedProjects: SeedProject[] = [
  {
    slug: "stadtmuseum-freiburg",
    title: "Stadtmuseum Freiburg",
    summary:
      "Neue Website für ein städtisches Museum: Ausstellungen, Veranstaltungen und Besuchsinformationen an einem Ort.",
    year: 2026,
    role: "Gestaltung und Entwicklung",
    client: "Stadtmuseum (fiktiv)",
    tags: ["Kultur", "Next.js", "Payload"],
    featured: true,
    palette: ["#1f3a5f", "#c8a96a"],
    content: [
      { kind: "h2", text: "Ausgangslage" },
      {
        kind: "p",
        text: "Die alte Website bestand aus drei getrennten Systemen. Termine wurden doppelt gepflegt, und auf dem Smartphone war der Kalender kaum lesbar.",
      },
      { kind: "h2", text: "Vorgehen" },
      {
        kind: "p",
        text: "Wir haben Inhalte und Termine in einem CMS zusammengeführt. Das Team pflegt jetzt jede Veranstaltung einmal, sie erscheint automatisch in Kalender, Startseite und Ausstellungsseite.",
      },
      { kind: "h2", text: "Ergebnis" },
      {
        kind: "p",
        text: "Die Seiten laden schneller, und die Redaktion braucht für eine neue Ausstellung etwa eine Stunde statt eines Tages.",
      },
    ],
    galleryCount: 2,
  },
  {
    slug: "schreinerei-holzwerk",
    title: "Schreinerei Holzwerk",
    summary:
      "Auftritt für eine Schreinerei mit Referenzgalerie und einfacher Anfrage für Einzelanfertigungen.",
    year: 2025,
    role: "Gestaltung",
    client: "Holzwerk GmbH (fiktiv)",
    tags: ["Handwerk", "Fotografie"],
    featured: true,
    palette: ["#4a3525", "#d9b98c"],
    content: [
      { kind: "h2", text: "Aufgabe" },
      {
        kind: "p",
        text: "Die Schreinerei wollte zeigen, was sie baut, nicht nur was sie anbietet. Die Arbeiten sprechen für sich, also stehen große Fotos im Mittelpunkt.",
      },
      {
        kind: "p",
        text: "Jede Referenz nennt Holzart, Maße und Bauzeit. So wissen Interessierte vor dem ersten Gespräch, womit sie rechnen können.",
      },
    ],
    galleryCount: 4,
  },
  {
    slug: "energiegenossenschaft-kinzigtal",
    title: "Energiegenossenschaft Kinzigtal",
    summary:
      "Informationsportal für Mitglieder: Anlagen, Erträge und Versammlungen verständlich aufbereitet.",
    year: 2025,
    role: "Entwicklung",
    client: "Energiegenossenschaft (fiktiv)",
    tags: ["Verein", "Datenvisualisierung"],
    featured: false,
    palette: ["#2d4a2b", "#e3c95b"],
    content: [
      { kind: "h2", text: "Hintergrund" },
      {
        kind: "p",
        text: "Die Genossenschaft verschickte Ertragsberichte bisher als PDF. Viele Mitglieder haben sie nie geöffnet.",
      },
      {
        kind: "p",
        text: "Die neue Übersicht zeigt jede Anlage mit ihrem Monatsertrag. Die Zahlen kommen aus der bestehenden Buchhaltung und werden einmal täglich übernommen.",
      },
    ],
    galleryCount: 0,
  },
  {
    slug: "weingut-am-kaiserstuhl",
    title: "Weingut am Kaiserstuhl",
    summary:
      "Website mit Weinliste und Terminen für Weinproben, gepflegt vom Familienbetrieb selbst.",
    year: 2024,
    role: "Gestaltung und Entwicklung",
    client: "Weingut (fiktiv)",
    tags: ["Gastronomie", "Payload"],
    featured: false,
    palette: ["#5a1e2e", "#e8d3b0"],
    content: [
      {
        kind: "p",
        text: "Ein kleines Team, wenig Zeit: Die Pflege musste in wenigen Minuten erledigt sein. Neue Jahrgänge werden mit Foto, Rebsorte und Preis angelegt, der Rest ergibt sich von selbst.",
      },
    ],
    galleryCount: 2,
  },
  {
    slug: "architekturbuero-linie",
    title: "Architekturbüro Linie",
    summary: "Ruhige, bildstarke Projektseiten für ein Architekturbüro mit Schwerpunkt Holzbau.",
    year: 2023,
    role: "Entwicklung",
    client: "Linie Architekten (fiktiv)",
    tags: ["Architektur", "Animation"],
    featured: false,
    palette: ["#2b2b2b", "#bfc7c9"],
    content: [
      {
        kind: "p",
        text: "Die Projekte werden als Folge von Plänen und Fotos erzählt. Beim Scrollen blendet der Grundriss in die Aufnahme des fertigen Gebäudes über.",
      },
    ],
    galleryCount: 3,
  },
];

const placeholder = (what: string): Block[] => [
  {
    kind: "p",
    text: `Platzhalter: Den verbindlichen Text für ${what} verfasst der Inhaber der Website. Diese Seite wurde von „pnpm seed“ für die Entwicklung angelegt.`,
  },
];

export type SeedPage = { slug: string; title: string; parent?: string; content: Block[] };

export const seedPages: SeedPage[] = [
  { slug: "impressum", title: "Impressum", content: placeholder("das Impressum") },
  { slug: "datenschutz", title: "Datenschutzerklärung", content: placeholder("den Datenschutz") },
  {
    slug: "ueber-mich",
    title: "Über mich",
    content: [
      {
        kind: "p",
        text: "Ich gestalte und entwickle Websites für Organisationen, die ihre Inhalte selbst pflegen wollen.",
      },
    ],
  },
  {
    slug: "werdegang",
    title: "Werdegang",
    parent: "ueber-mich",
    content: [{ kind: "p", text: "Beispielseite, um verschachtelte Pfade zu testen." }],
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
      text: "Vielen Dank für Ihre Nachricht. Ich melde mich in der Regel innerhalb von zwei Werktagen.",
    },
  ],
  fields: [
    { blockType: "text", name: "name", label: "Name", required: true, width: 50 },
    { blockType: "email", name: "email", label: "E-Mail", required: true, width: 50 },
    { blockType: "textarea", name: "nachricht", label: "Nachricht", required: true },
  ],
};

// An old project URL, to exercise the redirects plugin end to end.
export const SEED_REDIRECT = { from: "/projekte/museum", toProject: "stadtmuseum-freiburg" };

export const SEED_PATHS = [
  "/kontakt",
  ...seedProjects.map((p) => `/projekte/${p.slug}`),
  "/impressum",
  "/datenschutz",
  "/ueber-mich/werdegang",
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
      children: blocks.map((b) =>
        b.kind === "h2"
          ? { type: "heading", tag: "h2", ...common, children: [text(b.text)] }
          : { type: "paragraph", textFormat: 0, ...common, children: [text(b.text)] },
      ),
    },
  };
}
