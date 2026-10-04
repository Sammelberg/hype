// @vitest-environment node
// Runs against DATABASE_URL inside one transaction that is rolled back at the end (status changes
// write the append-only audit log).
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db, type Tx } from "../../cms/db/client";
import {
  belegungen,
  darsteller,
  darstellerFiguren,
  einstellungen,
  extras,
  figuren,
  pakete,
  staedte,
  zonen,
} from "../db/schema";
import { woche } from "../logik/woche";
import { BuchungFehler } from "./basis";
import { halteSlot, type SlotWunsch } from "./belegung";
import { exportZeilen, getBuchung, setzeStatus, speichereNotiz, wochenPlan } from "./buchungen";

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

const admin = { id: null, email: "test-buchungen" };
const jetzt = new Date("2026-11-01T10:00:00.000Z");

// One performer, one character, one package with face paint, one town 30 minutes away.
async function aufbau(tx: Tx) {
  await tx
    .update(einstellungen)
    .set({
      vorbereitungMin: 20,
      abbauMin: 15,
      rasterMin: 30,
      ersterStartMin: 600,
      letzterStartMin: 1080,
      anzahlungProzent: 25,
      haltenMin: 30,
      mindestVorlaufStd: 48,
    })
    .where(eq(einstellungen.id, 1));
  await tx.insert(zonen).values({ code: "TB", name: "test-B", aufschlag: "20", fahrtMinuten: 30 });
  const [stadt] = await tx
    .insert(staedte)
    .values({ name: "test-Hanau", slug: "test-hanau-b", zoneCode: "TB" })
    .returning();
  const [figur] = await tx
    .insert(figuren)
    .values({ slug: "test-fee-b", name: "test-Fee", kategorie: "prinzessinnen" })
    .returning();
  const [paket] = await tx
    .insert(pakete)
    .values({ slug: "test-klassik-b", name: "test-Klassik", dauerMin: 90, preis: "249.00" })
    .returning();
  const [schminken] = await tx
    .insert(extras)
    .values({ slug: "test-schminken-b", name: "test-Schminken", preis: "30.00", dauerDeltaMin: 20 })
    .returning();
  const [person] = await tx.insert(darsteller).values({ name: "test-Dora" }).returning();
  await tx.insert(darstellerFiguren).values({ darstellerId: person!.id, figurId: figur!.id });
  const wunsch = (beginn: string, mehr: Partial<SlotWunsch> = {}): SlotWunsch => ({
    figurId: figur!.id,
    zweiteFigurId: null,
    paketId: paket!.id,
    extraIds: [schminken!.id],
    stadtId: stadt!.id,
    beginn: new Date(beginn),
    zahlungsart: "test",
    kontakt: { name: "test-Kundin", email: "test@example.com", telefon: "0170 1234567" },
    adresse: { strasse: "Musterweg 1", plz: "63450", ort: "Hanau" },
    ...mehr,
  });
  return { person: person!, wunsch };
}

async function bucht(tx: Tx, w: SlotWunsch, quelle: "web" | "telefon" = "web") {
  const r = await halteSlot(w, { jetzt, quelle, akteur: quelle === "web" ? undefined : admin }, tx);
  if (!r.ok) throw new Error(`nicht gebucht: ${r.grund}`);
  return r.buchung;
}

