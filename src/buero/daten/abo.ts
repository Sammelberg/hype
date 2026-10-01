// Recurring invoices: every running contract with a fee per month, quarter or year that has them
// switched on gets a draft per period due, billed in advance (logik/abrechnung.ts). Drafts only —
// the owner reads and issues them. Idempotent: a unique index lets each period be billed once,
// and the contract remembers how far it was billed.
import { and, eq, inArray } from "drizzle-orm";

import { db, type Db, type Tx } from "../../cms/db/client";
import { kunden, rechnungen, vertraege } from "../db/schema";
import { type AboIntervall, aboPosition, faelligeZeitraeume } from "../logik/abrechnung";
import { heute } from "../logik/ablauf";
import { getFirma } from "./firma";

const laufend = (v: typeof vertraege.$inferSelect) =>
  v.aboRechnungen &&
  (v.status === "aktiv" || v.status === "gekuendigt") &&
  v.verguetungNetto !== null &&
  v.verguetungIntervall !== null &&
  v.verguetungIntervall !== "einmalig";

/** Which contracts have periods due by `stichtag`, and how many — without writing anything. */
export async function faelligeAboZeitraeume(stichtag: string = heute(), client: Db | Tx = db) {
  const liste = await client
    .select()
    .from(vertraege)
    .where(
      and(eq(vertraege.aboRechnungen, true), inArray(vertraege.status, ["aktiv", "gekuendigt"])),
    );
  return liste.filter(laufend).map((v) => ({
    vertrag: v,
    zeitraeume: faelligeZeitraeume({
      beginn: v.beginn,
      intervall: v.verguetungIntervall as AboIntervall,
      abgerechnetBis: v.abgerechnetBis,
      endetAm: v.endetAm,
      stichtag,
    }),
  }));
}

export async function bereiteAboRechnungenVor(stichtag: string = heute(), client: Db | Tx = db) {
  const { firma } = await getFirma(client);
  const faellig = (await faelligeAboZeitraeume(stichtag, client)).filter(
    (f) => f.zeitraeume.length > 0,
  );
  const neu: number[] = [];
  for (const { vertrag: v, zeitraeume } of faellig) {
    await client.transaction(async (tx) => {
      const [kunde] = await tx.select().from(kunden).where(eq(kunden.id, v.kundeId));
      for (const z of zeitraeume) {
        const [row] = await tx
          .insert(rechnungen)
          .values({
            art: "abo",
            kundeId: v.kundeId,
            vertragId: v.id,
            auftragId: v.auftragId,
            leistungVon: z.von,
            leistungBis: z.bis,
            zahlungszielTage: kunde?.zahlungszielTage ?? firma.zahlungszielTage,
            positionen: [
              aboPosition(
                {
                  titel: v.titel,
                  verguetungNetto: Number(v.verguetungNetto),
                  intervall: v.verguetungIntervall as AboIntervall,
                },
                z,
                `abo-${v.id}-${z.von}`,
              ),
            ],
          })
          .onConflictDoNothing()
          .returning({ id: rechnungen.id });
        if (row) neu.push(row.id);
      }
      await tx
        .update(vertraege)
        .set({ abgerechnetBis: zeitraeume.at(-1)!.bis, updatedAt: new Date() })
        .where(eq(vertraege.id, v.id));
    });
  }
  return { entwuerfe: neu.length, vertraege: faellig.length };
}
