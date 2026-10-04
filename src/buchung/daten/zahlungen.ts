// Payments of a Buchung's Anzahlung. Starting one writes the row first, then asks the adapter;
// confirming is idempotent (a provider may report twice) and turns a held Buchung into a
// confirmed one under the row's lock.
import { createHash } from "node:crypto";

import { and, eq, sql } from "drizzle-orm";

import { betragAusCent, centAusBetrag } from "../../buero/logik/geld";
import { writeAudit } from "../../cms/audit/log";
import { db, type Db, type Tx } from "../../cms/db/client";
import { buchungen, webhookEreignisse, zahlungen } from "../db/schema";
import type { ZahlungAdapterName } from "../logik/typen";
import type { ZahlungsAdapter, ZahlungsStand } from "../zahlung/adapter";
import { BuchungFehler } from "./basis";
import { KUNDE } from "./buchen";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Opens the payment of the Anzahlung of a held Buchung; returns where the customer goes. */
export async function starteAnzahlung(
  token: string,
  adapter: ZahlungsAdapter,
  jetzt: Date,
  client: Db | Tx = db,
): Promise<string> {
  const [b] = await client
    .select()
    .from(buchungen)
    .where(eq(buchungen.zugriffHash, hash(token)));
  if (!b) throw new BuchungFehler("Diese Buchung gibt es nicht.");
  if (b.status === "bestaetigt") throw new BuchungFehler("Die Anzahlung ist schon bezahlt.");
  if (b.status !== "reserviert" || !b.haltenBis || b.haltenBis.getTime() < jetzt.getTime())
    throw new BuchungFehler(
      "Die Reservierung ist abgelaufen. Bitte wählen Sie den Termin noch einmal.",
    );
  const betragCent = centAusBetrag(b.anzahlung);
  if (betragCent <= 0) throw new BuchungFehler("Für diese Buchung ist keine Anzahlung offen.");

  const [zahlung] = await client
    .insert(zahlungen)
    .values({
      buchungId: b.id,
      adapter: adapter.name,
      art: "anzahlung",
      betrag: betragAusCent(betragCent),
    })
    .returning({ id: zahlungen.id });
  const start = await adapter.starte({
    zahlungId: zahlung!.id,
    buchungNummer: b.nummer,
    betragCent,
    token,
    beschreibung: `Anzahlung ${b.nummer}`,
  });
  await client
    .update(zahlungen)
    .set({ externId: start.externId, updatedAt: jetzt })
    .where(eq(zahlungen.id, zahlung!.id));
  return start.weiter;
}

export type ZahlungsAusgang = "bezahlt" | "abgebrochen" | "fehlgeschlagen";

/**
 * What the provider reports for a payment. „bezahlt“ confirms the held Buchung; a lapsed hold
 * stays lapsed (the slot may be gone) and the payment is kept for the owner to refund or rebook.
 * Reporting the same outcome twice changes nothing.
 */
export async function meldeZahlung(
  e: { adapter: ZahlungAdapterName; externId: string; ausgang: ZahlungsAusgang },
  jetzt: Date,
  client: Db | Tx = db,
): Promise<{ buchungId: number; buchungStatus: string; neuBestaetigt: boolean }> {
  return client.transaction(async (tx) => {
    const [z] = await tx
      .select()
      .from(zahlungen)
      .where(and(eq(zahlungen.adapter, e.adapter), eq(zahlungen.externId, e.externId)))
      .for("update");
    if (!z) throw new BuchungFehler("Diese Zahlung gibt es nicht.");
    const [b] = await tx
      .select()
      .from(buchungen)
      .where(eq(buchungen.id, z.buchungId))
      .for("update");
    if (!b) throw new BuchungFehler("Diese Buchung gibt es nicht.");
    const unveraendert = { buchungId: b.id, buchungStatus: b.status, neuBestaetigt: false };
    if (z.status !== "offen") return unveraendert;

    await tx
      .update(zahlungen)
      .set({ status: e.ausgang, updatedAt: jetzt })
      .where(eq(zahlungen.id, z.id));
    if (e.ausgang !== "bezahlt" || b.status !== "reserviert") return unveraendert;

    await tx
      .update(buchungen)
      .set({ status: "bestaetigt", haltenBis: null, updatedAt: jetzt })
      .where(eq(buchungen.id, b.id));
    await writeAudit(tx, {
      actor: KUNDE,
      action: "buchung.status",
      target: { type: "buchung", id: b.id },
      details: { nummer: b.nummer, von: b.status, nach: "bestaetigt", zahlung: z.id },
    });
    return { buchungId: b.id, buchungStatus: "bestaetigt", neuBestaetigt: true };
  });
}

