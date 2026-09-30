// Customers: the card the office keeps per customer, and what hangs off it.
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { db, type Db, type Tx } from "../../cms/db/client";
import { auftraege, kunden, rechnungen, vertraege } from "../db/schema";
import type { Empfaenger } from "../logik/typen";
import { type KundeInput, KundeSchema } from "../logik/typen";
import { BueroError, naechsteNummer } from "./basis";

export type Kunde = typeof kunden.$inferSelect;

/** How the customer is addressed: the company, or the person. */
export const kundenName = (k: Pick<Kunde, "art" | "firma" | "name">) =>
  (k.art === "firma" ? k.firma || k.name : k.name || k.firma) ?? "Ohne Namen";

/** The recipient block an invoice freezes when it is issued. */
export const empfaengerVon = (k: Kunde): Empfaenger => ({
  name: kundenName(k),
  firma: k.art === "firma" ? k.firma : null,
  strasse: k.strasse,
  plz: k.plz,
  ort: k.ort,
  land: k.land,
  ustId: k.ustId,
  leitwegId: k.leitwegId,
  email: k.email,
  privat: k.art === "privat",
});

const spalten = (k: KundeInput) => ({
  art: k.art,
  firma: k.firma,
  name: k.name,
  email: k.email,
  telefon: k.telefon,
  strasse: k.strasse,
  plz: k.plz,
  ort: k.ort,
  land: k.land,
  ustId: k.ustId,
  leitwegId: k.leitwegId,
  zahlungszielTage: k.zahlungszielTage,
  ansprechpartner: k.ansprechpartner,
  notizen: k.notizen,
});

export type KundeZeile = Kunde & {
  auftraegeAktiv: number;
  offenBrutto: string | null;
  umsatzBrutto: string | null;
};

// The list: active customers first by name, with what is running and what is still owed.
export async function listKunden({ archiviert = false } = {}): Promise<KundeZeile[]> {
  const rows = await db
    .select({
      kunde: kunden,
      auftraegeAktiv: sql<number>`(select count(*)::int from ${auftraege} a where a.kunde_id = ${kunden.id} and a.status in ('beauftragt','in_arbeit','abgenommen'))`,
      offenBrutto: sql<
        string | null
      >`(select sum(r.summe_brutto) from ${rechnungen} r where r.kunde_id = ${kunden.id} and r.typ = 'rechnung' and r.status = 'gestellt')`,
      umsatzBrutto: sql<
        string | null
      >`(select sum(r.summe_brutto) from ${rechnungen} r where r.kunde_id = ${kunden.id} and r.typ = 'rechnung' and r.status in ('gestellt','bezahlt'))`,
    })
    .from(kunden)
    .where(archiviert ? sql`${kunden.archiviertAm} is not null` : isNull(kunden.archiviertAm))
    .orderBy(asc(sql`lower(coalesce(${kunden.firma}, ${kunden.name}))`));
  return rows.map((r) => ({
    ...r.kunde,
    auftraegeAktiv: r.auftraegeAktiv,
    offenBrutto: r.offenBrutto,
    umsatzBrutto: r.umsatzBrutto,
  }));
}

export async function getKunde(id: number) {
  const [kunde] = await db.select().from(kunden).where(eq(kunden.id, id)).limit(1);
  if (!kunde) return null;
  const [a, v, r] = await Promise.all([
    db.select().from(auftraege).where(eq(auftraege.kundeId, id)).orderBy(desc(auftraege.createdAt)),
    db.select().from(vertraege).where(eq(vertraege.kundeId, id)).orderBy(desc(vertraege.beginn)),
    db
      .select()
      .from(rechnungen)
      .where(eq(rechnungen.kundeId, id))
      .orderBy(desc(rechnungen.createdAt)),
  ]);
  return { kunde, auftraege: a, vertraege: v, rechnungen: r };
}

/** A customer as the pickers offer it: enough to recognise, address, and invoice. */
export const kundeOption = (k: Kunde) => ({
  id: k.id,
  nummer: k.nummer,
  name: kundenName(k),
  ort: k.ort,
  email: k.email,
  zahlungszielTage: k.zahlungszielTage,
  empfaenger: empfaengerVon(k),
});
export type KundeOption = ReturnType<typeof kundeOption>;

// Every active customer for the pickers, plus the given one even if archived (a document keeps
// its customer).
export async function listKundenAuswahl(auch?: number): Promise<KundeOption[]> {
  const rows = await db
    .select()
    .from(kunden)
    .where(
      auch
        ? sql`${kunden.archiviertAm} is null or ${kunden.id} = ${auch}`
        : isNull(kunden.archiviertAm),
    )
    .orderBy(asc(sql`lower(coalesce(${kunden.firma}, ${kunden.name}))`));
  return rows.map(kundeOption);
}

export async function getKundeOption(id: number) {
  const [k] = await db.select().from(kunden).where(eq(kunden.id, id)).limit(1);
  return k ? kundeOption(k) : null;
}

export async function createKunde(raw: KundeInput, client: Db | Tx = db) {
  const input = KundeSchema.parse(raw);
  return client.transaction(async (tx) => {
    const nummer = await naechsteNummer(tx, "KD", 0);
    const [row] = await tx
      .insert(kunden)
      .values({ nummer, ...spalten(input) })
      .returning({ id: kunden.id });
    return row!.id;
  });
}

export async function updateKunde(id: number, raw: KundeInput) {
  const input = KundeSchema.parse(raw);
  const [row] = await db
    .update(kunden)
    .set({ ...spalten(input), updatedAt: new Date() })
    .where(eq(kunden.id, id))
    .returning({ id: kunden.id });
  if (!row) throw new BueroError("Den Kunden gibt es nicht mehr.");
}

// Archived customers leave the lists; their documents stay. Not while something is still open.
export async function archiveKunde(id: number, archivieren: boolean) {
  if (archivieren) {
    const [offen] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(rechnungen)
      .where(and(eq(rechnungen.kundeId, id), inArray(rechnungen.status, ["entwurf", "gestellt"])));
    const [laufend] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(auftraege)
      .where(
        and(
          eq(auftraege.kundeId, id),
          inArray(auftraege.status, ["beauftragt", "in_arbeit", "abgenommen"]),
        ),
      );
    if ((offen?.n ?? 0) > 0 || (laufend?.n ?? 0) > 0)
      throw new BueroError(
        "Der Kunde hat noch offene Rechnungen oder laufende Aufträge. Schließen Sie diese zuerst ab.",
      );
  }
  await db
    .update(kunden)
    .set({ archiviertAm: archivieren ? new Date() : null, updatedAt: new Date() })
    .where(eq(kunden.id, id));
}

// Deleting is for mistakes: only a customer without any document. Otherwise archive.
export async function deleteKunde(id: number) {
  const k = await getKunde(id);
  if (!k) return;
  if (k.auftraege.length || k.vertraege.length || k.rechnungen.length)
    throw new BueroError(
      "Kunden mit Aufträgen, Verträgen oder Rechnungen werden archiviert, nicht gelöscht.",
    );
  await db.delete(kunden).where(eq(kunden.id, id));
}
