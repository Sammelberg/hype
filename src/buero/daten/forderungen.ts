// What issued invoices still claim: payments against them, the reminders written, and the open
// items across all customers. The rules are logik/forderung.ts; migration 0008 keeps payments to
// issued invoices and Mahnungen unchanged once written.
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db, type Db, type Tx } from "../../cms/db/client";
import { kunden, mahnungen, rechnungen, zahlungen } from "../db/schema";
import { heute } from "../logik/ablauf";
import {
  mahnungVorschlag,
  naechsteMahnstufe,
  offenerBetrag,
  tageZwischen,
} from "../logik/forderung";
import { betragAusCent, centAusBetrag } from "../logik/geld";
import { type MahnungInput, MahnungSchema, type ZahlungInput, ZahlungSchema } from "../logik/typen";
import { BueroError } from "./basis";
import { getFirma } from "./firma";
import { kundenName } from "./kunden";

export type Zahlung = typeof zahlungen.$inferSelect;
export type Mahnung = typeof mahnungen.$inferSelect;

const cent = (zahl: number) => Math.round(zahl * 100);

/**
 * What is still open on an invoice. One marked paid before payments were recorded (or paid in
 * full) is open by nothing.
 */
export function offenVon(
  r: Pick<typeof rechnungen.$inferSelect, "status" | "summeBrutto">,
  z: Zahlung[],
) {
  if (r.status === "bezahlt" && z.length === 0) return 0;
  if (r.status !== "gestellt" && r.status !== "bezahlt") return 0;
  return offenerBetrag(
    centAusBetrag(r.summeBrutto),
    z.map((x) => centAusBetrag(x.betrag)),
  );
}

export async function forderungVon(rechnungId: number, client: Db | Tx = db) {
  const [z, m] = await Promise.all([
    client
      .select()
      .from(zahlungen)
      .where(eq(zahlungen.rechnungId, rechnungId))
      .orderBy(asc(zahlungen.am), asc(zahlungen.id)),
    client
      .select()
      .from(mahnungen)
      .where(eq(mahnungen.rechnungId, rechnungId))
      .orderBy(asc(mahnungen.am), asc(mahnungen.id)),
  ]);
  return { zahlungen: z, mahnungen: m };
}

async function gesperrteRechnung(tx: Tx, id: number) {
  const [r] = await tx.select().from(rechnungen).where(eq(rechnungen.id, id)).for("update");
  if (!r) throw new BueroError("Die Rechnung gibt es nicht mehr.");
  return r;
}

// A payment: once the payments cover the gross, the invoice is paid, on the day of the last one.
export async function erfasseZahlung(raw: ZahlungInput, client: Db | Tx = db) {
  const input = ZahlungSchema.parse(raw);
  return client.transaction(async (tx) => {
    const r = await gesperrteRechnung(tx, input.rechnungId);
    if (r.typ !== "rechnung" || (r.status !== "gestellt" && r.status !== "bezahlt"))
      throw new BueroError("Zahlungen gehören zu einer gestellten Rechnung.");
    const bisher = await tx.select().from(zahlungen).where(eq(zahlungen.rechnungId, r.id));
    if (r.status === "bezahlt" && offenVon(r, bisher) <= 0)
      throw new BueroError("Die Rechnung ist schon vollständig bezahlt.");
    const [neu] = await tx
      .insert(zahlungen)
      .values({
        rechnungId: r.id,
        betrag: betragAusCent(cent(input.betrag)),
        am: input.am,
        notiz: input.notiz,
      })
      .returning();
    const offen = offenVon(r, [...bisher, neu!]);
    if (offen <= 0 && r.status === "gestellt")
      await tx
        .update(rechnungen)
        .set({ status: "bezahlt", bezahltAm: input.am, updatedAt: new Date() })
        .where(eq(rechnungen.id, r.id));
    return { id: neu!.id, offen };
  });
}

// A payment entered by mistake goes again; a paid invoice it leaves open is open again.
export async function entferneZahlung(id: number, client: Db | Tx = db) {
  return client.transaction(async (tx) => {
    const [z] = await tx.select().from(zahlungen).where(eq(zahlungen.id, id));
    if (!z) throw new BueroError("Die Zahlung gibt es nicht mehr.");
    const r = await gesperrteRechnung(tx, z.rechnungId);
    if (r.status === "storniert")
      throw new BueroError("Zahlungen einer stornierten Rechnung bleiben, wie sie sind.");
    await tx.delete(zahlungen).where(eq(zahlungen.id, id));
    const rest = await tx.select().from(zahlungen).where(eq(zahlungen.rechnungId, r.id));
    if (r.status === "bezahlt" && offenVon({ ...r, status: "gestellt" }, rest) > 0)
      await tx
        .update(rechnungen)
        .set({ status: "gestellt", bezahltAm: null, updatedAt: new Date() })
        .where(eq(rechnungen.id, r.id));
    return { rechnungId: r.id, betrag: z.betrag };
  });
}