describe.skipIf(!process.env.DATABASE_URL)("Buchungen (Datenbank)", () => {
  it("lays out the week: the visit with its party inside, and the performer's time off", async () => {
    await imRollback(async (tx) => {
      const { person, wunsch } = await aufbau(tx);
      const b = await bucht(tx, wunsch("2026-11-21T13:00:00.000Z"));
      await tx.insert(belegungen).values({
        darstellerId: person.id,
        art: "sperre",
        von: new Date("2026-11-19T08:00:00.000Z"),
        bis: new Date("2026-11-19T16:00:00.000Z"),
        grund: "Arzt",
      });
      const plan = await wochenPlan(woche("2026-11-18"), { jetzt, darstellerId: person.id }, tx);
      const einsatz = plan.find((e) => e.art === "einsatz")!;
      expect(einsatz.buchung).toMatchObject({ id: b.id, nummer: b.nummer, status: "reserviert" });
      // 13:00 + 90 min + 20 min face paint
      expect(einsatz.partyEnde?.toISOString()).toBe("2026-11-21T14:50:00.000Z");
      expect(einsatz.darstellerName).toBe("test-Dora");
      expect(plan.find((e) => e.art === "sperre")?.grund).toBe("Arzt");
    });
  });

  it("leaves a lapsed hold out of the week", async () => {
    await imRollback(async (tx) => {
      const { person, wunsch } = await aufbau(tx);
      await bucht(tx, wunsch("2026-11-21T13:00:00.000Z"));
      const spaeter = new Date(jetzt.getTime() + 31 * 60_000);
      expect(
        await wochenPlan(woche("2026-11-18"), { jetzt: spaeter, darstellerId: person.id }, tx),
      ).toEqual([]);
    });
  });

  it("shows a booking's card: contact, lines of the price and who goes", async () => {
    await imRollback(async (tx) => {
      const { wunsch } = await aufbau(tx);
      const b = await bucht(tx, wunsch("2026-11-21T13:00:00.000Z"));
      const karte = await getBuchung(b.id, tx);
      expect(karte).toMatchObject({
        nummer: b.nummer,
        kontaktName: "test-Kundin",
        figur: "test-Fee",
        paket: "test-Klassik",
        stadt: "test-Hanau",
        einsaetze: [{ darsteller: "test-Dora" }],
        extras: ["test-Schminken"],
      });
      expect(karte?.positionen.map((p) => p.cent)).toEqual([24900, 2000, 3000]);
    });
  });

  it("confirms a held booking when the deposit is in, and keeps the performer taken", async () => {
    await imRollback(async (tx) => {
      const { wunsch } = await aufbau(tx);
      const b = await bucht(tx, wunsch("2026-11-21T13:00:00.000Z"));
      await setzeStatus(b.id, { nach: "bestaetigt" }, admin, jetzt, tx);
      const karte = await getBuchung(b.id, tx);
      expect(karte?.status).toBe("bestaetigt");
      expect(karte?.haltenBis).toBeNull();
      expect(karte?.einsaetze[0]?.aktiv).toBe(true);
    });
  });

  it("cancels by the grid: 20 days ahead the slot is free and nothing is kept", async () => {
    await imRollback(async (tx) => {
      const { wunsch } = await aufbau(tx);
      const b = await bucht(tx, wunsch("2026-11-21T13:00:00.000Z"), "telefon");
      const r = await setzeStatus(
        b.id,
        { nach: "storniert", durch: "kunde", grund: "Kind krank" },
        admin,
        jetzt,
        tx,
      );
      expect(r.storno).toMatchObject({ gebuehrCent: 0, slotFrei: true });
      const karte = await getBuchung(b.id, tx);
      expect(karte?.status).toBe("storniert");
      expect(karte?.stornoGrund).toBe("Kind krank");
      expect(karte?.einsaetze[0]?.aktiv).toBe(false);
      // The slot can be sold again.
      expect(
        (await halteSlot(wunsch("2026-11-21T13:00:00.000Z"), { jetzt, quelle: "web" }, tx)).ok,
      ).toBe(true);
    });
  });

  it("refuses a step the status does not allow", async () => {
    await imRollback(async (tx) => {
      const { wunsch } = await aufbau(tx);
      const b = await bucht(tx, wunsch("2026-11-21T13:00:00.000Z"));
      await expect(
        tx.transaction((t) => setzeStatus(b.id, { nach: "abgeschlossen" }, admin, jetzt, t)),
      ).rejects.toBeInstanceOf(BuchungFehler);
    });
  });

  it("keeps the performer's note and exports the period for the tax adviser", async () => {
    await imRollback(async (tx) => {
      const { wunsch } = await aufbau(tx);
      const b = await bucht(tx, wunsch("2026-11-21T13:00:00.000Z"), "telefon");
      await speichereNotiz(b.id, "Hund im Hof", tx);
      expect((await getBuchung(b.id, tx))?.notizIntern).toBe("Hund im Hof");
      const zeilen = await exportZeilen(
        { von: new Date("2026-11-01T00:00:00Z"), bis: new Date("2026-12-01T00:00:00Z") },
        tx,
      );
      expect(zeilen.find((z) => z.nummer === b.nummer)).toMatchObject({
        datum: "2026-11-21",
        uhrzeit: "14:00",
        status: "bestaetigt",
        summe: "299.00",
        anzahlung: "74.75",
        zahlungsart: "test",
        ort: "test-Hanau",
      });
    });
  });
});
