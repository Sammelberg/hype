// The website's side of a Buchung: what the booking form is built from, the starts it may offer,
// the Anfrage it sends when a booking cannot confirm itself, and the customer's view of their
// Buchung behind its link (with cancelling where the grid allows it without the owner). Taking
// the slot itself is halteSlot (belegung.ts).
import { createHash, randomBytes } from "node:crypto";

import { and, asc, eq, inArray } from "drizzle-orm";

import { getFirma } from "../../buero/daten/firma";
import { naechsteNummer } from "../../buero/daten/basis";
import { tagePlus } from "../../buero/logik/ablauf";
import { betragAusCent, centAusBetrag } from "../../buero/logik/geld";
import { berlinTag, berlinUhrzeit } from "../../buero/logik/kalender";
import type { Actor } from "../../cms/audit/types";
import { db, type Db, type Tx } from "../../cms/db/client";
import {
  buchungExtras,
  buchungen,
  einstellungen,
  extras,
  figuren,
  pakete,
  staedte,
  zonen,
} from "../db/schema";
import type { BuchungsDaten } from "../logik/buchen";
import { berechneFenster } from "../logik/fenster";
import { freieStartsJeTag } from "../logik/raster";
import { nurAnfrage, type AnfrageGrund } from "../logik/regeln";
import { stornoGebuehr } from "../logik/storno";
import type { PreisPosition, Sprache, ZahlungAdapterName } from "../logik/typen";
import { BuchungFehler } from "./basis";
import { aktiveBelegungen, kandidatenFuer } from "./belegung";
import { setzeStatus } from "./buchungen";
import { katalogFiguren, preisListe } from "./katalog";

const STUNDE = 3_600_000;
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Who acts when a customer uses their link: no account, the link itself. */
export const KUNDE: Actor = { id: null, email: "Kunde (Buchungslink)" };

export async function buchungsDaten(
  zahlungOnline: boolean,
  client: Db | Tx = db,
): Promise<BuchungsDaten> {
  const katalog = await katalogFiguren(client);
  const preise = await preisListe(client);
  const orte = await client
    .select({ stadt: staedte, zone: zonen })
    .from(staedte)
    .innerJoin(zonen, eq(zonen.code, staedte.zoneCode))
    .orderBy(asc(staedte.name));
  const [regeln] = await client.select().from(einstellungen).where(eq(einstellungen.id, 1));
  const { firma } = await getFirma(client);
  return {
    figuren: katalog.map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      kurz: f.kurz,
      sprachen: f.sprachen,
      alterVon: f.alterVon,
      alterBis: f.alterBis,
      buchbar: f.buchbar,
      foto: f.foto
        ? { url: f.foto.url, alt: f.foto.alt, focalX: f.foto.focalX, focalY: f.foto.focalY }
        : null,
    })),
    pakete: preise.pakete.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      beschreibung: p.beschreibung,
      dauerMin: p.dauerMin,
      preisCent: p.preisCent,
      figurenAnzahl: p.figurenAnzahl,
      nurAnfrage: p.nurAnfrage,
    })),
    extras: preise.extras.map((x) => ({
      id: x.id,
      name: x.name,
      beschreibung: x.beschreibung,
      preisCent: x.preisCent,
      dauerDeltaMin: x.dauerDeltaMin,
      vorlaufTage: x.vorlaufTage,
      zusatzFigur: x.zusatzFigur,
      nurAnfrage: x.nurAnfrage,
    })),
    staedte: orte.map(({ stadt, zone }) => ({
      id: stadt.id,
      slug: stadt.slug,
      name: stadt.name,
      zone: {
        code: zone.code,
        name: zone.name,
        aufschlagCent: centAusBetrag(zone.aufschlag),
        nurAnfrage: zone.nurAnfrage,
      },
    })),
    regeln: {
      anzahlungProzent: regeln?.anzahlungProzent ?? 25,
      kleinunternehmer: firma.kleinunternehmer,
      mindestVorlaufStd: regeln?.mindestVorlaufStd ?? 48,
      ersterStartMin: regeln?.ersterStartMin ?? 600,
      letzterStartMin: regeln?.letzterStartMin ?? 1080,
      rasterMin: regeln?.rasterMin ?? 30,
    },
    zahlungOnline,
  };
}