/** The next reminder for an invoice as proposed on `am`; null when nothing can be reminded. */
export async function mahnungsvorschlag(rechnungId: number, am: string = heute()) {
  const [[row], { firma }] = await Promise.all([
    db
      .select({ rechnung: rechnungen, kunde: kunden })
      .from(rechnungen)
      .innerJoin(kunden, eq(kunden.id, rechnungen.kundeId))
      .where(eq(rechnungen.id, rechnungId)),
    getFirma(),
  ]);
  if (!row) return null;
  const r = row.rechnung;
  if (r.typ !== "rechnung" || r.status !== "gestellt" || !r.ausgestelltAm || !r.faelligAm)
    return null;
  const { zahlungen: z, mahnungen: m } = await forderungVon(rechnungId);
  const stufe = naechsteMahnstufe(m.map((x) => x.stufe));
  if (stufe === null) return { vorschlag: null, letzteStufe: true, basiszinsFehlt: false } as const;
  const vorschlag = mahnungVorschlag({
    brutto: centAusBetrag(r.summeBrutto),
    zahlungen: z.map((x) => centAusBetrag(x.betrag)),
    ausgestelltAm: r.ausgestelltAm,
    faelligAm: r.faelligAm,
    privat: r.empfaenger?.privat ?? row.kunde.art === "privat",
    basiszins: firma.basiszinssatz ?? 0,
    am,
    frueher: m.map((x) => ({ stufe: x.stufe, am: x.am, pauschale: centAusBetrag(x.pauschale) })),
  });
  return {
    vorschlag,
    letzteStufe: false,
    // Interest needs the owner's base rate; without it the proposal charges none.
    basiszinsFehlt: firma.basiszinssatz === null && vorschlag.verzugSeit !== null,
  } as const;
}

// Writes the reminder as the owner settled it. Step and open amount are the server's, not the
// form's: they follow from what was written and paid before.
export async function schreibeMahnung(raw: MahnungInput, client: Db | Tx = db) {
  const input = MahnungSchema.parse(raw);
  return client.transaction(async (tx) => {
    const r = await gesperrteRechnung(tx, input.rechnungId);
    if (r.typ !== "rechnung" || r.status !== "gestellt")
      throw new BueroError("Gemahnt wird nur eine gestellte, offene Rechnung.");
    if (r.faelligAm && input.am <= r.faelligAm)
      throw new BueroError("Gemahnt wird erst nach dem Fälligkeitstag.", "am");
    if (input.frist <= input.am)
      throw new BueroError("Die neue Frist liegt nach dem Datum der Mahnung.", "frist");
    const { zahlungen: z, mahnungen: m } = await forderungVon(r.id, tx);
    const stufe = naechsteMahnstufe(m.map((x) => x.stufe));
    if (stufe === null)
      throw new BueroError(
        "Die 2. Mahnung war die letzte. Danach helfen ein gerichtlicher Mahnbescheid oder ein Anwalt.",
      );
    const offen = offenVon(r, z);
    if (offen <= 0) throw new BueroError("Auf dieser Rechnung ist nichts mehr offen.");
    const zinsen = cent(input.zinsen);
    const pauschale = cent(input.pauschale);
    const gebuehr = cent(input.gebuehr);
    const vorschlag = await mahnungsvorschlagIn(tx, r, z, m, input.am);
    const [neu] = await tx
      .insert(mahnungen)
      .values({
        rechnungId: r.id,
        stufe,
        am: input.am,
        frist: input.frist,
        offen: betragAusCent(offen),
        verzugSeit: vorschlag?.verzugSeit ?? null,
        zinssatz: input.zinssatz.toFixed(2),
        zinsen: betragAusCent(zinsen),
        pauschale: betragAusCent(pauschale),
        gebuehr: betragAusCent(gebuehr),
        gesamt: betragAusCent(offen + zinsen + pauschale + gebuehr),
        text: input.text,
      })
      .returning({ id: mahnungen.id });
    return { id: neu!.id, stufe };
  });
}

