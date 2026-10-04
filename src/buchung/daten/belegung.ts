// Taking a slot: the one place where a mistake means a spoiled birthday. The candidate Darsteller
// are locked (FOR UPDATE, in id order) for the whole transaction, their lapsed holds are released,
// their Belegungen are checked, and only then is the Buchung written; the exclusion constraint on
// belegungen is the backstop. Pure decisions come from ../logik.
import { createHash, randomBytes } from "node:crypto";

import { and, asc, eq, gt, gte, inArray, isNull, lt, ne, or } from "drizzle-orm";

import { tagePlus } from "../../buero/logik/ablauf";
import { naechsteNummer } from "../../buero/daten/basis";
import { getFirma } from "../../buero/daten/firma";
import { betragAusCent, centAusBetrag } from "../../buero/logik/geld";
import { berlinTag } from "../../buero/logik/kalender";
import { writeAudit } from "../../cms/audit/log";
import type { Actor } from "../../cms/audit/types";
import { db, type Db, type Tx } from "../../cms/db/client";
import {
  belegungen,
  buchungExtras,
  buchungen,
  darsteller,
  darstellerFiguren,
  einstellungen,
  extras,
  figuren,
  pakete,
  staedte,
  zonen,
} from "../db/schema";
import { berechneFenster, type FensterEingabe } from "../logik/fenster";
import { preisAngebot } from "../logik/preis";
import {
  naechsteFreie,
  startZeiten,
  waehleDarsteller,
  type Belegt,
  type Kandidat,
} from "../logik/raster";
import { nurAnfrage, tageBis, type AnfrageGrund } from "../logik/regeln";
import type {
  BuchungQuelle,
  BuchungStatus,
  PreisPosition,
  Sprache,
  ZahlungAdapterName,
} from "../logik/typen";
import { woche } from "../logik/woche";
import { berlinStart } from "../logik/zeit";
import { BuchungFehler } from "./basis";

const MIN = 60_000;
const STUNDE = 60 * MIN;

export type SlotWunsch = {
  figurId: number;
  /** Needed when the Paket brings two Figuren or the Extra „second Figur“ is chosen. */
  zweiteFigurId: number | null;
  paketId: number;
  extraIds: number[];
  stadtId: number;
  beginn: Date;
  zahlungsart: ZahlungAdapterName;
  kontakt: { name: string; email: string; telefon: string | null };
  adresse?: { strasse: string | null; plz: string | null; ort: string | null };
  kind?: { name: string | null; alter: number | null; anzahl: number | null };
  sprache?: Sprache | null;
  notizKunde?: string | null;
  kundeId?: number | null;
};

export type GehalteneBuchung = {
  id: number;
  nummer: string;
  status: BuchungStatus;
  haltenBis: Date | null;
  positionen: PreisPosition[];
  summeCent: number;
  anzahlungCent: number;
  /** The customer's link token; only its hash is stored, so it is handed out this once. */
  zugriffToken: string;
  darsteller: number[];
};

export type HalteErgebnis =
  | { ok: true; buchung: GehalteneBuchung }
  | { ok: false; grund: "belegt"; alternativen: Date[] }
  | { ok: false; grund: AnfrageGrund };

type Optionen = {
  jetzt: Date;
  /** „web“ holds the slot until the deposit is paid; a phone or admin order is confirmed at once. */
  quelle: BuchungQuelle;
  akteur?: Actor;
};

const istUeberschneidung = (error: unknown) => {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code === "23P01" || e?.cause?.code === "23P01";
};