export type StartAnfrage = {
  figurIds: number[];
  paketId: number;
  extraIds: number[];
  stadtId: number;
  /** The first German day and how many days from there. */
  ab: string;
  tage: number;
};

/**
 * The starts the website may sell for this choice, per German day („10:00“, „10:30“ …). Empty
 * when the choice can only be an Anfrage (on-request Paket, Extra or Zone): the form then asks
 * for a wished date instead.
 */
export async function freieStarts(
  a: StartAnfrage,
  jetzt: Date,
  client: Db | Tx = db,
): Promise<Record<string, string[]>> {
  const [regeln] = await client.select().from(einstellungen).where(eq(einstellungen.id, 1));
  const [paket] = await client.select().from(pakete).where(eq(pakete.id, a.paketId));
  const [ort] = await client
    .select({ zone: zonen })
    .from(staedte)
    .innerJoin(zonen, eq(zonen.code, staedte.zoneCode))
    .where(eq(staedte.id, a.stadtId));
  const extraRows = a.extraIds.length
    ? await client.select().from(extras).where(inArray(extras.id, a.extraIds))
    : [];
  if (!regeln || !paket || !ort || !paket.dauerMin) return {};
  if (paket.nurAnfrage || ort.zone.nurAnfrage || extraRows.some((x) => x.nurAnfrage)) return {};

  const tage = Array.from({ length: a.tage }, (_, i) => tagePlus(a.ab, i));
  const kandidaten = await kandidatenFuer(a.figurIds, client);
  const ids = kandidaten.map((k) => k.id);
  const von = new Date(Date.parse(`${tage[0]}T00:00:00Z`) - 12 * STUNDE);
  const bis = new Date(Date.parse(`${tage.at(-1)}T00:00:00Z`) + 36 * STUNDE);
  const belegt = await aktiveBelegungen(ids, von, bis, jetzt, client);

  const jeTag = freieStartsJeTag({
    tage,
    regeln,
    fensterBasis: {
      fahrtMinuten: ort.zone.fahrtMinuten,
      vorbereitungMin: regeln.vorbereitungMin,
      dauerMin: paket.dauerMin,
      extrasDeltaMin: extraRows.reduce((s, x) => s + x.dauerDeltaMin, 0),
      abbauMin: regeln.abbauMin,
    },
    figuren: a.figurIds,
    darsteller: kandidaten,
    belegungen: belegt,
    fruehestens: new Date(jetzt.getTime() + regeln.mindestVorlaufStd * STUNDE),
  });
  return Object.fromEntries(
    Object.entries(jeTag).map(([tag, starts]) => [tag, starts.map(berlinUhrzeit)]),
  );
}

export type AnfrageWunsch = {
  figurId: number;
  zweiteFigurId: number | null;
  paketId: number;
  extraIds: number[];
  stadtId: number;
  beginn: Date;
  zahlungsart: ZahlungAdapterName;
  rechnungAn: string | null;
  kontakt: { name: string; email: string; telefon: string | null };
  adresse: { strasse: string | null; plz: string | null; ort: string | null };
  kind: { name: string | null; alter: number | null; anzahl: number | null };
  sprache: Sprache | null;
  notizKunde: string | null;
};

/** Why a Wunsch would have to stay an Anfrage; null when the website may take it. */
export async function anfrageGrund(
  w: Pick<AnfrageWunsch, "paketId" | "extraIds" | "stadtId" | "beginn">,
  jetzt: Date,
  client: Db | Tx = db,
): Promise<AnfrageGrund | null> {
  const [regeln] = await client.select().from(einstellungen).where(eq(einstellungen.id, 1));
  const [paket] = await client.select().from(pakete).where(eq(pakete.id, w.paketId));
  const [ort] = await client
    .select({ zone: zonen })
    .from(staedte)
    .innerJoin(zonen, eq(zonen.code, staedte.zoneCode))
    .where(eq(staedte.id, w.stadtId));
  const extraRows = w.extraIds.length
    ? await client.select().from(extras).where(inArray(extras.id, w.extraIds))
    : [];
  if (!regeln || !paket) throw new BuchungFehler("Dieses Paket ist nicht buchbar.", "paketId");
  return nurAnfrage({
    beginn: w.beginn,
    jetzt,
    mindestVorlaufStd: regeln.mindestVorlaufStd,
    zone: ort?.zone ?? null,
    paket,
    extras: extraRows,
  });
}

