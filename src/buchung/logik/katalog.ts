// The catalogue's filters: category, the children's age, the host's language. Read from the
// address (?kategorie=…&alter=…&sprache=…), so a filtered list is a link. Pure, client-safe.
import { FIGUR_KATEGORIEN, SPRACHEN, type FigurKategorie, type Sprache } from "./typen";

export const ALTERSGRUPPEN = {
  "3-5": { von: 3, bis: 5, name: "3 bis 5 Jahre" },
  "5-8": { von: 5, bis: 8, name: "5 bis 8 Jahre" },
  "8-12": { von: 8, bis: 12, name: "8 bis 12 Jahre" },
} as const;
export type Altersgruppe = keyof typeof ALTERSGRUPPEN;

export type KatalogFilter = { kategorie?: FigurKategorie; alter?: Altersgruppe; sprache?: Sprache };

const einer = (wert: string | string[] | undefined) =>
  typeof wert === "string" ? wert : undefined;

export function filterAusParams(
  params: Record<string, string | string[] | undefined>,
): KatalogFilter {
  const filter: KatalogFilter = {};
  const kategorie = einer(params.kategorie);
  const alter = einer(params.alter);
  const sprache = einer(params.sprache);
  if (kategorie && (FIGUR_KATEGORIEN as readonly string[]).includes(kategorie))
    filter.kategorie = kategorie as FigurKategorie;
  if (alter && alter in ALTERSGRUPPEN) filter.alter = alter as Altersgruppe;
  if (sprache && (SPRACHEN as readonly string[]).includes(sprache))
    filter.sprache = sprache as Sprache;
  return filter;
}

export function filtereFiguren<
  F extends { kategorie: FigurKategorie; alterVon: number; alterBis: number; sprachen: Sprache[] },
>(figuren: F[], filter: KatalogFilter): F[] {
  return figuren.filter((f) => {
    if (filter.kategorie && f.kategorie !== filter.kategorie) return false;
    if (filter.sprache && !f.sprachen.includes(filter.sprache)) return false;
    if (filter.alter) {
      const g = ALTERSGRUPPEN[filter.alter];
      if (f.alterBis < g.von || f.alterVon > g.bis) return false;
    }
    return true;
  });
}

/** The catalogue's address with one filter set or cleared, the others kept. */
export function filterLink(filter: KatalogFilter, aenderung: KatalogFilter): string {
  const neu = { ...filter, ...aenderung };
  const params = new URLSearchParams();
  for (const key of ["kategorie", "alter", "sprache"] as const) {
    const wert = neu[key];
    if (wert) params.set(key, wert);
  }
  const query = params.toString();
  return query ? `/figuren?${query}` : "/figuren";
}