/** The Belegungen of these Darsteller that overlap [von, bis); lapsed holds count as free. */
export async function aktiveBelegungen(
  darstellerIds: number[],
  von: Date,
  bis: Date,
  jetzt: Date,
  client: Db | Tx = db,
): Promise<(Belegt & { art: "einsatz" | "sperre" })[]> {
  if (darstellerIds.length === 0) return [];
  return client
    .select({
      darstellerId: belegungen.darstellerId,
      von: belegungen.von,
      bis: belegungen.bis,
      art: belegungen.art,
    })
    .from(belegungen)
    .leftJoin(buchungen, eq(buchungen.id, belegungen.buchungId))
    .where(
      and(
        eq(belegungen.aktiv, true),
        inArray(belegungen.darstellerId, darstellerIds),
        lt(belegungen.von, bis),
        gt(belegungen.bis, von),
        or(
          isNull(buchungen.id),
          ne(buchungen.status, "reserviert"),
          isNull(buchungen.haltenBis),
          gte(buchungen.haltenBis, jetzt),
        ),
      ),
    );
}

export async function kandidatenFuer(figurIds: number[], client: Db | Tx): Promise<Kandidat[]> {
  const rows = await client
    .select({
      id: darsteller.id,
      prioritaet: darsteller.prioritaet,
      figurId: darstellerFiguren.figurId,
    })
    .from(darsteller)
    .innerJoin(darstellerFiguren, eq(darstellerFiguren.darstellerId, darsteller.id))
    .where(and(eq(darsteller.aktiv, true), inArray(darstellerFiguren.figurId, figurIds)));
  const nachId = new Map<number, Kandidat>();
  for (const r of rows) {
    const k = nachId.get(r.id) ?? { id: r.id, prioritaet: r.prioritaet, figuren: [] };
    k.figuren.push(r.figurId);
    nachId.set(r.id, k);
  }
  return [...nachId.values()];
}

// Holds whose time ran out: lapsed, their Darsteller free again. Inside the caller's transaction.
async function verfallenLassen(tx: Tx, jetzt: Date, nurDarsteller?: number[]) {
  const vonDiesen = nurDarsteller
    ? inArray(
        buchungen.id,
        tx
          .select({ id: belegungen.buchungId })
          .from(belegungen)
          .where(and(eq(belegungen.aktiv, true), inArray(belegungen.darstellerId, nurDarsteller))),
      )
    : undefined;
  const freigegeben = await tx
    .update(buchungen)
    .set({ status: "verfallen", updatedAt: jetzt })
    .where(and(eq(buchungen.status, "reserviert"), lt(buchungen.haltenBis, jetzt), vonDiesen))
    .returning({ id: buchungen.id });
  const ids = freigegeben.map((r) => r.id);
  if (ids.length > 0) {
    await tx
      .update(belegungen)
      .set({ aktiv: false, updatedAt: jetzt })
      .where(inArray(belegungen.buchungId, ids));
  }
  return ids;
}

async function minutenDieseWoche(ids: number[], beginn: Date, jetzt: Date, client: Db | Tx) {
  const w = woche(berlinTag(beginn));
  const minuten = new Map<number, number>();
  for (const b of await aktiveBelegungen(ids, w.von, w.bis, jetzt, client)) {
    if (b.art !== "einsatz") continue;
    minuten.set(
      b.darstellerId,
      (minuten.get(b.darstellerId) ?? 0) + (b.bis.getTime() - b.von.getTime()) / MIN,
    );
  }
  return minuten;
}