/**
 * An Anfrage: written as a Buchung in status „anfrage“ without taking anyone — the owner plans
 * it by hand. The price lines that are already known are kept; the total only when all are.
 */
export async function stelleAnfrage(
  w: AnfrageWunsch,
  jetzt: Date,
  client: Db | Tx = db,
): Promise<{ id: number; nummer: string; zugriffToken: string }> {
  return client.transaction(async (tx) => {
    const [regeln] = await tx.select().from(einstellungen).where(eq(einstellungen.id, 1));
    const [paket] = await tx.select().from(pakete).where(eq(pakete.id, w.paketId));
    const [ort] = await tx
      .select({ stadt: staedte, zone: zonen })
      .from(staedte)
      .innerJoin(zonen, eq(zonen.code, staedte.zoneCode))
      .where(eq(staedte.id, w.stadtId));
    const extraRows = w.extraIds.length
      ? await tx
          .select()
          .from(extras)
          .where(and(inArray(extras.id, w.extraIds), eq(extras.aktiv, true)))
      : [];
    const figurIds = [w.figurId, ...(w.zweiteFigurId ? [w.zweiteFigurId] : [])];
    const figurRows = await tx
      .select({ id: figuren.id })
      .from(figuren)
      .where(inArray(figuren.id, figurIds));
    if (!paket || !paket.aktiv)
      throw new BuchungFehler("Dieses Paket ist nicht buchbar.", "paketId");
    if (!ort) throw new BuchungFehler("Bitte wählen Sie einen Ort aus der Liste.", "stadtId");
    if (figurRows.length !== new Set(figurIds).size)
      throw new BuchungFehler("Diese Figur ist zurzeit nicht buchbar.", "figurId");

    const positionen: PreisPosition[] = [];
    let vollstaendig = true;
    if (paket.preis !== null && !paket.nurAnfrage)
      positionen.push({ art: "paket", bezeichnung: paket.name, cent: centAusBetrag(paket.preis) });
    else vollstaendig = false;
    if (!ort.zone.nurAnfrage)
      positionen.push({
        art: "zone",
        bezeichnung: `Anfahrt ${ort.stadt.name} (Zone ${ort.zone.code})`,
        cent: centAusBetrag(ort.zone.aufschlag),
      });
    else vollstaendig = false;
    for (const x of extraRows) {
      if (x.preis !== null && !x.nurAnfrage)
        positionen.push({ art: "extra", bezeichnung: x.name, cent: centAusBetrag(x.preis) });
      else vollstaendig = false;
    }
    const summeCent = positionen.reduce((s, p) => s + p.cent, 0);

    const fenster =
      paket.dauerMin && regeln
        ? berechneFenster({
            beginn: w.beginn,
            fahrtMinuten: ort.zone.fahrtMinuten,
            vorbereitungMin: regeln.vorbereitungMin,
            dauerMin: paket.dauerMin,
            extrasDeltaMin: extraRows.reduce((s, x) => s + x.dauerDeltaMin, 0),
            abbauMin: regeln.abbauMin,
          })
        : null;

    const zugriffToken = randomBytes(24).toString("base64url");
    const [neu] = await tx
      .insert(buchungen)
      .values({
        nummer: await naechsteNummer(tx, "BU", Number(berlinTag(jetzt).slice(0, 4))),
        status: "anfrage",
        quelle: "web",
        paketId: paket.id,
        figurId: w.figurId,
        zweiteFigurId: w.zweiteFigurId,
        beginn: w.beginn,
        fensterVon: fenster?.von ?? null,
        fensterBis: fenster?.bis ?? null,
        stadtId: ort.stadt.id,
        zoneCode: ort.zone.code,
        strasse: w.adresse.strasse,
        plz: w.adresse.plz,
        ort: w.adresse.ort,
        kontaktName: w.kontakt.name,
        kontaktEmail: w.kontakt.email,
        kontaktTelefon: w.kontakt.telefon,
        kindName: w.kind.name,
        kindAlter: w.kind.alter,
        kinderAnzahl: w.kind.anzahl,
        sprache: w.sprache,
        notizKunde: w.notizKunde,
        rechnungAn: w.rechnungAn,
        positionen,
        summe: vollstaendig ? betragAusCent(summeCent) : null,
        anzahlung:
          vollstaendig && regeln
            ? betragAusCent(Math.round((summeCent * regeln.anzahlungProzent) / 100))
            : null,
        zahlungsart: w.zahlungsart,
        zugriffHash: hash(zugriffToken),
      })
      .returning({ id: buchungen.id, nummer: buchungen.nummer });
    if (extraRows.length > 0) {
      await tx.insert(buchungExtras).values(
        extraRows.map((x) => ({
          buchungId: neu!.id,
          extraId: x.id,
          preis: x.preis,
          dauerDeltaMin: x.dauerDeltaMin,
        })),
      );
    }
    return { id: neu!.id, nummer: neu!.nummer, zugriffToken };
  });
}

