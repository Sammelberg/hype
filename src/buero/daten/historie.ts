// The customer's history: notes, calls, mails and meetings written by hand, and — beside them —
// what happened with the customer's documents, read from the documents themselves. Plus the
// Wiedervorlagen: what is to be picked up again on a day.
import { and, asc, desc, eq, isNotNull, isNull, lte, sql } from "drizzle-orm";

import { db } from "../../cms/db/client";
import {
  angebote,
  auftraege,
  kunden,
  kundenHistorie,
  mahnungen,
  rechnungen,
  vertraege,
  wiedervorlagen,
  zahlungen,
} from "../db/schema";
import { heute } from "../logik/ablauf";
import { mahnTitel } from "../logik/forderung";
import { centAusBetrag, euro } from "../logik/geld";
import {
  type HistorieInput,
  HistorieSchema,
  type WiedervorlageInput,
  WiedervorlageSchema,
} from "../logik/typen";
import { BueroError } from "./basis";
import { kundenName } from "./kunden";

export type HistorieEintrag = typeof kundenHistorie.$inferSelect;
export type Wiedervorlage = typeof wiedervorlagen.$inferSelect;

export async function addHistorie(raw: HistorieInput, autor: string | null) {
  const input = HistorieSchema.parse(raw);
  const [row] = await db
    .insert(kundenHistorie)
    .values({ ...input, autor })
    .returning({ id: kundenHistorie.id });
  return row!.id;
}

export async function deleteHistorie(id: number) {
  await db.delete(kundenHistorie).where(eq(kundenHistorie.id, id));
}

export type Ereignis = {
  key: string;
  /** ISO day or timestamp; sorted newest first. */
  am: string;
  art: "notiz" | "anruf" | "email" | "termin" | "dokument" | "geld" | "mahnung";
  titel: string;
  text?: string | null;
  href?: string;
  autor?: string | null;
  /** The note's id: only hand-written entries can be deleted. */
  notizId?: number;
};

const iso = (d: Date) => d.toISOString();

/** Everything that happened with a customer, newest first. */
export async function zeitleiste(kundeId: number): Promise<Ereignis[]> {
  const [notizen, a, an, v, r, z, m] = await Promise.all([
    db.select().from(kundenHistorie).where(eq(kundenHistorie.kundeId, kundeId)),
    db.select().from(auftraege).where(eq(auftraege.kundeId, kundeId)),
    db.select().from(angebote).where(eq(angebote.kundeId, kundeId)),
    db.select().from(vertraege).where(eq(vertraege.kundeId, kundeId)),
    db.select().from(rechnungen).where(eq(rechnungen.kundeId, kundeId)),
    db
      .select({ zahlung: zahlungen, nummer: rechnungen.nummer })
      .from(zahlungen)
      .innerJoin(rechnungen, eq(rechnungen.id, zahlungen.rechnungId))
      .where(eq(rechnungen.kundeId, kundeId)),
    db
      .select({ mahnung: mahnungen, nummer: rechnungen.nummer })
      .from(mahnungen)
      .innerJoin(rechnungen, eq(rechnungen.id, mahnungen.rechnungId))
      .where(eq(rechnungen.kundeId, kundeId)),
  ]);
  const liste: Ereignis[] = [
    ...notizen.map((n) => ({
      key: `n${n.id}`,
      am: iso(n.am),
      art: n.art,
      titel: { notiz: "Notiz", anruf: "Anruf", email: "E-Mail", termin: "Termin" }[n.art],
      text: n.text,
      autor: n.autor,
      notizId: n.id,
    })),
    ...a.map((x) => ({
      key: `a${x.id}`,
      am: iso(x.createdAt),
      art: "dokument" as const,
      titel: `Auftrag ${x.nummer} angelegt`,
      text: x.titel,
      href: `/admin/auftraege/${x.id}`,
    })),
    ...an.flatMap((x) => [
      ...(x.versendetAm
        ? [
            {
              key: `an${x.id}`,
              am: x.versendetAm,
              art: "dokument" as const,
              titel: `Angebot ${x.nummer} versendet`,
              text: x.titel,
              href: `/admin/angebote/${x.id}`,
            },
          ]
        : []),
      ...(x.entschiedenAm
        ? [
            {
              key: `ane${x.id}`,
              am: x.entschiedenAm,
              art: "dokument" as const,
              titel: `Angebot ${x.nummer} ${x.status === "angenommen" ? "angenommen" : "abgelehnt"}`,
              href: `/admin/angebote/${x.id}`,
            },
          ]
        : []),
    ]),
    ...v.flatMap((x) => [
      {
        key: `v${x.id}`,
        am: x.unterzeichnetAm ?? iso(x.createdAt),
        art: "dokument" as const,
        titel: x.unterzeichnetAm
          ? `Vertrag ${x.nummer} unterzeichnet`
          : `Vertrag ${x.nummer} angelegt`,
        text: x.titel,
        href: `/admin/vertraege/${x.id}`,
      },
      ...(x.gekuendigtAm
        ? [
            {
              key: `vk${x.id}`,
              am: x.gekuendigtAm,
              art: "dokument" as const,
              titel: `Vertrag ${x.nummer} gekündigt`,
              text: x.endetAm ? `endet am ${x.endetAm.split("-").reverse().join(".")}` : null,
              href: `/admin/vertraege/${x.id}`,
            },
          ]
        : []),
    ]),
    ...r
      .filter((x) => x.ausgestelltAm)
      .map((x) => ({
        key: `r${x.id}`,
        am: x.ausgestelltAm!,
        art: "dokument" as const,
        titel: `${x.typ === "storno" ? "Storno" : "Rechnung"} ${x.nummer} gestellt`,
        text: euro(centAusBetrag(x.summeBrutto)),
        href: `/admin/rechnungen/${x.id}`,
      })),
    ...r
      .filter(
        (x) =>
          x.status === "bezahlt" && x.bezahltAm && !z.some((p) => p.zahlung.rechnungId === x.id),
      )
      .map((x) => ({
        key: `rb${x.id}`,
        am: x.bezahltAm!,
        art: "geld" as const,
        titel: `Rechnung ${x.nummer} bezahlt`,
        text: euro(centAusBetrag(x.summeBrutto)),
        href: `/admin/rechnungen/${x.id}`,
      })),
    ...z.map(({ zahlung, nummer }) => ({
      key: `z${zahlung.id}`,
      am: zahlung.am,
      art: "geld" as const,
      titel: `Zahlung auf ${nummer}`,
      text: euro(centAusBetrag(zahlung.betrag)),
      href: `/admin/rechnungen/${zahlung.rechnungId}`,
    })),
    ...m.map(({ mahnung, nummer }) => ({
      key: `m${mahnung.id}`,
      am: mahnung.am,
      art: "mahnung" as const,
      titel: `${mahnTitel(mahnung.stufe)} zu ${nummer}`,
      text: `${euro(centAusBetrag(mahnung.gesamt))} bis ${mahnung.frist.split("-").reverse().join(".")}`,
      href: `/admin/rechnungen/${mahnung.rechnungId}`,
    })),
  ];
  return liste.sort((x, y) => y.am.localeCompare(x.am));
}