// Everything a Wunsch refers to, checked: the Paket, the Figuren, the Stadt with its Zone, the
// Extras and the engine's settings. One query after the other: inside a transaction there is only
// one connection.
async function kontext(w: SlotWunsch, client: Db | Tx) {
  const [regeln] = await client.select().from(einstellungen).where(eq(einstellungen.id, 1));
  const [paket] = await client.select().from(pakete).where(eq(pakete.id, w.paketId));
  const [stadt] = await client
    .select({ stadt: staedte, zone: zonen })
    .from(staedte)
    .innerJoin(zonen, eq(zonen.code, staedte.zoneCode))
    .where(eq(staedte.id, w.stadtId));
  const extraRows = w.extraIds.length
    ? await client
        .select()
        .from(extras)
        .where(and(inArray(extras.id, w.extraIds), eq(extras.aktiv, true)))
    : [];
  const { firma } = await getFirma(client);
  if (!regeln) throw new BuchungFehler("Die Buchungseinstellungen fehlen.");
  if (!paket || !paket.aktiv) throw new BuchungFehler("Dieses Paket ist nicht buchbar.", "paketId");
  if (extraRows.length !== new Set(w.extraIds).size)
    throw new BuchungFehler("Ein gewähltes Extra ist nicht mehr buchbar.", "extraIds");

  const zweiFiguren = paket.figurenAnzahl === 2 || extraRows.some((x) => x.zusatzFigur);
  if (zweiFiguren && !w.zweiteFigurId)
    throw new BuchungFehler("Bitte wählen Sie eine zweite Figur.", "zweiteFigurId");
  const benoetigt = zweiFiguren ? [w.figurId, w.zweiteFigurId!] : [w.figurId];
  const figurRows = await client
    .select({ id: figuren.id })
    .from(figuren)
    .where(and(inArray(figuren.id, benoetigt), eq(figuren.aktiv, true)));
  if (figurRows.length !== new Set(benoetigt).size)
    throw new BuchungFehler("Diese Figur ist zurzeit nicht buchbar.", "figurId");

  return { regeln, paket, ort: stadt ?? null, extras: extraRows, firma, benoetigt };
}

/**
 * Takes the slot of a Wunsch. On the website it is held (status „reserviert“) until the deposit
 * comes in; a phone, Instagram or admin order is confirmed at once and may break the website's
 * rules (short notice, far away). When the Wunsch must stay an Anfrage, nothing is written.
 */