/** A Buchung as its customer sees it behind the link; null for an unknown link. */
export async function kundenSicht(token: string, jetzt: Date, client: Db | Tx = db) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const [b] = await client
    .select()
    .from(buchungen)
    .where(eq(buchungen.zugriffHash, hash(token)));
  if (!b) return null;
  const namen = async (ids: (number | null)[]) => {
    const echte = ids.filter((x): x is number => x !== null);
    if (echte.length === 0) return [];
    const rows = await client
      .select({ id: figuren.id, name: figuren.name })
      .from(figuren)
      .where(inArray(figuren.id, echte));
    return echte.map((id) => rows.find((r) => r.id === id)?.name ?? "");
  };
  const figurNamen = await namen([b.figurId, b.zweiteFigurId]);
  const [paket] = b.paketId
    ? await client.select({ name: pakete.name }).from(pakete).where(eq(pakete.id, b.paketId))
    : [];
  const [stadt] = b.stadtId
    ? await client.select({ name: staedte.name }).from(staedte).where(eq(staedte.id, b.stadtId))
    : [];
  const summeCent = b.summe === null ? null : centAusBetrag(b.summe);
  const anzahlungCent = b.anzahlung === null ? null : centAusBetrag(b.anzahlung);
  // What cancelling now would cost, by the grid; only for Buchungen that still take a slot.
  const storno =
    (b.status === "reserviert" || b.status === "bestaetigt") && summeCent !== null
      ? stornoGebuehr({
          beginn: b.beginn,
          jetzt,
          summeCent,
          bezahltCent: b.status === "bestaetigt" ? (anzahlungCent ?? 0) : 0,
          durch: "kunde",
        })
      : null;
  return {
    id: b.id,
    nummer: b.nummer,
    status: b.status,
    beginn: b.beginn,
    haltenBis: b.haltenBis,
    zahlungsart: b.zahlungsart,
    rechnungAn: b.rechnungAn,
    figuren: figurNamen,
    paket: paket?.name ?? null,
    stadt: stadt?.name ?? null,
    adresse: [b.strasse, [b.plz, b.ort].filter(Boolean).join(" ")].filter(Boolean).join(", "),
    kontaktName: b.kontaktName,
    kontaktEmail: b.kontaktEmail,
    positionen: b.positionen,
    summeCent,
    anzahlungCent,
    storno,
    storniertAm: b.storniertAm,
    stornoGebuehrCent: b.stornoGebuehr === null ? null : centAusBetrag(b.stornoGebuehr),
  };
}
export type KundenSicht = NonNullable<Awaited<ReturnType<typeof kundenSicht>>>;

/**
 * The customer cancels through their link. Allowed online while the grid decides by itself (a
 * held Buchung, or more than seven days ahead); closer to the party the owner decides.
 */
export async function storniereDurchKunde(token: string, jetzt: Date, client: Db | Tx = db) {
  const sicht = await kundenSicht(token, jetzt, client);
  if (!sicht) throw new BuchungFehler("Diese Buchung gibt es nicht.");
  if (!sicht.storno) throw new BuchungFehler("Diese Buchung kann nicht mehr storniert werden.");
  if (sicht.status === "bestaetigt" && sicht.storno.entscheidung !== "auto")
    throw new BuchungFehler(
      "So kurz vor der Feier stornieren wir gemeinsam mit Ihnen. Bitte schreiben Sie uns oder rufen Sie an.",
    );
  return setzeStatus(sicht.id, { nach: "storniert", durch: "kunde" }, KUNDE, jetzt, client);
}
