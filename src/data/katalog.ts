import "server-only";

import { cache } from "react";

import {
  figurNachSlug,
  katalogFiguren,
  naechsteFreieSamstage,
  oeffentlicheStaedte,
  preisListe,
  stadtSeite,
} from "@/buchung/daten/katalog";
import { getFirma } from "@/buero/daten/firma";

// The site's reads from the booking engine, cached per request like src/data/queries.ts. Not
// draft-aware: Figuren, prices and towns have no drafts; the admin's changes show on the next
// revalidation (the pages that read them revalidate every five minutes).

export const getKatalog = cache(() => katalogFiguren());
export const getFigur = cache((slug: string) => figurNachSlug(slug));
export const getPreise = cache(() => preisListe());
export const getStaedte = cache(() => oeffentlicheStaedte());
export const getStadtSeite = cache((slug: string) => stadtSeite(slug));
// One read per render: the clock is taken here, not in a component (React Compiler).
export const getFreieSamstage = cache((figurId?: number) =>
  naechsteFreieSamstage({ jetzt: new Date(), ...(figurId ? { figurIds: [figurId] } : {}) }),
);
// The owner's details from /admin/firma, for the structured data of the home page.
export const getFirmenDaten = cache(async () => (await getFirma()).firma);
