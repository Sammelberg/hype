// Orders: what a customer commissioned, from the offer to the invoice.
import { desc, eq } from "drizzle-orm";

import { db } from "../../cms/db/client";
import { auftraege, kunden, rechnungen, vertraege } from "../db/schema";
import { heute, jahr, kannWechseln, type StatusVon } from "../logik/ablauf";
import { betragAusCent } from "../logik/geld";
import { type AuftragInput, AuftragSchema } from "../logik/typen";
import { BueroError, naechsteNummer } from "./basis";
import { kundenName } from "./kunden";

export type Auftrag = typeof auftraege.$inferSelect;
export type AuftragStatus = StatusVon<"auftrag">;

const spalten = (a: AuftragInput) => ({
  kundeId: a.kundeId,
  titel: a.titel,
  beschreibung: a.beschreibung,
  betragNetto: a.betragNetto === null ? null : betragAusCent(Math.round(a.betragNetto * 100)),
  leistungVon: a.leistungVon,
  leistungBis: a.leistungBis,
  notizen: a.notizen,
});

export async function listAuftraege() {
  const rows = await db
    .select({ auftrag: auftraege, kunde: kunden })
    .from(auftraege)
    .innerJoin(kunden, eq(kunden.id, auftraege.kundeId))
    .orderBy(desc(auftraege.updatedAt));
  return rows.map((r) => ({ ...r.auftrag, kundeName: kundenName(r.kunde) }));
}

export async function getAuftrag(id: number) {
  const [row] = await db
    .select({ auftrag: auftraege, kunde: kunden })
    .from(auftraege)
    .innerJoin(kunden, eq(kunden.id, auftraege.kundeId))
    .where(eq(auftraege.id, id))
    .limit(1);
  if (!row) return null;
  const [r, v] = await Promise.all([
    db
      .select()
      .from(rechnungen)
      .where(eq(rechnungen.auftragId, id))
      .orderBy(desc(rechnungen.createdAt)),
    db.select().from(vertraege).where(eq(vertraege.auftragId, id)),
  ]);
  return { auftrag: row.auftrag, kunde: row.kunde, rechnungen: r, vertraege: v };
}

export async function createAuftrag(raw: AuftragInput) {
  const input = AuftragSchema.parse(raw);
  return db.transaction(async (tx) => {
    const nummer = await naechsteNummer(tx, "AU", jahr(heute()));
    const [row] = await tx
      .insert(auftraege)
      .values({ nummer, ...spalten(input) })
      .returning({ id: auftraege.id });
    return row!.id;
  });
}

export async function updateAuftrag(id: number, raw: AuftragInput) {
  const input = AuftragSchema.parse(raw);
  const [row] = await db
    .update(auftraege)
    .set({ ...spalten(input), updatedAt: new Date() })
    .where(eq(auftraege.id, id))
    .returning({ id: auftraege.id });
  if (!row) throw new BueroError("Den Auftrag gibt es nicht mehr.");
}

// A step in the order's life; commissioning and acceptance are dated the day they happen.
export async function setAuftragStatus(id: number, nach: AuftragStatus) {
  const [a] = await db.select().from(auftraege).where(eq(auftraege.id, id)).limit(1);
  if (!a) throw new BueroError("Den Auftrag gibt es nicht mehr.");
  if (!kannWechseln("auftrag", a.status, nach))
    throw new BueroError("Dieser Schritt passt nicht zum Stand des Auftrags.");
  await db
    .update(auftraege)
    .set({
      status: nach,
      ...(nach === "beauftragt" && !a.beauftragtAm ? { beauftragtAm: heute() } : {}),
      ...(nach === "abgenommen" && !a.abgenommenAm ? { abgenommenAm: heute() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(auftraege.id, id));
}

// Only an offer that led nowhere, or a cancelled order without invoices, can go.
export async function deleteAuftrag(id: number) {
  const found = await getAuftrag(id);
  if (!found) return;
  if (!["angebot", "storniert"].includes(found.auftrag.status) || found.rechnungen.length > 0)
    throw new BueroError(
      "Nur Angebote und stornierte Aufträge ohne Rechnung können gelöscht werden.",
    );
  await db.delete(auftraege).where(eq(auftraege.id, id));
}

// For the pickers: every order with what an invoice or a contract takes from it.
export async function listAuftraegeAuswahl() {
  const rows = await db
    .select({
      id: auftraege.id,
      nummer: auftraege.nummer,
      titel: auftraege.titel,
      kundeId: auftraege.kundeId,
      status: auftraege.status,
      betragNetto: auftraege.betragNetto,
      leistungVon: auftraege.leistungVon,
      leistungBis: auftraege.leistungBis,
    })
    .from(auftraege)
    .orderBy(desc(auftraege.createdAt));
  return rows.map((a) => ({
    ...a,
    betragNetto: a.betragNetto === null ? null : Number(a.betragNetto),
  }));
}
export type AuftragOption = Awaited<ReturnType<typeof listAuftraegeAuswahl>>[number];