/**
 * Asks the provider where a payment stands and records a final answer. For the webhook and for
 * the customer's return from the checkout (a development machine never gets the webhook).
 */
export async function gleicheAb(
  adapter: ZahlungsAdapter,
  externId: string,
  jetzt: Date,
  client: Db | Tx = db,
): Promise<{ stand: ZahlungsStand; buchungId: number | null; neuBestaetigt: boolean }> {
  if (!adapter.stand) return { stand: "offen", buchungId: null, neuBestaetigt: false };
  const stand = await adapter.stand(externId);
  if (stand === "offen") return { stand, buchungId: null, neuBestaetigt: false };
  const r = await meldeZahlung({ adapter: adapter.name, externId, ausgang: stand }, jetzt, client);
  return { stand, buchungId: r.buchungId, neuBestaetigt: r.neuBestaetigt };
}

/** The open payments of a Buchung with this adapter, asked about one by one. */
export async function gleicheOffeneAb(
  buchungId: number,
  adapter: ZahlungsAdapter,
  jetzt: Date,
  client: Db | Tx = db,
) {
  const offen = await client
    .select({ externId: zahlungen.externId })
    .from(zahlungen)
    .where(
      and(
        eq(zahlungen.buchungId, buchungId),
        eq(zahlungen.adapter, adapter.name),
        eq(zahlungen.status, "offen"),
      ),
    );
  let neuBestaetigt = false;
  for (const z of offen) {
    if (!z.externId) continue;
    const r = await gleicheAb(adapter, z.externId, jetzt, client);
    neuBestaetigt ||= r.neuBestaetigt;
  }
  return { neuBestaetigt };
}

/** Notes a webhook call once; false when this very call (id and status) was seen before. */
export async function merkeEreignis(
  adapter: ZahlungAdapterName,
  ereignisId: string,
  client: Db | Tx = db,
): Promise<boolean> {
  const neu = await client
    .insert(webhookEreignisse)
    .values({ adapter, ereignisId })
    .onConflictDoNothing()
    .returning({ id: webhookEreignisse.ereignisId });
  return neu.length > 0;
}

/**
 * Pays back part of a Buchung's paid Anzahlung after a cancellation, through the adapter it was
 * paid with, and records it. Null when nothing was paid online.
 */
export async function erstatteAnzahlung(
  buchungId: number,
  betragCent: number,
  adapterVon: (name: string) => ZahlungsAdapter | null,
  jetzt: Date,
  client: Db | Tx = db,
): Promise<{ zahlungId: number } | null> {
  if (betragCent <= 0) return null;
  const [bezahlt] = await client
    .select()
    .from(zahlungen)
    .where(
      and(
        eq(zahlungen.buchungId, buchungId),
        eq(zahlungen.art, "anzahlung"),
        eq(zahlungen.status, "bezahlt"),
      ),
    )
    .orderBy(sql`${zahlungen.id} desc`)
    .limit(1);
  if (!bezahlt?.externId) return null;
  const adapter = adapterVon(bezahlt.adapter);
  if (!adapter) throw new BuchungFehler("Die Erstattung muss von Hand angewiesen werden.");
  const [b] = await client
    .select({ nummer: buchungen.nummer })
    .from(buchungen)
    .where(eq(buchungen.id, buchungId));
  const betrag = Math.min(betragCent, centAusBetrag(bezahlt.betrag));
  const refundId = await adapter.erstatte(
    bezahlt.externId,
    betrag,
    `Erstattung ${b?.nummer ?? ""}`.trim(),
  );
  const [neu] = await client
    .insert(zahlungen)
    .values({
      buchungId,
      adapter: adapter.name,
      art: "erstattung",
      betrag: betragAusCent(betrag),
      status: "bezahlt",
      externId: refundId,
    })
    .returning({ id: zahlungen.id });
  await writeAudit(client, {
    actor: KUNDE,
    action: "buchung.erstattet",
    target: { type: "buchung", id: buchungId },
    details: { nummer: b?.nummer, erstattungCent: betrag, zahlung: neu!.id },
  });
  return { zahlungId: neu!.id };
}

/** A Buchung's payments and refunds, oldest first, for the admin's booking card. */
export async function zahlungenVon(buchungId: number, client: Db | Tx = db) {
  const rows = await client
    .select()
    .from(zahlungen)
    .where(eq(zahlungen.buchungId, buchungId))
    .orderBy(zahlungen.id);
  return rows.map((z) => ({ ...z, betragCent: centAusBetrag(z.betrag) }));
}
