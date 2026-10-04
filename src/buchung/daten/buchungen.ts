// What the owner does with bookings in the admin: the week's plan, a booking's card, its status
// steps (confirm, cancel by the grid, close), the performer's note and the export for the tax
// adviser. Taking a slot itself lives in belegung.ts.
import { and, asc, eq, gt, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { betragAusCent, centAusBetrag } from "../../buero/logik/geld";
import { berlinTag, berlinUhrzeit } from "../../buero/logik/kalender";
import { writeAudit } from "../../cms/audit/log";
import type { Actor } from "../../cms/audit/types";
import { db, type Db, type Tx } from "../../cms/db/client";
import {
  belegungen,
  buchungExtras,
  buchungen,
  darsteller,
  extras,
  figuren,
  pakete,
  staedte,
} from "../db/schema";
import { belegt, kannWechseln } from "../logik/status";
import { stornoGebuehr, type StornoErgebnis } from "../logik/storno";
import type { ExportZeile } from "../logik/export";
import { STATUS_NAMEN, type BuchungStatus } from "../logik/typen";
import type { Woche } from "../logik/woche";
import { BuchungFehler } from "./basis";

const MIN = 60_000;
const zweiteFigur = alias(figuren, "zweite_figur");
const extrasMinuten = sql<number>`(select coalesce(sum(${buchungExtras.dauerDeltaMin}), 0)::int from ${buchungExtras} where ${buchungExtras.buchungId} = ${buchungen.id})`;

export type PlanEintrag = {
  id: number;
  art: "einsatz" | "sperre";
  von: Date;
  bis: Date;
  darstellerId: number;
  darstellerName: string;
  grund: string | null;
  beginn: Date | null;
  partyEnde: Date | null;
  buchung: {
    id: number;
    nummer: string;
    status: BuchungStatus;
    figur: string | null;
    stadt: string | null;
    kontaktName: string;
  } | null;
};

/**
 * The week's Einsätze and Sperren, optionally of one Darsteller. A lapsed hold is left out; an
 * Einsatz of a confirmed or closed booking stays, so the past week can still be read.
 */
export async function wochenPlan(
  w: Pick<Woche, "von" | "bis">,
  o: { jetzt: Date; darstellerId?: number | null },
  client: Db | Tx = db,
): Promise<PlanEintrag[]> {
  const rows = await client
    .select({
      id: belegungen.id,
      art: belegungen.art,
      von: belegungen.von,
      bis: belegungen.bis,
      grund: belegungen.grund,
      darstellerId: darsteller.id,
      darstellerName: darsteller.name,
      buchungId: buchungen.id,
      nummer: buchungen.nummer,
      status: buchungen.status,
      beginn: buchungen.beginn,
      kontaktName: buchungen.kontaktName,
      dauerMin: pakete.dauerMin,
      extrasMin: extrasMinuten,
      figur: figuren.name,
      stadt: staedte.name,
    })
    .from(belegungen)
    .innerJoin(darsteller, eq(darsteller.id, belegungen.darstellerId))
    .leftJoin(buchungen, eq(buchungen.id, belegungen.buchungId))
    .leftJoin(pakete, eq(pakete.id, buchungen.paketId))
    .leftJoin(figuren, eq(figuren.id, belegungen.figurId))
    .leftJoin(staedte, eq(staedte.id, buchungen.stadtId))
    .where(
      and(
        lt(belegungen.von, w.bis),
        gt(belegungen.bis, w.von),
        o.darstellerId ? eq(belegungen.darstellerId, o.darstellerId) : undefined,
        or(
          and(eq(belegungen.art, "sperre"), eq(belegungen.aktiv, true)),
          inArray(buchungen.status, ["bestaetigt", "abgeschlossen"]),
          and(
            eq(buchungen.status, "reserviert"),
            eq(belegungen.aktiv, true),
            or(isNull(buchungen.haltenBis), gte(buchungen.haltenBis, o.jetzt)),
          ),
        ),
      ),
    )
    .orderBy(asc(belegungen.von), asc(darsteller.name));

  return rows.map((r) => ({
    id: r.id,
    art: r.art,
    von: r.von,
    bis: r.bis,
    darstellerId: r.darstellerId,
    darstellerName: r.darstellerName,
    grund: r.grund,
    beginn: r.beginn,
    partyEnde:
      r.beginn && r.dauerMin !== null
        ? new Date(r.beginn.getTime() + (r.dauerMin + (r.extrasMin ?? 0)) * MIN)
        : null,
    buchung: r.buchungId
      ? {
          id: r.buchungId,
          nummer: r.nummer!,
          status: r.status!,
          figur: r.figur,
          stadt: r.stadt,
          kontaktName: r.kontaktName!,
        }
      : null,
  }));
}

/** Bookings from a moment on (upcoming by default), newest party last. */
export async function listBuchungen(
  o: { ab: Date; status?: BuchungStatus[] },
  client: Db | Tx = db,
) {
  const rows = await client
    .select({
      id: buchungen.id,
      nummer: buchungen.nummer,
      status: buchungen.status,
      quelle: buchungen.quelle,
      beginn: buchungen.beginn,
      kontaktName: buchungen.kontaktName,
      summe: buchungen.summe,
      haltenBis: buchungen.haltenBis,
      figur: figuren.name,
      paket: pakete.name,
      stadt: staedte.name,
    })
    .from(buchungen)
    .leftJoin(figuren, eq(figuren.id, buchungen.figurId))
    .leftJoin(pakete, eq(pakete.id, buchungen.paketId))
    .leftJoin(staedte, eq(staedte.id, buchungen.stadtId))
    .where(
      and(
        gte(buchungen.beginn, o.ab),
        o.status?.length ? inArray(buchungen.status, o.status) : undefined,
      ),
    )
    .orderBy(asc(buchungen.beginn));
  return rows.map((r) => ({ ...r, summeCent: r.summe === null ? null : centAusBetrag(r.summe) }));
}

export async function getBuchung(id: number, client: Db | Tx = db) {
  const [b] = await client
    .select({
      buchung: buchungen,
      figur: figuren.name,
      zweiteFigur: zweiteFigur.name,
      paket: pakete.name,
      stadt: staedte.name,
    })
    .from(buchungen)
    .leftJoin(figuren, eq(figuren.id, buchungen.figurId))
    .leftJoin(zweiteFigur, eq(zweiteFigur.id, buchungen.zweiteFigurId))
    .leftJoin(pakete, eq(pakete.id, buchungen.paketId))
    .leftJoin(staedte, eq(staedte.id, buchungen.stadtId))
    .where(eq(buchungen.id, id));
  if (!b) return null;
  const extraNamen = await client
    .select({ name: extras.name })
    .from(buchungExtras)
    .innerJoin(extras, eq(extras.id, buchungExtras.extraId))
    .where(eq(buchungExtras.buchungId, id))
    .orderBy(asc(extras.sort), asc(extras.name));
  const einsaetze = await client
    .select({
      darstellerId: darsteller.id,
      darsteller: darsteller.name,
      telefon: darsteller.telefon,
      aktiv: belegungen.aktiv,
      von: belegungen.von,
      bis: belegungen.bis,
    })
    .from(belegungen)
    .innerJoin(darsteller, eq(darsteller.id, belegungen.darstellerId))
    .where(eq(belegungen.buchungId, id))
    .orderBy(asc(darsteller.name));
  const x = b.buchung;
  return {
    ...x,
    figur: b.figur,
    zweiteFigur: b.zweiteFigur,
    paket: b.paket,
    stadt: b.stadt,
    extras: extraNamen.map((e) => e.name),
    einsaetze,
    summeCent: x.summe === null ? null : centAusBetrag(x.summe),
    anzahlungCent: x.anzahlung === null ? null : centAusBetrag(x.anzahlung),
    stornoGebuehrCent: x.stornoGebuehr === null ? null : centAusBetrag(x.stornoGebuehr),
  };
}

export type StatusAenderung =
  | { nach: "bestaetigt" | "abgeschlossen" | "abgelehnt" }
  | { nach: "storniert"; durch: "kunde" | "agentur"; grund?: string | null };

/**
 * One step of a booking's status. Cancelling applies the grid of the AGB to what was paid (the
 * deposit once the booking is confirmed) and frees the Darsteller; the owner is the one deciding.
 */
export async function setzeStatus(
  id: number,
  a: StatusAenderung,
  akteur: Actor,
  jetzt: Date = new Date(),
  client: Db | Tx = db,
): Promise<{ status: BuchungStatus; storno?: StornoErgebnis }> {
  return client.transaction(async (tx) => {
    const [b] = await tx.select().from(buchungen).where(eq(buchungen.id, id)).for("update");
    if (!b) throw new BuchungFehler("Diese Buchung gibt es nicht mehr.");
    if (!kannWechseln(b.status, a.nach))
      throw new BuchungFehler(
        `Eine Buchung im Status „${STATUS_NAMEN[b.status]}“ kann nicht „${STATUS_NAMEN[a.nach]}“ werden.`,
      );

    let storno: StornoErgebnis | undefined;
    const werte: Partial<typeof buchungen.$inferInsert> = { status: a.nach, updatedAt: jetzt };
    if (a.nach === "bestaetigt") werte.haltenBis = null;
    if (a.nach === "storniert") {
      storno = stornoGebuehr({
        beginn: b.beginn,
        jetzt,
        summeCent: centAusBetrag(b.summe),
        bezahltCent: b.status === "bestaetigt" ? centAusBetrag(b.anzahlung) : 0,
        durch: a.durch,
      });
      Object.assign(werte, {
        storniertAm: jetzt,
        stornoGebuehr: betragAusCent(storno.gebuehrCent),
        stornoGrund: a.grund ?? null,
      });
    }
    await tx.update(buchungen).set(werte).where(eq(buchungen.id, id));
    if (!belegt(a.nach)) {
      await tx
        .update(belegungen)
        .set({ aktiv: false, updatedAt: jetzt })
        .where(eq(belegungen.buchungId, id));
    }
    await writeAudit(tx, {
      actor: akteur,
      action: a.nach === "storniert" ? "buchung.storniert" : "buchung.status",
      target: { type: "buchung", id },
      details: {
        nummer: b.nummer,
        von: b.status,
        nach: a.nach,
        ...(storno
          ? { gebuehrCent: storno.gebuehrCent, durch: "durch" in a ? a.durch : null }
          : {}),
      },
    });
    return { status: a.nach, storno };
  });
}

/** The note for the performer: „dog in the yard“, „door code 1234“. */
export async function speichereNotiz(id: number, notiz: string | null, client: Db | Tx = db) {
  const text = notiz?.trim() || null;
  if (text && text.length > 5000) throw new BuchungFehler("Die Notiz ist zu lang.", "notizIntern");
  await client
    .update(buchungen)
    .set({ notizIntern: text, updatedAt: new Date() })
    .where(eq(buchungen.id, id));
}

/** Bookings whose party lies in [von, bis): confirmed, closed and cancelled ones (with their fee). */
export async function exportZeilen(
  z: { von: Date; bis: Date },
  client: Db | Tx = db,
): Promise<ExportZeile[]> {
  const rows = await client
    .select({
      beginn: buchungen.beginn,
      nummer: buchungen.nummer,
      status: buchungen.status,
      kunde: buchungen.kontaktName,
      ort: staedte.name,
      ortFrei: buchungen.ort,
      summe: buchungen.summe,
      anzahlung: buchungen.anzahlung,
      stornoGebuehr: buchungen.stornoGebuehr,
      zahlungsart: buchungen.zahlungsart,
    })
    .from(buchungen)
    .leftJoin(staedte, eq(staedte.id, buchungen.stadtId))
    .where(
      and(
        gte(buchungen.beginn, z.von),
        lt(buchungen.beginn, z.bis),
        inArray(buchungen.status, ["bestaetigt", "abgeschlossen", "storniert"]),
      ),
    )
    .orderBy(asc(buchungen.beginn));
  return rows.map((r) => ({
    datum: berlinTag(r.beginn),
    uhrzeit: berlinUhrzeit(r.beginn),
    nummer: r.nummer,
    status: r.status,
    kunde: r.kunde,
    ort: r.ort ?? r.ortFrei ?? "",
    summe: r.summe ?? "",
    anzahlung: r.anzahlung ?? "",
    stornogebuehr: r.stornoGebuehr ?? "",
    zahlungsart: r.zahlungsart ?? "",
  }));
}
