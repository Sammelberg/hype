// The master data the owner keeps in the admin: Figuren with their photos, Darsteller and what
// they play, Pakete, Extras, Zonen, Städte and the engine's settings. Database refusals (a taken
// address, a record still in use) come back as German messages.
import { asc, eq, inArray, sql } from "drizzle-orm";

import { db, type Db, type Tx } from "../../cms/db/client";
import {
  buchungen,
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
import {
  DarstellerSchema,
  EinstellungenSchema,
  ExtraSchema,
  FigurSchema,
  minutenAusUhrzeit,
  PaketSchema,
  StadtSchema,
  uhrzeitAusMinuten,
  ZoneSchema,
  type Darsteller,
  type Einstellungen,
  type Extra,
  type Figur,
  type Paket,
  type Stadt,
  type Zone,
} from "../logik/schemas";
import { BuchungFehler } from "./basis";

const pgCode = (error: unknown) => {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.cause?.code ?? e?.code;
};

// Runs a write; a taken slug or a record still referenced becomes a message the form can show.
async function mitMeldungen<T>(schreiben: () => Promise<T>, inGebrauch: string): Promise<T> {
  try {
    return await schreiben();
  } catch (error) {
    if (pgCode(error) === "23505")
      throw new BuchungFehler("Diese Adresse ist schon vergeben.", "slug");
    if (pgCode(error) === "23503") throw new BuchungFehler(inGebrauch);
    throw error;
  }
}

const euroText = (n: number | null) => (n === null ? null : n.toFixed(2));
const euroZahl = (s: string | null) => (s === null ? null : Number(s));

// ---------------------------------------------------------------------------------------------
// Figuren

export async function listFiguren(client: Db | Tx = db) {
  return client
    .select({
      id: figuren.id,
      slug: figuren.slug,
      name: figuren.name,
      kategorie: figuren.kategorie,
      aktiv: figuren.aktiv,
      fotos: sql<number>`(select count(*)::int from ${figurFotos} where ${figurFotos.figurId} = ${figuren.id})`,
      darsteller: sql<number>`(select count(*)::int from ${darstellerFiguren} where ${darstellerFiguren.figurId} = ${figuren.id})`,
    })
    .from(figuren)
    .orderBy(asc(figuren.sort), asc(figuren.name));
}

export async function getFigur(id: number, client: Db | Tx = db): Promise<Figur | null> {
  const [f] = await client.select().from(figuren).where(eq(figuren.id, id));
  if (!f) return null;
  const fotos = await client
    .select({ mediaId: figurFotos.mediaId })
    .from(figurFotos)
    .where(eq(figurFotos.figurId, id))
    .orderBy(asc(figurFotos.sort));
  return {
    slug: f.slug,
    name: f.name,
    kategorie: f.kategorie,
    alterVon: f.alterVon,
    alterBis: f.alterBis,
    sprachen: f.sprachen,
    kurz: f.kurz,
    beschreibung: f.beschreibung,
    programm: f.programm,
    aktiv: f.aktiv,
    sort: f.sort,
    fotos: fotos.map((x) => x.mediaId),
    metaTitle: f.metaTitle,
    metaDescription: f.metaDescription,
  };
}

export async function speichereFigur(id: number | null, raw: unknown, client: Db | Tx = db) {
  const { fotos, ...daten } = FigurSchema.parse(raw);
  return mitMeldungen(
    () =>
      client.transaction(async (tx) => {
        const werte = { ...daten, updatedAt: new Date() };
        const [row] = id
          ? await tx
              .update(figuren)
              .set(werte)
              .where(eq(figuren.id, id))
              .returning({ id: figuren.id })
          : await tx.insert(figuren).values(werte).returning({ id: figuren.id });
        if (!row) throw new BuchungFehler("Diese Figur gibt es nicht mehr.");
        await tx.delete(figurFotos).where(eq(figurFotos.figurId, row.id));
        const einzeln = [...new Set(fotos)];
        if (einzeln.length > 0) {
          await tx
            .insert(figurFotos)
            .values(einzeln.map((mediaId, sort) => ({ figurId: row.id, mediaId, sort })));
        }
        return row;
      }),
    "Ein gewähltes Foto gibt es nicht mehr.",
  );
}

export async function loescheFigur(id: number, client: Db | Tx = db) {
  await mitMeldungen(
    () => client.delete(figuren).where(eq(figuren.id, id)),
    "Diese Figur hat Buchungen. Bitte deaktivieren Sie sie, statt sie zu löschen.",
  );
}

// ---------------------------------------------------------------------------------------------
// Darsteller

export async function listDarsteller(client: Db | Tx = db) {
  const rows = await client
    .select()
    .from(darsteller)
    .orderBy(asc(darsteller.prioritaet), asc(darsteller.name));
  const zuordnung = rows.length
    ? await client
        .select({ darstellerId: darstellerFiguren.darstellerId, name: figuren.name })
        .from(darstellerFiguren)
        .innerJoin(figuren, eq(figuren.id, darstellerFiguren.figurId))
        .where(
          inArray(
            darstellerFiguren.darstellerId,
            rows.map((r) => r.id),
          ),
        )
        .orderBy(asc(figuren.name))
    : [];
  return rows.map((r) => ({
    ...r,
    figuren: zuordnung.filter((z) => z.darstellerId === r.id).map((z) => z.name),
  }));
}

export async function getDarsteller(id: number, client: Db | Tx = db): Promise<Darsteller | null> {
  const [d] = await client.select().from(darsteller).where(eq(darsteller.id, id));
  if (!d) return null;
  const rollen = await client
    .select({ figurId: darstellerFiguren.figurId })
    .from(darstellerFiguren)
    .where(eq(darstellerFiguren.darstellerId, id));
  return {
    name: d.name,
    email: d.email,
    telefon: d.telefon,
    aktiv: d.aktiv,
    prioritaet: d.prioritaet,
    notiz: d.notiz,
    figuren: rollen.map((r) => r.figurId),
  };
}

export async function speichereDarsteller(id: number | null, raw: unknown, client: Db | Tx = db) {
  const { figuren: rollen, ...daten } = DarstellerSchema.parse(raw);
  return mitMeldungen(
    () =>
      client.transaction(async (tx) => {
        const werte = { ...daten, updatedAt: new Date() };
        const [row] = id
          ? await tx
              .update(darsteller)
              .set(werte)
              .where(eq(darsteller.id, id))
              .returning({ id: darsteller.id })
          : await tx.insert(darsteller).values(werte).returning({ id: darsteller.id });
        if (!row) throw new BuchungFehler("Diesen Darsteller gibt es nicht mehr.");
        await tx.delete(darstellerFiguren).where(eq(darstellerFiguren.darstellerId, row.id));
        const einzeln = [...new Set(rollen)];
        if (einzeln.length > 0) {
          await tx
            .insert(darstellerFiguren)
            .values(einzeln.map((figurId) => ({ darstellerId: row.id, figurId })));
        }
        return row;
      }),
    "Eine gewählte Figur gibt es nicht mehr.",
  );
}

export async function loescheDarsteller(id: number, client: Db | Tx = db) {
  await mitMeldungen(
    () => client.delete(darsteller).where(eq(darsteller.id, id)),
    "Dieser Darsteller hat Einsätze oder Sperren. Bitte deaktivieren statt löschen.",
  );
}

// ---------------------------------------------------------------------------------------------
// Pakete and Extras

export const listPakete = (client: Db | Tx = db) =>
  client.select().from(pakete).orderBy(asc(pakete.sort), asc(pakete.name));

export async function getPaket(id: number, client: Db | Tx = db): Promise<Paket | null> {
  const [p] = await client.select().from(pakete).where(eq(pakete.id, id));
  if (!p) return null;
  return {
    slug: p.slug,
    name: p.name,
    beschreibung: p.beschreibung,
    leistungen: p.leistungen,
    dauerMin: p.dauerMin,
    preis: euroZahl(p.preis),
    figurenAnzahl: p.figurenAnzahl,
    nurAnfrage: p.nurAnfrage,
    aktiv: p.aktiv,
    sort: p.sort,
  };
}

export async function speicherePaket(id: number | null, raw: unknown, client: Db | Tx = db) {
  const p = PaketSchema.parse(raw);
  const werte = { ...p, preis: euroText(p.preis), updatedAt: new Date() };
  return mitMeldungen(async () => {
    const [row] = id
      ? await client.update(pakete).set(werte).where(eq(pakete.id, id)).returning({ id: pakete.id })
      : await client.insert(pakete).values(werte).returning({ id: pakete.id });
    if (!row) throw new BuchungFehler("Dieses Paket gibt es nicht mehr.");
    return row;
  }, "Ein verknüpfter Eintrag fehlt.");
}

export async function loeschePaket(id: number, client: Db | Tx = db) {
  await mitMeldungen(
    () => client.delete(pakete).where(eq(pakete.id, id)),
    "Dieses Paket wurde schon gebucht. Bitte deaktivieren statt löschen.",
  );
}

export const listExtras = (client: Db | Tx = db) =>
  client.select().from(extras).orderBy(asc(extras.sort), asc(extras.name));

export async function getExtra(id: number, client: Db | Tx = db): Promise<Extra | null> {
  const [x] = await client.select().from(extras).where(eq(extras.id, id));
  if (!x) return null;
  return {
    slug: x.slug,
    name: x.name,
    beschreibung: x.beschreibung,
    preis: euroZahl(x.preis),
    dauerDeltaMin: x.dauerDeltaMin,
    vorlaufTage: x.vorlaufTage,
    zusatzFigur: x.zusatzFigur,
    nurAnfrage: x.nurAnfrage,
    aktiv: x.aktiv,
    sort: x.sort,
  };
}

export async function speichereExtra(id: number | null, raw: unknown, client: Db | Tx = db) {
  const x = ExtraSchema.parse(raw);
  const werte = { ...x, preis: euroText(x.preis), updatedAt: new Date() };
  return mitMeldungen(async () => {
    const [row] = id
      ? await client.update(extras).set(werte).where(eq(extras.id, id)).returning({ id: extras.id })
      : await client.insert(extras).values(werte).returning({ id: extras.id });
    if (!row) throw new BuchungFehler("Dieses Extra gibt es nicht mehr.");
    return row;
  }, "Ein verknüpfter Eintrag fehlt.");
}

export async function loescheExtra(id: number, client: Db | Tx = db) {
  await mitMeldungen(
    () => client.delete(extras).where(eq(extras.id, id)),
    "Dieses Extra wurde schon gebucht. Bitte deaktivieren statt löschen.",
  );
}

// ---------------------------------------------------------------------------------------------
// Zonen and Städte

export const listZonen = (client: Db | Tx = db) =>
  client.select().from(zonen).orderBy(asc(zonen.sort), asc(zonen.code));

export async function getZone(code: string, client: Db | Tx = db): Promise<Zone | null> {
  const [z] = await client.select().from(zonen).where(eq(zonen.code, code));
  return z ? { ...z, aufschlag: Number(z.aufschlag) } : null;
}

/** A zone's code is its key: fixed once created (cities and bookings point at it). */
export async function speichereZone(alterCode: string | null, raw: unknown, client: Db | Tx = db) {
  const z = ZoneSchema.parse(raw);
  if (alterCode && z.code !== alterCode)
    throw new BuchungFehler("Das Kürzel einer Zone bleibt, wie es angelegt wurde.", "code");
  const werte = { ...z, aufschlag: z.aufschlag.toFixed(2) };
  return mitMeldungen(async () => {
    if (alterCode) {
      const [row] = await client
        .update(zonen)
        .set(werte)
        .where(eq(zonen.code, alterCode))
        .returning({ code: zonen.code });
      if (!row) throw new BuchungFehler("Diese Zone gibt es nicht mehr.");
      return row;
    }
    const [row] = await client.insert(zonen).values(werte).returning({ code: zonen.code });
    return row!;
  }, "Ein verknüpfter Eintrag fehlt.");
}

export async function loescheZone(code: string, client: Db | Tx = db) {
  await mitMeldungen(
    () => client.delete(zonen).where(eq(zonen.code, code)),
    "Dieser Zone sind noch Orte oder Buchungen zugeordnet.",
  );
}

export const listStaedte = (client: Db | Tx = db) =>
  client
    .select({
      id: staedte.id,
      name: staedte.name,
      slug: staedte.slug,
      zoneCode: staedte.zoneCode,
      seite: staedte.seite,
      buchungen: sql<number>`(select count(*)::int from ${buchungen} where ${buchungen.stadtId} = ${staedte.id})`,
    })
    .from(staedte)
    .orderBy(asc(staedte.sort), asc(staedte.name));

export async function getStadt(id: number, client: Db | Tx = db): Promise<Stadt | null> {
  const [s] = await client.select().from(staedte).where(eq(staedte.id, id));
  if (!s) return null;
  return {
    name: s.name,
    slug: s.slug,
    zoneCode: s.zoneCode,
    seite: s.seite,
    intro: s.intro,
    bezirke: s.bezirke,
    orte: s.orte,
    bedingungen: s.bedingungen,
    metaTitle: s.metaTitle,
    metaDescription: s.metaDescription,
    sort: s.sort,
  };
}

export async function speichereStadt(id: number | null, raw: unknown, client: Db | Tx = db) {
  const werte = { ...StadtSchema.parse(raw), updatedAt: new Date() };
  return mitMeldungen(async () => {
    const [row] = id
      ? await client
          .update(staedte)
          .set(werte)
          .where(eq(staedte.id, id))
          .returning({ id: staedte.id })
      : await client.insert(staedte).values(werte).returning({ id: staedte.id });
    if (!row) throw new BuchungFehler("Diesen Ort gibt es nicht mehr.");
    return row;
  }, "Diese Zone gibt es nicht.");
}

export async function loescheStadt(id: number, client: Db | Tx = db) {
  await client.delete(staedte).where(eq(staedte.id, id));
}

// ---------------------------------------------------------------------------------------------
// Einstellungen

export async function getEinstellungen(client: Db | Tx = db): Promise<Einstellungen> {
  const [e] = await client.select().from(einstellungen).where(eq(einstellungen.id, 1));
  if (!e) throw new BuchungFehler("Die Buchungseinstellungen fehlen.");
  return {
    vorbereitungMin: e.vorbereitungMin,
    abbauMin: e.abbauMin,
    rasterMin: e.rasterMin,
    ersterStart: uhrzeitAusMinuten(e.ersterStartMin),
    letzterStart: uhrzeitAusMinuten(e.letzterStartMin),
    anzahlungProzent: e.anzahlungProzent,
    haltenMin: e.haltenMin,
    haltenLastschriftMin: e.haltenLastschriftMin,
    mindestVorlaufStd: e.mindestVorlaufStd,
  };
}

export async function speichereEinstellungen(raw: unknown, client: Db | Tx = db) {
  const { ersterStart, letzterStart, ...rest } = EinstellungenSchema.parse(raw);
  await client
    .update(einstellungen)
    .set({
      ...rest,
      ersterStartMin: minutenAusUhrzeit(ersterStart),
      letzterStartMin: minutenAusUhrzeit(letzterStart),
      updatedAt: new Date(),
    })
    .where(eq(einstellungen.id, 1));
}
