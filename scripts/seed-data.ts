// Development content for `pnpm seed`. Fictional on purpose: no real clients, no real legal text.
// e2e tests import SEED_PATHS, so every seeded route is also checked for data sovereignty and a11y.
// `pnpm init:project` rewrites siteName, ownerName and contactEmail below.

type Text = { type: "text"; text: string };
type Block = { kind: "p" | "h2"; text: string };

export const seedSettings = {
  siteName: "Schwarzwald Systems",
  ownerName: "Schwarzwald Systems",
  tagline: "Individuelle Software für den Mittelstand.",
  description:
    "Schwarzwald Systems entwickelt individuelle Software für mittelständische Unternehmen: Web-Anwendungen, mobile Apps und Schnittstellen.",
  contactEmail: "hallo@example.com",
  socialLinks: [] as { label: string; url: string }[],
};

const placeholder = (what: string): Block[] => [
  { kind: "h2", text: "Platzhalter" },
  {
    kind: "p",
    text: `Platzhalter: Den verbindlichen Text für ${what} verfasst der Inhaber der Website. Diese Seite wurde von „pnpm seed“ für die Entwicklung angelegt.`,
  },
];

export type SeedPage = { slug: string; title: string; parent?: string; content: Block[] };

export const seedPages: SeedPage[] = [
  {
    // HOME_SLUG (src/cms/collections/Pages.ts): rendered at `/`.
    slug: "startseite",
    title: "Willkommen",
    content: [
      {
        kind: "p",
        text: "Dieser Text kommt aus der Seite „startseite“ im Redaktionssystem. Ersetzen Sie ihn unter /admin → Seiten.",
      },
      { kind: "h2", text: "Was hier entsteht" },
      {
        kind: "p",
        text: "Beschreiben Sie in zwei, drei Sätzen, was Besucherinnen und Besucher auf dieser Website finden.",
      },
    ],
  },
  { slug: "impressum", title: "Impressum", content: placeholder("das Impressum") },
  { slug: "datenschutz", title: "Datenschutzerklärung", content: placeholder("den Datenschutz") },
  {
    slug: "ueber-uns",
    title: "Über uns",
    content: [{ kind: "p", text: "Beispielseite. Wer steht hinter dem Angebot?" }],
  },
  {
    slug: "team",
    title: "Team",
    parent: "ueber-uns",
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
export const SEED_REDIRECT = { from: "/about", toPage: "ueber-uns", toPath: "/ueber-uns" };

export const SEED_PATHS = ["/kontakt", "/suche", "/impressum", "/datenschutz", "/ueber-uns/team"];

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