export async function halteSlot(
  w: SlotWunsch,
  opts: Optionen,
  client: Db | Tx = db,
): Promise<HalteErgebnis> {
  const web = opts.quelle === "web";
  const k = await kontext(w, client);

  if (web) {
    const grund = nurAnfrage({
      beginn: w.beginn,
      jetzt: opts.jetzt,
      mindestVorlaufStd: k.regeln.mindestVorlaufStd,
      zone: k.ort?.zone ?? null,
      paket: k.paket,
      extras: k.extras,
    });
    if (grund) return { ok: false, grund };
    const tage = tageBis(opts.jetzt, w.beginn);
    if (k.extras.some((x) => tage < x.vorlaufTage))
      throw new BuchungFehler("Ein Extra kann bis zu diesem Tag nicht mehr gefertigt werden.");
    const angeboten = startZeiten(berlinTag(w.beginn), k.regeln).some(
      (d) => d.getTime() === w.beginn.getTime(),
    );
    if (!angeboten) throw new BuchungFehler("Diese Uhrzeit wird nicht angeboten.", "beginn");
  }
  if (!k.ort) throw new BuchungFehler("Bitte wählen Sie einen Ort aus der Liste.", "stadtId");
  if (k.paket.nurAnfrage || !k.paket.dauerMin || k.paket.preis === null)
    throw new BuchungFehler("Dieses Paket gibt es nur auf Anfrage.", "paketId");

  const fensterBasis: Omit<FensterEingabe, "beginn"> = {
    fahrtMinuten: k.ort.zone.fahrtMinuten,
    vorbereitungMin: k.regeln.vorbereitungMin,
    dauerMin: k.paket.dauerMin,
    extrasDeltaMin: k.extras.reduce((s, x) => s + x.dauerDeltaMin, 0),
    abbauMin: k.regeln.abbauMin,
  };
  const fenster = berechneFenster({ ...fensterBasis, beginn: w.beginn });
  const preis = preisAngebot({
    paket: { name: k.paket.name, preisCent: centAusBetrag(k.paket.preis) },
    zone: {
      name: `${k.ort.stadt.name} (Zone ${k.ort.zone.code})`,
      aufschlagCent: centAusBetrag(k.ort.zone.aufschlag),
    },
    extras: k.extras.map((x) => ({ name: x.name, preisCent: centAusBetrag(x.preis) })),
    anzahlungProzent: k.regeln.anzahlungProzent,
    kleinunternehmer: k.firma.kleinunternehmer,
  });
  const kandidaten = await kandidatenFuer(k.benoetigt, client);
  const ids = kandidaten.map((d) => d.id).sort((a, b) => a - b);

  let gehalten: GehalteneBuchung | null = null;
  try {
    gehalten = await client.transaction(async (tx) => {
      if (ids.length === 0) return null;
      await tx
        .select({ id: darsteller.id })
        .from(darsteller)
        .where(inArray(darsteller.id, ids))
        .orderBy(asc(darsteller.id))
        .for("update");
      await verfallenLassen(tx, opts.jetzt, ids);

      const belegt = await aktiveBelegungen(ids, fenster.von, fenster.bis, opts.jetzt, tx);
      const wahl = waehleDarsteller({
        figuren: k.benoetigt,
        darsteller: kandidaten,
        belegungen: belegt,
        fenster,
        minutenDieseWoche: await minutenDieseWoche(ids, w.beginn, opts.jetzt, tx),
      });
      if (!wahl) return null;

      const zugriffToken = randomBytes(24).toString("base64url");
      const status: BuchungStatus = web ? "reserviert" : "bestaetigt";
      const haltenBis =
        web && w.zahlungsart !== "rechnung"
          ? new Date(opts.jetzt.getTime() + k.regeln.haltenMin * MIN)
          : null;
      const [neu] = await tx
        .insert(buchungen)
        .values({
          nummer: await naechsteNummer(tx, "BU", Number(berlinTag(opts.jetzt).slice(0, 4))),
          status,
          quelle: opts.quelle,
          paketId: k.paket.id,
          figurId: k.benoetigt[0]!,
          zweiteFigurId: k.benoetigt[1] ?? null,
          beginn: w.beginn,
          fensterVon: fenster.von,
          fensterBis: fenster.bis,
          stadtId: k.ort!.stadt.id,
          zoneCode: k.ort!.zone.code,
          strasse: w.adresse?.strasse ?? null,
          plz: w.adresse?.plz ?? null,
          ort: w.adresse?.ort ?? null,
          kontaktName: w.kontakt.name,
          kontaktEmail: w.kontakt.email,
          kontaktTelefon: w.kontakt.telefon,
          kindName: w.kind?.name ?? null,
          kindAlter: w.kind?.alter ?? null,
          kinderAnzahl: w.kind?.anzahl ?? null,
          sprache: w.sprache ?? null,
          notizKunde: w.notizKunde ?? null,
          kundeId: w.kundeId ?? null,
          positionen: preis.positionen,
          summe: betragAusCent(preis.summeCent),
          anzahlung: betragAusCent(preis.anzahlungCent),
          zahlungsart: w.zahlungsart,
          haltenBis,
          zugriffHash: createHash("sha256").update(zugriffToken).digest("hex"),
        })
        .returning({ id: buchungen.id, nummer: buchungen.nummer });
      if (k.extras.length > 0) {
        await tx.insert(buchungExtras).values(
          k.extras.map((x) => ({
            buchungId: neu!.id,
            extraId: x.id,
            preis: x.preis,
            dauerDeltaMin: x.dauerDeltaMin,
          })),
        );
      }
      await tx.insert(belegungen).values(
        wahl.map((darstellerId, i) => ({
          darstellerId,
          art: "einsatz" as const,
          buchungId: neu!.id,
          figurId: k.benoetigt[i]!,
          von: fenster.von,
          bis: fenster.bis,
        })),
      );
      if (opts.akteur) {
        await writeAudit(tx, {
          actor: opts.akteur,
          action: "buchung.angelegt",
          target: { type: "buchung", id: neu!.id },
          details: { nummer: neu!.nummer, quelle: opts.quelle },
        });
      }
      return {
        id: neu!.id,
        nummer: neu!.nummer,
        status,
        haltenBis,
        positionen: preis.positionen,
        summeCent: preis.summeCent,
        anzahlungCent: preis.anzahlungCent,
        zugriffToken,
        darsteller: wahl,
      };
    });
  } catch (error) {
    if (!istUeberschneidung(error)) throw error;
  }
  if (gehalten) return { ok: true, buchung: gehalten };

  // Taken: the nearest free starts a week either side, for the same Figuren.
  const tag = berlinTag(w.beginn);
  const tage = Array.from({ length: 15 }, (_, i) => tagePlus(tag, i - 7));
  const belegt = await aktiveBelegungen(
    ids,
    berlinStart(tage[0]!, "00:00")!,
    berlinStart(tagePlus(tage[14]!, 1), "00:00")!,
    opts.jetzt,
    client,
  );
  const fruehestens = opts.jetzt.getTime() + (web ? k.regeln.mindestVorlaufStd * STUNDE : 0);
  const starts = tage
    .flatMap((t) => startZeiten(t, k.regeln))
    .filter((d) => d.getTime() >= fruehestens);
  const alternativen = naechsteFreie(starts, w.beginn, (start) =>
    Boolean(
      waehleDarsteller({
        figuren: k.benoetigt,
        darsteller: kandidaten,
        belegungen: belegt,
        fenster: berechneFenster({ ...fensterBasis, beginn: start }),
      }),
    ),
  );
  return { ok: false, grund: "belegt", alternativen };
}

