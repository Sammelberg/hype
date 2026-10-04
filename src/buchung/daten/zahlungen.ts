// Payments of a Buchung's Anzahlung. Starting one writes the row first, then asks the adapter;
// confirming is idempotent (a provider may report twice) and turns a held Buchung into a
// confirmed one under the row's lock.
import { createHash } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { betragAusCent, centAusBetrag } from "../../buero/logik/geld";
import { writeAudit } from "../../cms/audit/log";
import { db, type Db, type Tx } from "../../cms/db/client";
import { buchungen, zahlungen } from "../db/schema";
import type { ZahlungAdapterName } from "../logik/typen";
import type { ZahlungsAdapter } from "../zahlung/adapter";
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
): Promise<{ buchungId: number; buchungStatus: string }> {
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
    if (z.status !== "offen") return { buchungId: b.id, buchungStatus: b.status };

    await tx
      .update(zahlungen)
      .set({ status: e.ausgang, updatedAt: jetzt })
      .where(eq(zahlungen.id, z.id));
    if (e.ausgang !== "bezahlt" || b.status !== "reserviert")
      return { buchungId: b.id, buchungStatus: b.status };

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
    return { buchungId: b.id, buchungStatus: "bestaetigt" };
  });
}
