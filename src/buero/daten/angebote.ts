// Offers as documents: written as a draft, numbered when sent (AN-YYYY-NNNN), then accepted or
// declined. Accepting commissions the order — the one the offer was written for, or a new one.
import { and, desc, eq } from "drizzle-orm";

import { db, type Db, type Tx } from "../../cms/db/client";
import { angebote, auftraege, kunden } from "../db/schema";
import { heute, jahr, kannWechseln, type StatusVon } from "../logik/ablauf";
import { betragAusCent, rechnungsSummen } from "../logik/geld";
import { type AngebotInput, AngebotSchema } from "../logik/typen";
import { BueroError, naechsteNummer } from "./basis";
import { getFirma } from "./firma";
import { kundenName } from "./kunden";

export type Angebot = typeof angebote.$inferSelect;
export type AngebotStatus = StatusVon<"angebot">;

const spalten = (a: AngebotInput) => ({
  kundeId: a.kundeId,
  auftragId: a.auftragId,
  titel: a.titel,
  einleitung: a.einleitung,
  schlusstext: a.schlusstext,
  gueltigBis: a.gueltigBis,
  positionen: a.positionen,
});

export async function listAngebote() {
  const rows = await db
    .select({ angebot: angebote, kunde: kunden })
    .from(angebote)
    .innerJoin(kunden, eq(kunden.id, angebote.kundeId))
    .orderBy(desc(angebote.updatedAt));
  return rows.map((r) => ({ ...r.angebot, kundeName: kundenName(r.kunde) }));
}

export async function getAngebot(id: number) {
  const [row] = await db
    .select({ angebot: angebote, kunde: kunden })
    .from(angebote)
    .innerJoin(kunden, eq(kunden.id, angebote.kundeId))
    .where(eq(angebote.id, id))
    .limit(1);
  if (!row) return null;
  const auftrag = row.angebot.auftragId
    ? ((await db.select().from(auftraege).where(eq(auftraege.id, row.angebot.auftragId)))[0] ??
      null)
    : null;
  return { angebot: row.angebot, kunde: row.kunde, auftrag };
}

export async function createAngebot(raw: AngebotInput, client: Db | Tx = db) {
  const input = AngebotSchema.parse(raw);
  const [row] = await client.insert(angebote).values(spalten(input)).returning({ id: angebote.id });
  return row!.id;
}

// Until it is accepted an offer may change; a sent one keeps its number.
export async function saveAngebot(id: number, raw: AngebotInput) {
  const input = AngebotSchema.parse(raw);
  const [row] = await db
    .update(angebote)
    .set({ ...spalten(input), updatedAt: new Date() })
    .where(and(eq(angebote.id, id)))
    .returning({ status: angebote.status });
  if (!row) throw new BueroError("Das Angebot gibt es nicht mehr.");
  if (row.status === "angenommen")
    throw new BueroError("Ein angenommenes Angebot bleibt, wie es angenommen wurde.");
}

export async function deleteAngebot(id: number) {
  const [row] = await db
    .delete(angebote)
    .where(and(eq(angebote.id, id), eq(angebote.status, "entwurf")))
    .returning({ id: angebote.id });
  if (!row) throw new BueroError("Nur Entwürfe werden gelöscht; ein versendetes Angebot bleibt.");
}

export async function versendeAngebot(id: number, client: Db | Tx = db) {
  return client.transaction(async (tx) => {
    const [a] = await tx.select().from(angebote).where(eq(angebote.id, id)).for("update");
    if (!a) throw new BueroError("Das Angebot gibt es nicht mehr.");
    if (!kannWechseln("angebot", a.status, "versendet"))
      throw new BueroError("Dieses Angebot ist schon versendet.");
    const tag = heute();
    const nummer = a.nummer ?? (await naechsteNummer(tx, "AN", jahr(tag)));
    await tx
      .update(angebote)
      .set({
        status: "versendet",
        nummer,
        versendetAm: tag,
        entschiedenAm: null,
        gueltigBis: a.gueltigBis ?? null,
        updatedAt: new Date(),
      })
      .where(eq(angebote.id, id));
    return nummer;
  });
}

// Accepted: the order it was written for is commissioned at its net total; without one, a new
// order is created, commissioned, and linked.
export async function nimmAngebotAn(id: number, client: Db | Tx = db) {
  const { firma } = await getFirma(client);
  return client.transaction(async (tx) => {
    const [a] = await tx.select().from(angebote).where(eq(angebote.id, id)).for("update");
    if (!a) throw new BueroError("Das Angebot gibt es nicht mehr.");
    if (!kannWechseln("angebot", a.status, "angenommen"))
      throw new BueroError("Erst ein versendetes Angebot kann angenommen werden.");
    const tag = heute();
    const netto = betragAusCent(rechnungsSummen(a.positionen, firma.kleinunternehmer).netto);
    let auftragId = a.auftragId;
    if (auftragId) {
      const [auftrag] = await tx.select().from(auftraege).where(eq(auftraege.id, auftragId));
      if (auftrag && auftrag.status === "angebot")
        await tx
          .update(auftraege)
          .set({
            status: "beauftragt",
            beauftragtAm: tag,
            betragNetto: netto,
            updatedAt: new Date(),
          })
          .where(eq(auftraege.id, auftragId));
    } else {
      const nummer = await naechsteNummer(tx, "AU", jahr(tag));
      const [neu] = await tx
        .insert(auftraege)
        .values({
          nummer,
          kundeId: a.kundeId,
          titel: a.titel,
          beschreibung: `Aus Angebot ${a.nummer}.`,
          status: "beauftragt",
          beauftragtAm: tag,
          betragNetto: netto,
        })
        .returning({ id: auftraege.id });
      auftragId = neu!.id;
    }
    await tx
      .update(angebote)
      .set({ status: "angenommen", entschiedenAm: tag, auftragId, updatedAt: new Date() })
      .where(eq(angebote.id, id));
    return auftragId;
  });
}

export async function lehneAngebotAb(id: number) {
  const [a] = await db.select().from(angebote).where(eq(angebote.id, id));
  if (!a || !kannWechseln("angebot", a.status, "abgelehnt"))
    throw new BueroError("Abgelehnt werden kann nur ein versendetes Angebot.");
  await db
    .update(angebote)
    .set({ status: "abgelehnt", entschiedenAm: heute(), updatedAt: new Date() })
    .where(eq(angebote.id, id));
}