/**
 * Time off for a Darsteller (holiday, illness, a private appointment), under the same lock as a
 * booking. Refused over a planned Einsatz: that one is moved or cancelled first.
 */
export async function sperreDarsteller(
  e: { darstellerId: number; von: Date; bis: Date; grund: string | null },
  akteur: Actor,
  client: Db | Tx = db,
  jetzt: Date = new Date(),
): Promise<{ id: number }> {
  if (e.bis.getTime() <= e.von.getTime())
    throw new BuchungFehler("Das Ende muss nach dem Beginn liegen.", "bis");
  try {
    return await client.transaction(async (tx) => {
      const [person] = await tx
        .select({ id: darsteller.id })
        .from(darsteller)
        .where(eq(darsteller.id, e.darstellerId))
        .for("update");
      if (!person) throw new BuchungFehler("Diesen Darsteller gibt es nicht mehr.");
      await verfallenLassen(tx, jetzt, [e.darstellerId]);

      const konflikte = await tx
        .select({ art: belegungen.art, nummer: buchungen.nummer })
        .from(belegungen)
        .leftJoin(buchungen, eq(buchungen.id, belegungen.buchungId))
        .where(
          and(
            eq(belegungen.aktiv, true),
            eq(belegungen.darstellerId, e.darstellerId),
            lt(belegungen.von, e.bis),
            gt(belegungen.bis, e.von),
          ),
        );
      if (konflikte.length > 0) {
        const was = konflikte.map((x) => x.nummer ?? "eine andere Sperre").join(", ");
        throw new BuchungFehler(
          `In dieser Zeit ist schon etwas eingeplant (${was}). Bitte zuerst umbesetzen oder stornieren.`,
        );
      }
      const [neu] = await tx
        .insert(belegungen)
        .values({
          darstellerId: e.darstellerId,
          art: "sperre",
          von: e.von,
          bis: e.bis,
          grund: e.grund,
        })
        .returning({ id: belegungen.id });
      await writeAudit(tx, {
        actor: akteur,
        action: "darsteller.gesperrt",
        target: { type: "darsteller", id: e.darstellerId },
        details: { von: e.von.toISOString(), bis: e.bis.toISOString(), grund: e.grund },
      });
      return { id: neu!.id };
    });
  } catch (error) {
    if (istUeberschneidung(error))
      throw new BuchungFehler("In dieser Zeit ist schon etwas eingeplant.");
    throw error;
  }
}

/** The sweeper (every five minutes): holds whose time ran out lapse. Returns their ids. */
export async function gebeAbgelaufeneFrei(jetzt: Date = new Date(), client: Db | Tx = db) {
  return client.transaction((tx) => verfallenLassen(tx, jetzt));
}
