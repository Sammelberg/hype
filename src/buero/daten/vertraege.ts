// Contracts: what is agreed with a customer, how long it runs and when it can be ended.
import { desc, eq } from "drizzle-orm";

import { db } from "../../cms/db/client";
import { auftraege, kunden, rechnungen, vertraege } from "../db/schema";
import { heute, jahr, kannWechseln, naechstesVertragsende, type StatusVon } from "../logik/ablauf";
import { betragAusCent } from "../logik/geld";
import { type VertragInput, VertragSchema } from "../logik/typen";
import { BueroError, naechsteNummer } from "./basis";
import { kundenName } from "./kunden";

export type Vertrag = typeof vertraege.$inferSelect;
export type VertragStatus = StatusVon<"vertrag">;

const spalten = (v: VertragInput) => ({
  kundeId: v.kundeId,
  auftragId: v.auftragId,
  art: v.art,
  titel: v.titel,
  beginn: v.beginn,
  laufzeitMonate: v.laufzeitMonate,
  verlaengerungMonate: v.verlaengerungMonate,
  kuendigungsfristMonate: v.kuendigungsfristMonate,
  verguetungNetto:
    v.verguetungNetto === null ? null : betragAusCent(Math.round(v.verguetungNetto * 100)),
  verguetungIntervall: v.verguetungIntervall,
  unterzeichnetAm: v.unterzeichnetAm,
  inhalt: v.inhalt,
  aboRechnungen: v.aboRechnungen,
});

/** When an active contract ends at the earliest, and by when notice must be given. */
export const vertragsende = (v: Vertrag, am = heute()) =>
  v.status === "aktiv" ? naechstesVertragsende(v, am) : null;

export async function listVertraege() {
  const rows = await db
    .select({ vertrag: vertraege, kunde: kunden })
    .from(vertraege)
    .innerJoin(kunden, eq(kunden.id, vertraege.kundeId))
    .orderBy(desc(vertraege.beginn));
  return rows.map((r) => ({ ...r.vertrag, kundeName: kundenName(r.kunde) }));
}

export async function getVertrag(id: number) {
  const [row] = await db
    .select({ vertrag: vertraege, kunde: kunden })
    .from(vertraege)
    .innerJoin(kunden, eq(kunden.id, vertraege.kundeId))
    .where(eq(vertraege.id, id))
    .limit(1);
  if (!row) return null;
  const [auftrag] = row.vertrag.auftragId
    ? await db.select().from(auftraege).where(eq(auftraege.id, row.vertrag.auftragId))
    : [];
  const r = await db
    .select()
    .from(rechnungen)
    .where(eq(rechnungen.vertragId, id))
    .orderBy(desc(rechnungen.createdAt));
  return { vertrag: row.vertrag, kunde: row.kunde, auftrag: auftrag ?? null, rechnungen: r };
}

export async function createVertrag(raw: VertragInput) {
  const input = VertragSchema.parse(raw);
  return db.transaction(async (tx) => {
    const nummer = await naechsteNummer(tx, "VT", jahr(heute()));
    const [row] = await tx
      .insert(vertraege)
      .values({ nummer, ...spalten(input) })
      .returning({ id: vertraege.id });
    return row!.id;
  });
}

export async function updateVertrag(id: number, raw: VertragInput) {
  const input = VertragSchema.parse(raw);
  const [v] = await db.select().from(vertraege).where(eq(vertraege.id, id)).limit(1);
  if (!v) throw new BueroError("Den Vertrag gibt es nicht mehr.");
  if (v.status === "beendet") throw new BueroError("Ein beendeter Vertrag bleibt, wie er war.");
  await db
    .update(vertraege)
    .set({ ...spalten(input), updatedAt: new Date() })
    .where(eq(vertraege.id, id));
}

// Signing makes it active (dated today unless a date was entered); notice fixes its end.
export async function setVertragStatus(id: number, nach: VertragStatus) {
  const [v] = await db.select().from(vertraege).where(eq(vertraege.id, id)).limit(1);
  if (!v) throw new BueroError("Den Vertrag gibt es nicht mehr.");
  if (!kannWechseln("vertrag", v.status, nach))
    throw new BueroError("Dieser Schritt passt nicht zum Stand des Vertrags.");
  const tag = heute();
  await db
    .update(vertraege)
    .set({
      status: nach,
      ...(nach === "aktiv" && !v.unterzeichnetAm ? { unterzeichnetAm: tag } : {}),
      ...(nach === "gekuendigt"
        ? { gekuendigtAm: tag, endetAm: naechstesVertragsende(v, tag).ende }
        : {}),
      ...(nach === "beendet" && !v.endetAm ? { endetAm: tag } : {}),
      updatedAt: new Date(),
    })
    .where(eq(vertraege.id, id));
}

export async function deleteVertrag(id: number) {
  const found = await getVertrag(id);
  if (!found) return;
  if (found.vertrag.status !== "entwurf" || found.rechnungen.length > 0)
    throw new BueroError("Nur Entwürfe ohne Rechnung können gelöscht werden.");
  await db.delete(vertraege).where(eq(vertraege.id, id));
}

// For the pickers: every contract with the fee an invoice takes from it.
export async function listVertraegeAuswahl() {
  const rows = await db
    .select({
      id: vertraege.id,
      nummer: vertraege.nummer,
      titel: vertraege.titel,
      kundeId: vertraege.kundeId,
      auftragId: vertraege.auftragId,
      status: vertraege.status,
      verguetungNetto: vertraege.verguetungNetto,
      verguetungIntervall: vertraege.verguetungIntervall,
    })
    .from(vertraege)
    .orderBy(desc(vertraege.beginn));
  return rows.map((v) => ({
    ...v,
    verguetungNetto: v.verguetungNetto === null ? null : Number(v.verguetungNetto),
  }));
}
export type VertragOption = Awaited<ReturnType<typeof listVertraegeAuswahl>>[number];