// ---------------------------------------------------------------------------------------------
// Wiedervorlagen

export async function createWiedervorlage(raw: WiedervorlageInput) {
  const input = WiedervorlageSchema.parse(raw);
  const [row] = await db.insert(wiedervorlagen).values(input).returning({ id: wiedervorlagen.id });
  return row!.id;
}

export async function erledigeWiedervorlage(id: number, erledigt: boolean) {
  const [row] = await db
    .update(wiedervorlagen)
    .set({ erledigtAm: erledigt ? new Date() : null })
    .where(eq(wiedervorlagen.id, id))
    .returning({ id: wiedervorlagen.id });
  if (!row) throw new BueroError("Die Wiedervorlage gibt es nicht mehr.");
}

export async function verschiebeWiedervorlage(id: number, faelligAm: string) {
  await db.update(wiedervorlagen).set({ faelligAm }).where(eq(wiedervorlagen.id, id));
}

export async function deleteWiedervorlage(id: number) {
  await db.delete(wiedervorlagen).where(eq(wiedervorlagen.id, id));
}

export type WiedervorlageZeile = Wiedervorlage & { kundeName: string | null };

/** Open ones (due first), optionally of one customer or only those due by a day. */
export async function listWiedervorlagen({
  kundeId,
  bis,
  erledigt = false,
}: { kundeId?: number; bis?: string; erledigt?: boolean } = {}): Promise<WiedervorlageZeile[]> {
  const rows = await db
    .select({ w: wiedervorlagen, kunde: kunden })
    .from(wiedervorlagen)
    .leftJoin(kunden, eq(kunden.id, wiedervorlagen.kundeId))
    .where(
      and(
        erledigt ? isNotNull(wiedervorlagen.erledigtAm) : isNull(wiedervorlagen.erledigtAm),
        kundeId ? eq(wiedervorlagen.kundeId, kundeId) : undefined,
        bis ? lte(wiedervorlagen.faelligAm, bis) : undefined,
      ),
    )
    .orderBy(
      erledigt ? desc(wiedervorlagen.erledigtAm) : asc(wiedervorlagen.faelligAm),
      asc(wiedervorlagen.id),
    )
    .limit(erledigt ? 50 : 500);
  return rows.map((r) => ({ ...r.w, kundeName: r.kunde ? kundenName(r.kunde) : null }));
}

export async function zaehleFaelligeWiedervorlagen(tag: string = heute()) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(wiedervorlagen)
    .where(and(isNull(wiedervorlagen.erledigtAm), lte(wiedervorlagen.faelligAm, tag)));
  return row?.n ?? 0;
}