async function mahnungsvorschlagIn(
  tx: Tx,
  r: typeof rechnungen.$inferSelect,
  z: Zahlung[],
  m: Mahnung[],
  am: string,
) {
  if (!r.ausgestelltAm || !r.faelligAm) return null;
  const { firma } = await getFirma(tx);
  return mahnungVorschlag({
    brutto: centAusBetrag(r.summeBrutto),
    zahlungen: z.map((x) => centAusBetrag(x.betrag)),
    ausgestelltAm: r.ausgestelltAm,
    faelligAm: r.faelligAm,
    privat: r.empfaenger?.privat ?? false,
    basiszins: firma.basiszinssatz ?? 0,
    am,
    frueher: m.map((x) => ({ stufe: x.stufe, am: x.am, pauschale: centAusBetrag(x.pauschale) })),
  });
}

export async function getMahnung(id: number) {
  const [row] = await db
    .select({ mahnung: mahnungen, rechnung: rechnungen })
    .from(mahnungen)
    .innerJoin(rechnungen, eq(rechnungen.id, mahnungen.rechnungId))
    .where(eq(mahnungen.id, id));
  if (!row) return null;
  const { zahlungen: z, mahnungen: alle } = await forderungVon(row.rechnung.id);
  // The step before, which the letter refers to.
  const vorige = alle.filter((x) => x.stufe < row.mahnung.stufe).at(-1) ?? null;
  return { ...row, zahlungen: z, vorigeAm: vorige?.am ?? null };
}

export type OffenerPosten = {
  id: number;
  nummer: string;
  kundeId: number;
  kundeName: string;
  brutto: number;
  offen: number;
  ausgestelltAm: string;
  faelligAm: string;
  tageUeberfaellig: number;
  mahnstufe: number | null;
  letzteFrist: string | null;
};

/** Every issued invoice with something open, the most overdue first. */
export async function offenePosten(stichtag: string = heute()): Promise<OffenerPosten[]> {
  const rows = await db
    .select({ rechnung: rechnungen, kunde: kunden })
    .from(rechnungen)
    .innerJoin(kunden, eq(kunden.id, rechnungen.kundeId))
    .where(and(eq(rechnungen.typ, "rechnung"), eq(rechnungen.status, "gestellt")))
    .orderBy(asc(rechnungen.faelligAm));
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.rechnung.id);
  const [z, m] = await Promise.all([
    db.select().from(zahlungen).where(inArray(zahlungen.rechnungId, ids)),
    db
      .select()
      .from(mahnungen)
      .where(inArray(mahnungen.rechnungId, ids))
      .orderBy(desc(mahnungen.stufe)),
  ]);
  return rows
    .map(({ rechnung: r, kunde }) => {
      const eigene = z.filter((x) => x.rechnungId === r.id);
      const letzte = m.find((x) => x.rechnungId === r.id);
      return {
        id: r.id,
        nummer: r.nummer!,
        kundeId: kunde.id,
        kundeName: kundenName(kunde),
        brutto: centAusBetrag(r.summeBrutto),
        offen: offenVon(r, eigene),
        ausgestelltAm: r.ausgestelltAm!,
        faelligAm: r.faelligAm!,
        tageUeberfaellig: r.faelligAm! < stichtag ? tageZwischen(r.faelligAm!, stichtag) : 0,
        mahnstufe: letzte?.stufe ?? null,
        letzteFrist: letzte?.frist ?? null,
      };
    })
    .filter((p) => p.offen > 0)
    .sort((a, b) => b.tageUeberfaellig - a.tageUeberfaellig);
}

/** Money that came in per month (payments, and invoices marked paid before payments existed). */
export async function eingaengeNachMonat(seit: string) {
  const rows = await db.execute<{ monat: string; summe: string }>(sql`
    select to_char(am, 'YYYY-MM') as monat, sum(betrag)::text as summe from (
      select z.am, z.betrag from ${zahlungen} z where z.am >= ${seit}
      union all
      select r.bezahlt_am as am, r.summe_brutto as betrag from ${rechnungen} r
        where r.status = 'bezahlt' and r.bezahlt_am >= ${seit}
          and not exists (select 1 from ${zahlungen} z2 where z2.rechnung_id = r.id)
    ) e group by 1 order by 1`);
  return rows.rows.map((r) => ({ monat: r.monat, cent: centAusBetrag(r.summe) }));
}
