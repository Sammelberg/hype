// What the public site reads from the booking engine: the catalogue of Figuren, the price list,
// the towns with their Zone, and the next free Saturday per town. Read only; taking a slot is
// belegung.ts.
import { and, asc, eq, inArray } from "drizzle-orm";

import { getFirma } from "../../buero/daten/firma";
import { centAusBetrag } from "../../buero/logik/geld";
import { KLEINUNTERNEHMER_HINWEIS } from "../../buero/logik/xrechnung";
import { mediaByIds } from "../../cms/content/media";
import type { MediaDoc } from "../../cms/content/types";
import { db, type Db, type Tx } from "../../cms/db/client";
import {
  bewertungen,
  darsteller,
  darstellerFiguren,
  einstellungen,
  extras,
  figurFotos,
  figuren,
  pakete,
  staedte,
  zonen,
} from "../db/schema";
import { berechneFenster } from "../logik/fenster";
import { abPreisCent, ENDPREIS_HINWEIS } from "../logik/preis";
import { freieDarsteller, samstageAb, startZeiten } from "../logik/raster";
import { aktiveBelegungen } from "./belegung";

const STUNDE = 3_600_000;

// Which active Darsteller play which active Figur.
async function besetzung(client: Db | Tx) {
  const rows = await client
    .select({ figurId: darstellerFiguren.figurId, darstellerId: darsteller.id })
    .from(darstellerFiguren)
    .innerJoin(darsteller, eq(darsteller.id, darstellerFiguren.darstellerId))
    .where(eq(darsteller.aktiv, true));
  const proFigur = new Map<number, number[]>();
  for (const r of rows)
    proFigur.set(r.figurId, [...(proFigur.get(r.figurId) ?? []), r.darstellerId]);
  return proFigur;
}

async function fotosVon(figurIds: number[], client: Db | Tx) {
  if (figurIds.length === 0) return new Map<number, MediaDoc[]>();
  const rows = await client
    .select()
    .from(figurFotos)
    .where(inArray(figurFotos.figurId, figurIds))
    .orderBy(asc(figurFotos.sort));
  const docs = await mediaByIds(
    rows.map((r) => r.mediaId),
    client,
  );
  const proFigur = new Map<number, MediaDoc[]>();
  for (const r of rows) {
    const doc = docs.get(r.mediaId);
    if (doc) proFigur.set(r.figurId, [...(proFigur.get(r.figurId) ?? []), doc]);
  }
  return proFigur;
}

export type KatalogFigur = {
  id: number;
  slug: string;
  name: string;
  kategorie: (typeof figuren.$inferSelect)["kategorie"];
  alterVon: number;
  alterBis: number;
  sprachen: (typeof figuren.$inferSelect)["sprachen"];
  kurz: string | null;
  foto: MediaDoc | null;
  /** At least one active Darsteller plays it. */
  buchbar: boolean;
};

/** The active Figuren, in their order, with their card picture. */
export async function katalogFiguren(client: Db | Tx = db): Promise<KatalogFigur[]> {
  const rows = await client
    .select()
    .from(figuren)
    .where(eq(figuren.aktiv, true))
    .orderBy(asc(figuren.sort), asc(figuren.name));
  const [proFigur, fotos] = [
    await besetzung(client),
    await fotosVon(
      rows.map((r) => r.id),
      client,
    ),
  ];
  return rows.map((f) => ({
    id: f.id,
    slug: f.slug,
    name: f.name,
    kategorie: f.kategorie,
    alterVon: f.alterVon,
    alterBis: f.alterBis,
    sprachen: f.sprachen,
    kurz: f.kurz,
    foto: fotos.get(f.id)?.[0] ?? null,
    buchbar: (proFigur.get(f.id)?.length ?? 0) > 0,
  }));
}

export async function figurNachSlug(slug: string, client: Db | Tx = db) {
  const [f] = await client
    .select()
    .from(figuren)
    .where(and(eq(figuren.slug, slug), eq(figuren.aktiv, true)));
  if (!f) return null;
  const [proFigur, fotos] = [await besetzung(client), await fotosVon([f.id], client)];
  return {
    ...f,
    fotos: fotos.get(f.id) ?? [],
    darsteller: proFigur.get(f.id) ?? [],
    buchbar: (proFigur.get(f.id)?.length ?? 0) > 0,
  };
}

/** Packages, extras and zones as the price list shows them, prices in cents. */
export async function preisListe(client: Db | Tx = db) {
  const paketRows = await client
    .select()
    .from(pakete)
    .where(eq(pakete.aktiv, true))
    .orderBy(asc(pakete.sort));
  const extraRows = await client
    .select()
    .from(extras)
    .where(eq(extras.aktiv, true))
    .orderBy(asc(extras.sort));
  const zonenRows = await client.select().from(zonen).orderBy(asc(zonen.sort), asc(zonen.code));
  const { firma } = await getFirma(client);
  const paketListe = paketRows.map((p) => ({
    ...p,
    preisCent: p.preis === null ? null : centAusBetrag(p.preis),
  }));
  return {
    pakete: paketListe,
    extras: extraRows.map((x) => ({
      ...x,
      preisCent: x.preis === null ? null : centAusBetrag(x.preis),
    })),
    zonen: zonenRows.map((z) => ({ ...z, aufschlagCent: centAusBetrag(z.aufschlag) })),
    abCent: abPreisCent(paketListe),
    // §19 UStG or end prices with VAT, as the invoices say (Firmendaten).
    hinweis: firma.kleinunternehmer ? KLEINUNTERNEHMER_HINWEIS : ENDPREIS_HINWEIS,
  };
}

