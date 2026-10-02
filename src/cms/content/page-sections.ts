// The sections a page with its own route starts with, and what the site shows while a page has
// none yet. Pure: the admin (client) and the seed use it too.
import type {
  HomeSections,
  KontaktSections,
  LeistungenSections,
  LeistungSections,
  PageSections,
  ProjekteSections,
} from "./types";

type Kind = PageSections["kind"];
export type SectionsOf<K extends Kind> = Extract<PageSections, { kind: K }>;

export const HOME_DEFAULTS: HomeSections = {
  kind: "home",
  hero: {
    headline: "Wir entwickeln",
    words: [],
    headlineEnd: "für den Mittelstand.",
    lead: "Individuelle Software aus dem Schwarzwald.",
  },
  servicesTitle: "Was wir entwickeln",
  techTitle: "Womit wir bauen",
  eRechnungTitle: "Die E-Rechnung kommt für jedes Unternehmen",
  eRechnungLead: null,
  milestones: [],
  stepsTitle: "So arbeiten wir",
  steps: [],
  previewsTitle: "Mehr über uns",
  principlesTitle: "Unsere Grundsätze",
  principles: [],
};

export const LEISTUNGEN_DEFAULTS: LeistungenSections = {
  kind: "leistungen",
  services: [],
  faq: [],
};

export const LEISTUNG_DEFAULTS: LeistungSections = {
  kind: "leistung",
  fitTitle: "Wann das passt",
  fit: [],
  scopeTitle: "Was Sie bekommen",
  scope: [],
  stepsTitle: "So gehen wir vor",
  steps: [],
  faqTitle: "Häufige Fragen",
  faq: [],
  projektId: null,
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
  leistungen: LEISTUNGEN_DEFAULTS,
  leistung: LEISTUNG_DEFAULTS,
  projekte: PROJEKTE_DEFAULTS,
  kontakt: KONTAKT_DEFAULTS,
};

export const defaultSections = <K extends Kind>(kind: K): SectionsOf<K> =>
  structuredClone(DEFAULTS[kind]);

// A page's sections if they are of the expected kind, else the defaults.
export function sectionsOf<K extends Kind>(
  sections: PageSections | null | undefined,
  kind: K,
): SectionsOf<K> {
  return sections?.kind === kind ? (sections as SectionsOf<K>) : defaultSections(kind);
}

// The leads the routed pages start with (the page's own `lead` field).
export const ROUTED_LEADS = {
  leistungen:
    "Von der einzelnen Schnittstelle bis zur kompletten Plattform – geplant für Ihre Abläufe, nicht für einen Standardfall.",
  projekte: "Ausgewählte Projekte, die wir für unsere Kundinnen und Kunden gebaut haben.",
  kontakt:
    "Erzählen Sie uns von Ihrem Vorhaben. Wir melden uns mit einer ersten Einschätzung und einem Vorschlag für das weitere Vorgehen.",
} as const;
