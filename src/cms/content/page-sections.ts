// The sections a page with its own route starts with, and what the site shows while a page has
// none yet. Pure: the admin (client) and the seed use it too.
import type { HomeSections, KontaktSections, PageSections, ProjekteSections } from "./types";

type Kind = PageSections["kind"];
export type SectionsOf<K extends Kind> = Extract<PageSections, { kind: K }>;

export const HOME_DEFAULTS: HomeSections = {
  kind: "home",
  hero: {
    headline: "Willkommen",
    lead: null,
  },
  stepsTitle: "So arbeiten wir",
  steps: [],
  principlesTitle: "Unsere Grundsätze",
  principles: [],
  faqTitle: "Häufige Fragen",
  faq: [],
};

export const PROJEKTE_DEFAULTS: ProjekteSections = {
  kind: "projekte",
  empty: "Hier stellen wir bald unsere ersten Projekte vor.",
};

export const KONTAKT_DEFAULTS: KontaktSections = {
  kind: "kontakt",
  nextTitle: "Was danach passiert",
  nextText: null,
};

const DEFAULTS: { [K in Kind]: SectionsOf<K> } = {
  home: HOME_DEFAULTS,
  projekte: PROJEKTE_DEFAULTS,
  kontakt: KONTAKT_DEFAULTS,
};

export const defaultSections = <K extends Kind>(kind: K): SectionsOf<K> =>
  structuredClone(DEFAULTS[kind]);

// A page's sections if they are of the expected kind, over the defaults (a section added after
// the page was saved shows its default until the page is edited), else the defaults.
export function sectionsOf<K extends Kind>(
  sections: PageSections | null | undefined,
  kind: K,
): SectionsOf<K> {
  return sections?.kind === kind
    ? { ...defaultSections(kind), ...(sections as SectionsOf<K>) }
    : defaultSections(kind);
}

// The leads the routed pages start with (the page's own `lead` field).
export const ROUTED_LEADS = {
  projekte: "Ausgewählte Projekte, die wir für unsere Kundinnen und Kunden umgesetzt haben.",
  kontakt: "Schreiben Sie uns, was Sie vorhaben. Wir melden uns so bald wie möglich.",
} as const;
