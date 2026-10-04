// @vitest-environment node
// Runs against DATABASE_URL inside one transaction that is rolled back at the end.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db, type Tx } from "../../cms/db/client";
import {
  darsteller,
  darstellerFiguren,
  einstellungen,
  figuren,
  pakete,
  staedte,
  zonen,
} from "../db/schema";
import { halteSlot } from "./belegung";
import { katalogFiguren, naechsteFreieSamstage } from "./katalog";

class Rueckgabe extends Error {}
async function imRollback(fn: (tx: Tx) => Promise<void>) {
  try {
    await db.transaction(async (tx) => {
      await fn(tx);
      throw new Rueckgabe();
    });
  } catch (error) {
    if (!(error instanceof Rueckgabe)) throw error;
  }
}

// Thursday 12 November 2026; one start a day (10:00), so one booking fills a Saturday.
const jetzt = new Date("2026-11-12T09:30:00.000Z");

async function aufbau(tx: Tx) {
  await tx
    .update(einstellungen)
    .set({
      ersterStartMin: 600,
      letzterStartMin: 600,
      rasterMin: 30,
      mindestVorlaufStd: 48,
      vorbereitungMin: 20,
      abbauMin: 15,
    })
    .where(eq(einstellungen.id, 1));
  await tx.insert(zonen).values({ code: "TK", name: "test-K", aufschlag: "0", fahrtMinuten: 20 });
  await tx
    .insert(zonen)
    .values({ code: "TQ", name: "test-Q", aufschlag: "0", fahrtMinuten: 200, nurAnfrage: true });
  const [nah] = await tx
    .insert(staedte)
    .values({ name: "test-Nah", slug: "test-nah-k", zoneCode: "TK" })
    .returning();
  const [weit] = await tx
    .insert(staedte)
    .values({ name: "test-Weit", slug: "test-weit-q", zoneCode: "TQ" })
    .returning();
  const [figur] = await tx
    .insert(figuren)
    .values({ slug: "test-figur-k", name: "test-Figur", kategorie: "clowns" })
    .returning();
  const [ohne] = await tx
    .insert(figuren)
    .values({ slug: "test-ohne-k", name: "test-Ohne", kategorie: "clowns" })
    .returning();
  await tx
    .insert(pakete)
    .values({ slug: "test-kurz-k", name: "test-Kurz", dauerMin: 30, preis: "99.00" });
  const [person] = await tx.insert(darsteller).values({ name: "test-Kai" }).returning();
  await tx.insert(darstellerFiguren).values({ darstellerId: person!.id, figurId: figur!.id });
  return { nah: nah!, weit: weit!, figur: figur!, ohne: ohne! };
}

describe.skipIf(!process.env.DATABASE_URL)("Katalog (Datenbank)", () => {
  it("names the first free Saturday per town, and skips towns that only take requests", async () => {
    await imRollback(async (tx) => {
      const { nah, weit, figur } = await aufbau(tx);
      const vorher = await naechsteFreieSamstage({ jetzt, figurIds: [figur.id] }, tx);
      // Saturday 14 November is under 48 hours away; the 21st at 10:00 is the first.
      expect(vorher.get(nah.id)?.toISOString()).toBe("2026-11-21T09:00:00.000Z");
      expect(vorher.get(weit.id)).toBeNull();

      const [paket] = await tx.select().from(pakete).where(eq(pakete.slug, "test-kurz-k"));
      const r = await halteSlot(
        {
          figurId: figur.id,
          zweiteFigurId: null,
          paketId: paket!.id,
          extraIds: [],
          stadtId: nah.id,
          beginn: new Date("2026-11-21T09:00:00.000Z"),
          zahlungsart: "test",
          kontakt: { name: "test-Kundin", email: "test@example.com", telefon: null },
        },
        { jetzt, quelle: "web" },
        tx,
      );
      expect(r.ok).toBe(true);
      const nachher = await naechsteFreieSamstage({ jetzt, figurIds: [figur.id] }, tx);
      expect(nachher.get(nah.id)?.toISOString()).toBe("2026-11-28T09:00:00.000Z");
    });
  });

  it("marks a character nobody plays as not bookable", async () => {
    await imRollback(async (tx) => {
      const { figur, ohne } = await aufbau(tx);
      const katalog = await katalogFiguren(tx);
      expect(katalog.find((f) => f.id === figur.id)?.buchbar).toBe(true);
      expect(katalog.find((f) => f.id === ohne.id)?.buchbar).toBe(false);
    });
  });
});
