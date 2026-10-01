// The calendar: the owner's Termine, and beside them every date the office and the site already
// know — Wiedervorlagen, invoices falling due, Mahnfristen, offers running out, the last day to
// give notice, contract ends, scheduled publishing. Read for a span of German days.
import { and, asc, eq, gte, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm";

import { db } from "../../cms/db/client";
import { pages, projekte } from "../../cms/db/schema";
import {
  angebote,
  kunden,
  mahnungen,
  rechnungen,
  termine,
  vertraege,
  wiedervorlagen,
} from "../db/schema";
import { heute, naechstesVertragsende } from "../logik/ablauf";
import { centAusBetrag, euro } from "../logik/geld";
import {
  berlinTag,
  berlinUhrzeit,
  berlinZeitpunkt,
  type KalenderEreignis,
} from "../logik/kalender";
import { mahnTitel } from "../logik/forderung";
import { type TerminInput, TerminSchema } from "../logik/typen";
import { BueroError } from "./basis";
import { kundenName } from "./kunden";

export type Termin = typeof termine.$inferSelect;

// ---------------------------------------------------------------------------------------------
// Termine

/** The form's German days and times as the instants the table keeps. */
function spalten(t: TerminInput) {
  if (t.ganztags)
    return {
      ganztags: true,
      beginn: berlinZeitpunkt(t.datum, "00:00"),
      ende: t.bisDatum && t.bisDatum > t.datum ? berlinZeitpunkt(t.bisDatum, "00:00") : null,
    };
  const bisTag = t.bisDatum ?? t.datum;
  return {
    ganztags: false,
    beginn: berlinZeitpunkt(t.datum, t.von!),
    ende: t.bis
      ? berlinZeitpunkt(bisTag, t.bis)
      : bisTag > t.datum
        ? berlinZeitpunkt(bisTag, "23:59")
        : null,
  };
}

/** A Termin back in the form's terms. */
export function terminEingabe(t: Termin): TerminInput {
  const bisTag = t.ende ? berlinTag(t.ende) : null;
  const datum = berlinTag(t.beginn);
  return {
    titel: t.titel,
    datum,
    bisDatum: bisTag && bisTag !== datum ? bisTag : null,
    ganztags: t.ganztags,
    von: t.ganztags ? null : berlinUhrzeit(t.beginn),
    bis: t.ganztags || !t.ende ? null : berlinUhrzeit(t.ende),
    ort: t.ort,
    notiz: t.notiz,
    kundeId: t.kundeId,
  };
}

export async function createTermin(raw: TerminInput) {
  const input = TerminSchema.parse(raw);
  const [row] = await db
    .insert(termine)
    .values({
      titel: input.titel,
      ort: input.ort,
      notiz: input.notiz,
      kundeId: input.kundeId,
      ...spalten(input),
    })
    .returning({ id: termine.id });
  return row!.id;
}

export async function updateTermin(id: number, raw: TerminInput) {
  const input = TerminSchema.parse(raw);
  const [row] = await db
    .update(termine)
    .set({
      titel: input.titel,
      ort: input.ort,
      notiz: input.notiz,
      kundeId: input.kundeId,
      ...spalten(input),
      updatedAt: new Date(),
    })
    .where(eq(termine.id, id))
    .returning({ id: termine.id });
  if (!row) throw new BueroError("Den Termin gibt es nicht mehr.");
}

export async function deleteTermin(id: number) {
  await db.delete(termine).where(eq(termine.id, id));
}

const terminEreignis = (t: Termin, kunde: string | null): KalenderEreignis => ({
  key: `t${t.id}`,
  art: "termin",
  titel: t.titel,
  von: berlinTag(t.beginn),
  bis: t.ende ? berlinTag(t.ende) : berlinTag(t.beginn),
  uhrzeit: t.ganztags ? null : berlinUhrzeit(t.beginn),
  bisUhrzeit: t.ganztags || !t.ende ? null : berlinUhrzeit(t.ende),
  ort: t.ort,
  notiz: t.notiz,
  kundeId: t.kundeId,
  kundeName: kunde,
  terminId: t.id,
});

/** Termine overlapping a span of German days, earliest first; optionally of one customer. */
export async function listTermine(von: string, bis: string, kundeId?: number) {
  const start = berlinZeitpunkt(von, "00:00");
  const ende = berlinZeitpunkt(bis, "23:59");
  const rows = await db
    .select({ termin: termine, kunde: kunden })
    .from(termine)
    .leftJoin(kunden, eq(kunden.id, termine.kundeId))
    .where(
      and(
        lte(termine.beginn, ende),
        sql`coalesce(${termine.ende}, ${termine.beginn}) >= ${start}`,
        kundeId ? eq(termine.kundeId, kundeId) : undefined,
      ),
    )
    .orderBy(asc(termine.beginn));
  return rows.map((r) => ({
    termin: r.termin,
    ereignis: terminEreignis(r.termin, r.kunde ? kundenName(r.kunde) : null),
  }));
}

// ---------------------------------------------------------------------------------------------
// Everything with a date

const datum = (iso: string) => iso.split("-").reverse().join(".");

export async function kalender(von: string, bis: string): Promise<KalenderEreignis[]> {
  const [ts, wv, faellig, mahn, an, vt, seiten, proj] = await Promise.all([
    listTermine(von, bis),
    db
      .select({ w: wiedervorlagen, kunde: kunden })
      .from(wiedervorlagen)
      .leftJoin(kunden, eq(kunden.id, wiedervorlagen.kundeId))
      .where(
        and(
          isNull(wiedervorlagen.erledigtAm),
          gte(wiedervorlagen.faelligAm, von),
          lte(wiedervorlagen.faelligAm, bis),
        ),
      ),
    db
      .select({ r: rechnungen, kunde: kunden })
      .from(rechnungen)
      .innerJoin(kunden, eq(kunden.id, rechnungen.kundeId))
      .where(
        and(
          eq(rechnungen.typ, "rechnung"),
          eq(rechnungen.status, "gestellt"),
          gte(rechnungen.faelligAm, von),
          lte(rechnungen.faelligAm, bis),
        ),
      ),
    db
      .select({ m: mahnungen, nummer: rechnungen.nummer, kunde: kunden })
      .from(mahnungen)
      .innerJoin(rechnungen, eq(rechnungen.id, mahnungen.rechnungId))
      .innerJoin(kunden, eq(kunden.id, rechnungen.kundeId))
      .where(
        and(
          eq(rechnungen.status, "gestellt"),
          gte(mahnungen.frist, von),
          lte(mahnungen.frist, bis),
        ),
      ),
    db
      .select({ a: angebote, kunde: kunden })
      .from(angebote)
      .innerJoin(kunden, eq(kunden.id, angebote.kundeId))
      .where(
        and(
          eq(angebote.status, "versendet"),
          gte(angebote.gueltigBis, von),
          lte(angebote.gueltigBis, bis),
        ),
      ),
    db
      .select({ v: vertraege, kunde: kunden })
      .from(vertraege)
      .innerJoin(kunden, eq(kunden.id, vertraege.kundeId))
      .where(inArray(vertraege.status, ["aktiv", "gekuendigt"])),
    db
      .select({ id: pages.id, title: pages.title, publishAt: pages.publishAt })
      .from(pages)
      .where(isNotNull(pages.publishAt)),
    db
      .select({ id: projekte.id, title: projekte.title, publishAt: projekte.publishAt })
      .from(projekte)
      .where(isNotNull(projekte.publishAt)),
  ]);

  const liste: KalenderEreignis[] = ts.map((t) => t.ereignis);
  for (const { w, kunde } of wv)
    liste.push({
      key: `w${w.id}`,
      art: "wiedervorlage",
      titel: w.titel,
      von: w.faelligAm,
      bis: w.faelligAm,
      uhrzeit: null,
      notiz: w.notiz,
      kundeId: w.kundeId,
      kundeName: kunde ? kundenName(kunde) : null,
      href: w.kundeId ? `/admin/kunden/${w.kundeId}` : "/admin/wiedervorlagen",
    });
  for (const { r, kunde } of faellig)
    liste.push({
      key: `r${r.id}`,
      art: "faellig",
      titel: `${r.nummer} fällig, ${euro(centAusBetrag(r.summeBrutto))}`,
      von: r.faelligAm!,
      bis: r.faelligAm!,
      uhrzeit: null,
      kundeId: kunde.id,
      kundeName: kundenName(kunde),
      href: `/admin/rechnungen/${r.id}`,
    });
  for (const { m, nummer, kunde } of mahn)
    liste.push({
      key: `m${m.id}`,
      art: "mahnfrist",
      titel: `Frist der ${mahnTitel(m.stufe)} zu ${nummer}`,
      von: m.frist,
      bis: m.frist,
      uhrzeit: null,
      kundeId: kunde.id,
      kundeName: kundenName(kunde),
      href: `/admin/rechnungen/${m.rechnungId}`,
    });
  for (const { a, kunde } of an)
    liste.push({
      key: `a${a.id}`,
      art: "angebot",
      titel: `Angebot ${a.nummer} gilt bis heute: ${a.titel}`,
      von: a.gueltigBis!,
      bis: a.gueltigBis!,
      uhrzeit: null,
      kundeId: kunde.id,
      kundeName: kundenName(kunde),
      href: `/admin/angebote/${a.id}`,
    });
  const tag = heute();
  for (const { v, kunde } of vt) {
    const ende = v.status === "aktiv" ? naechstesVertragsende(v, tag) : null;
    if (ende?.kuendigenBis && ende.kuendigenBis >= von && ende.kuendigenBis <= bis)
      liste.push({
        key: `k${v.id}`,
        art: "kuendigung",
        titel: `Letzter Tag zur Kündigung: ${v.titel} (endet ${datum(ende.ende)})`,
        von: ende.kuendigenBis,
        bis: ende.kuendigenBis,
        uhrzeit: null,
        kundeId: kunde.id,
        kundeName: kundenName(kunde),
        href: `/admin/vertraege/${v.id}`,
      });
    const endet = v.endetAm ?? (v.status === "aktiv" && !v.verlaengerungMonate ? ende?.ende : null);
    if (endet && endet >= von && endet <= bis)
      liste.push({
        key: `e${v.id}`,
        art: "vertragsende",
        titel: `Vertrag endet: ${v.titel}`,
        von: endet,
        bis: endet,
        uhrzeit: null,
        kundeId: kunde.id,
        kundeName: kundenName(kunde),
        href: `/admin/vertraege/${v.id}`,
      });
  }
  for (const [art, rows, pfad] of [
    ["Seite", seiten, "seiten"],
    ["Projekt", proj, "projekte"],
  ] as const)
    for (const d of rows) {
      const t = berlinTag(d.publishAt!);
      if (t < von || t > bis) continue;
      liste.push({
        key: `p${pfad}${d.id}`,
        art: "veroeffentlichung",
        titel: `${art} geht online: ${d.title}`,
        von: t,
        bis: t,
        uhrzeit: berlinUhrzeit(d.publishAt!),
        href: `/admin/${pfad}/${d.id}`,
      });
    }
  return liste;
}

/** Today's Termine, for the overview and the menu. */
export async function termineHeute(tag: string = heute()) {
  return (await listTermine(tag, tag)).map((t) => t.ereignis);
}

/** The next Termine of a customer, for the customer card. */
export async function naechsteTermine(kundeId: number, tag: string = heute()) {
  const rows = await db
    .select()
    .from(termine)
    .where(
      and(
        eq(termine.kundeId, kundeId),
        or(
          gte(termine.beginn, berlinZeitpunkt(tag, "00:00")),
          gte(termine.ende, berlinZeitpunkt(tag, "00:00")),
        ),
      ),
    )
    .orderBy(asc(termine.beginn))
    .limit(10);
  return rows.map((t) => ({ ereignis: terminEreignis(t, null), eingabe: terminEingabe(t) }));
}

export async function getTermin(id: number) {
  const [t] = await db.select().from(termine).where(eq(termine.id, id));
  return t ?? null;
}