export type OeffentlicheStadt = {
  id: number;
  name: string;
  slug: string;
  seite: boolean;
  zone: {
    code: string;
    name: string;
    aufschlagCent: number;
    fahrtMinuten: number;
    nurAnfrage: boolean;
  };
};

export async function oeffentlicheStaedte(client: Db | Tx = db): Promise<OeffentlicheStadt[]> {
  const rows = await client
    .select({ stadt: staedte, zone: zonen })
    .from(staedte)
    .innerJoin(zonen, eq(zonen.code, staedte.zoneCode))
    .orderBy(asc(zonen.sort), asc(staedte.sort), asc(staedte.name));
  return rows.map(({ stadt, zone }) => ({
    id: stadt.id,
    name: stadt.name,
    slug: stadt.slug,
    seite: stadt.seite,
    zone: {
      code: zone.code,
      name: zone.name,
      aufschlagCent: centAusBetrag(zone.aufschlag),
      fahrtMinuten: zone.fahrtMinuten,
      nurAnfrage: zone.nurAnfrage,
    },
  }));
}

/** A town with a landing page of its own, with its published reviews. */
export async function stadtSeite(slug: string, client: Db | Tx = db) {
  const [row] = await client
    .select({ stadt: staedte, zone: zonen })
    .from(staedte)
    .innerJoin(zonen, eq(zonen.code, staedte.zoneCode))
    .where(and(eq(staedte.slug, slug), eq(staedte.seite, true)));
  if (!row) return null;
  const stimmen = await client
    .select()
    .from(bewertungen)
    .where(and(eq(bewertungen.stadtId, row.stadt.id), eq(bewertungen.veroeffentlicht, true)))
    .orderBy(asc(bewertungen.sort));
  return {
    ...row.stadt,
    zone: { ...row.zone, aufschlagCent: centAusBetrag(row.zone.aufschlag) },
    bewertungen: stimmen,
  };
}

/**
 * The first free start on the coming Saturdays, per town: with the shortest bookable package and
 * the town's travel time, someone (who plays one of `figurIds`, or any Figur) must be free for the
 * whole Fenster. Towns that only take requests get null.
 */
export async function naechsteFreieSamstage(
  o: { jetzt: Date; figurIds?: number[]; wochen?: number },
  client: Db | Tx = db,
): Promise<Map<number, Date | null>> {
  const [regeln] = await client.select().from(einstellungen).where(eq(einstellungen.id, 1));
  const kuerzestes = (
    await client
      .select()
      .from(pakete)
      .where(and(eq(pakete.aktiv, true), eq(pakete.nurAnfrage, false)))
  )
    .filter((p) => p.dauerMin)
    .sort((a, b) => a.dauerMin! - b.dauerMin!)[0];
  const orte = await oeffentlicheStaedte(client);
  const ergebnis = new Map<number, Date | null>(orte.map((s) => [s.id, null]));
  if (!regeln || !kuerzestes) return ergebnis;

  const proFigur = await besetzung(client);
  const ids = [
    ...new Set((o.figurIds ?? [...proFigur.keys()]).flatMap((f) => proFigur.get(f) ?? [])),
  ];
  if (ids.length === 0) return ergebnis;

  const tage = samstageAb(o.jetzt, o.wochen ?? 8);
  const fruehestens = o.jetzt.getTime() + regeln.mindestVorlaufStd * STUNDE;
  const starts = tage
    .flatMap((t) => startZeiten(t, regeln))
    .filter((d) => d.getTime() >= fruehestens);
  if (starts.length === 0) return ergebnis;
  const belegt = await aktiveBelegungen(
    ids,
    new Date(starts[0]!.getTime() - 6 * STUNDE),
    new Date(starts.at(-1)!.getTime() + 12 * STUNDE),
    o.jetzt,
    client,
  );

  for (const ort of orte) {
    if (ort.zone.nurAnfrage) continue;
    const frei = starts.find(
      (beginn) =>
        freieDarsteller(
          ids,
          belegt,
          berechneFenster({
            beginn,
            fahrtMinuten: ort.zone.fahrtMinuten,
            vorbereitungMin: regeln.vorbereitungMin,
            dauerMin: kuerzestes.dauerMin!,
            extrasDeltaMin: 0,
            abbauMin: regeln.abbauMin,
          }),
        ).length > 0,
    );
    ergebnis.set(ort.id, frei ?? null);
  }
  return ergebnis;
}
