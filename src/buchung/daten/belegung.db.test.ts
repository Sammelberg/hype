// @vitest-environment node
// Runs against DATABASE_URL. The race needs two real connections, which cannot see each other's
// uncommitted rows, so the fixtures (all named test-…) are committed and removed in afterAll.
// The admin path writes the append-only audit log and therefore runs inside a rolled-back
// transaction.
import { and, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db, type Db, type Tx } from "../../cms/db/client";
import * as cmsSchema from "../../cms/db/schema";
import {
  belegungen,
  buchungen,
  darsteller,
  darstellerFiguren,
  einstellungen,
  extras,
  figuren,
  pakete,
  staedte,
  zonen,
} from "../db/schema";
import { BuchungFehler } from "./basis";
import { gebeAbgelaufeneFrei, halteSlot, sperreDarsteller, type SlotWunsch } from "./belegung";
import { sperreTestdatei } from "./test-sperre";

const s = Date.now().toString(36);
const MIN = 60_000;
const STUNDE = 60 * MIN;
const admin = { id: null, email: "test-belegung" };

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

const ids = {
  figurA: 0,
  figurB: 0,
  solo: 0,
  paar: 0,
  mini: 0,
  premium: 0,
  nahe: 0,
  weit: 0,
  schminken: 0,
};
let vorher: typeof einstellungen.$inferSelect | undefined;

describe.skipIf(!process.env.DATABASE_URL)("Belegung (Datenbank)", () => {
  let freigeben: (() => Promise<void>) | undefined;
  beforeAll(async () => {
    freigeben = await sperreTestdatei();
  }, 120_000);
  afterAll(async () => {
    await freigeben?.();
  });

  beforeAll(async () => {
    [vorher] = await db.select().from(einstellungen).where(eq(einstellungen.id, 1));
    await db
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

    await db
      .insert(zonen)
      .values([
        { code: "TA", name: "test-nah", aufschlag: "0", fahrtMinuten: 20 },
        { code: "TD", name: "test-weit", aufschlag: "60", fahrtMinuten: 60 },
      ])
      .onConflictDoNothing();
    const [nahe] = await db
      .insert(staedte)
      .values({ name: "test-nah", slug: `test-${s}-nah`, zoneCode: "TA" })
      .returning();
    const [weit] = await db
      .insert(staedte)
      .values({ name: "test-weit", slug: `test-${s}-weit`, zoneCode: "TD" })
      .returning();
    const [figurA] = await db
      .insert(figuren)
      .values({ slug: `test-${s}-a`, name: "test-Figur A", kategorie: "prinzessinnen" })
      .returning();
    const [figurB] = await db
      .insert(figuren)
      .values({ slug: `test-${s}-b`, name: "test-Figur B", kategorie: "superhelden" })
      .returning();
    const [mini] = await db
      .insert(pakete)
      .values({ slug: `test-${s}-mini`, name: "test-Mini", dauerMin: 45, preis: "149.00" })
      .returning();
    const [premium] = await db
      .insert(pakete)
      .values({
        slug: `test-${s}-premium`,
        name: "test-Premium",
        dauerMin: 120,
        preis: "349.00",
        figurenAnzahl: 2,
      })
      .returning();
    const [schminken] = await db
      .insert(extras)
      .values({
        slug: `test-${s}-schminken`,
        name: "test-Schminken",
        preis: "30.00",
        dauerDeltaMin: 20,
      })
      .returning();
    // „solo“ plays only A; „paar“ plays A and B.
    const [solo] = await db
      .insert(darsteller)
      .values({ name: `test-${s}-solo`, prioritaet: 10 })
      .returning();
    const [paar] = await db
      .insert(darsteller)
      .values({ name: `test-${s}-paar`, prioritaet: 20 })
      .returning();
    await db.insert(darstellerFiguren).values([
      { darstellerId: solo!.id, figurId: figurA!.id },
      { darstellerId: paar!.id, figurId: figurA!.id },
      { darstellerId: paar!.id, figurId: figurB!.id },
    ]);
    Object.assign(ids, {
      figurA: figurA!.id,
      figurB: figurB!.id,
      solo: solo!.id,
      paar: paar!.id,
      mini: mini!.id,
      premium: premium!.id,
      nahe: nahe!.id,
      weit: weit!.id,
      schminken: schminken!.id,
    });
  });

  afterAll(async () => {
    const leute = [ids.solo, ids.paar];
    await db.delete(belegungen).where(inArray(belegungen.darstellerId, leute));
    await db.delete(buchungen).where(inArray(buchungen.figurId, [ids.figurA, ids.figurB]));
    await db.delete(darsteller).where(inArray(darsteller.id, leute));
    await db.delete(figuren).where(inArray(figuren.id, [ids.figurA, ids.figurB]));
    await db.delete(pakete).where(inArray(pakete.id, [ids.mini, ids.premium]));
    await db.delete(extras).where(eq(extras.id, ids.schminken));
    await db.delete(staedte).where(inArray(staedte.id, [ids.nahe, ids.weit]));
    await db.delete(zonen).where(inArray(zonen.code, ["TA", "TD"]));
    if (vorher) await db.update(einstellungen).set(vorher).where(eq(einstellungen.id, 1));
  });

  const wunsch = (beginn: string, mehr: Partial<SlotWunsch> = {}): SlotWunsch => ({
    figurId: ids.figurA,
    zweiteFigurId: null,
    paketId: ids.mini,
    extraIds: [],
    stadtId: ids.nahe,
    beginn: new Date(beginn),
    zahlungsart: "test",
    kontakt: { name: "test-Kundin", email: "test@example.com", telefon: null },
    ...mehr,
  });
  const jetzt = new Date("2026-11-01T10:00:00.000Z");

  it("holds a slot: the performer is taken for the whole Fenster, the deposit is computed", async () => {
    const r = await halteSlot(wunsch("2026-11-20T13:00:00.000Z", { extraIds: [ids.schminken] }), {
      jetzt,
      quelle: "web",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.buchung.status).toBe("reserviert");
    expect(r.buchung.haltenBis?.toISOString()).toBe("2026-11-01T10:30:00.000Z");
    expect(r.buchung.summeCent).toBe(17900);
    expect(r.buchung.anzahlungCent).toBe(4475);
    expect(r.buchung.zugriffToken.length).toBeGreaterThan(20);
    const b = await db.select().from(belegungen).where(eq(belegungen.buchungId, r.buchung.id));
    // 13:00 − 20 travel − 20 setup … 13:45 + 20 face paint + 15 packing + 20 travel
    expect(b).toHaveLength(1);
    expect(b[0]!.von.toISOString()).toBe("2026-11-20T12:20:00.000Z");
    expect(b[0]!.bis.toISOString()).toBe("2026-11-20T14:40:00.000Z");
    expect(b[0]!.darstellerId).toBe(ids.solo);
  });

  it("refuses the second of two simultaneous bookings and offers other starts", async () => {
    const pools = [
      new Pool({ connectionString: process.env.DATABASE_URL, max: 1 }),
      new Pool({ connectionString: process.env.DATABASE_URL, max: 1 }),
    ];
    const clients = pools.map(
      (p) => drizzle({ client: p, schema: cmsSchema, casing: "snake_case" }) as unknown as Db,
    );
    try {
      // Figur B: only „paar“ plays it, so there is exactly one performer to race for.
      const w = wunsch("2026-11-21T13:00:00.000Z", { figurId: ids.figurB });
      const ergebnisse = await Promise.all(
        clients.map((c) => halteSlot(w, { jetzt, quelle: "web" }, c)),
      );
      expect(ergebnisse.filter((e) => e.ok)).toHaveLength(1);
      const abgelehnt = ergebnisse.find((e) => !e.ok);
      expect(abgelehnt && !abgelehnt.ok && abgelehnt.grund).toBe("belegt");
      if (abgelehnt && !abgelehnt.ok && abgelehnt.grund === "belegt") {
        expect(abgelehnt.alternativen.length).toBeGreaterThan(0);
        for (const a of abgelehnt.alternativen) expect(a.getTime()).not.toBe(w.beginn.getTime());
      }
    } finally {
      await Promise.all(pools.map((p) => p.end()));
    }
  });

  it("does not sell a slot that would only fit if the drive back from a far town were ignored", async () => {
    const weit = await halteSlot(
      wunsch("2026-11-22T13:00:00.000Z", { figurId: ids.figurB, stadtId: ids.weit }),
      {
        jetzt,
        quelle: "web",
      },
    );
    expect(weit.ok).toBe(true);
    // Mini ends 13:45, packing and the hour back: „paar“ is home at 15:00. A 14:00 start nearby is too early.
    const naechste = await halteSlot(wunsch("2026-11-22T14:00:00.000Z", { figurId: ids.figurB }), {
      jetzt,
      quelle: "web",
    });
    expect(naechste.ok).toBe(false);
  });

  it("sends two different performers for two characters, and refuses when only one is free", async () => {
    const paar = await halteSlot(
      wunsch("2026-11-23T13:00:00.000Z", { paketId: ids.premium, zweiteFigurId: ids.figurB }),
      { jetzt, quelle: "web" },
    );
    expect(paar.ok).toBe(true);
    if (paar.ok) expect(paar.buchung.darsteller.sort()).toEqual([ids.solo, ids.paar].sort());
    const nochmal = await halteSlot(
      wunsch("2026-11-23T13:30:00.000Z", { paketId: ids.premium, zweiteFigurId: ids.figurB }),
      { jetzt, quelle: "web" },
    );
    expect(nochmal.ok).toBe(false);
  });

  it("asks for a second character when the package brings two", async () => {
    await expect(
      halteSlot(wunsch("2026-11-24T13:00:00.000Z", { paketId: ids.premium }), {
        jetzt,
        quelle: "web",
      }),
    ).rejects.toBeInstanceOf(BuchungFehler);
  });

  it("frees a held slot whose time ran out, for the next customer", async () => {
    const zuerst = await halteSlot(wunsch("2026-11-25T13:00:00.000Z"), { jetzt, quelle: "web" });
    expect(zuerst.ok && zuerst.buchung.darsteller).toEqual([ids.solo]);
    // 31 minutes later the hold has lapsed: the next booking releases it and gets „solo“ again,
    // who comes first by priority.
    const spaeter = new Date(jetzt.getTime() + 31 * MIN);
    const zweiter = await halteSlot(wunsch("2026-11-25T13:00:00.000Z"), {
      jetzt: spaeter,
      quelle: "web",
    });
    expect(zweiter.ok && zweiter.buchung.darsteller).toEqual([ids.solo]);
    if (!zuerst.ok) return;
    const [alt] = await db.select().from(buchungen).where(eq(buchungen.id, zuerst.buchung.id));
    expect(alt!.status).toBe("verfallen");
  });

  it("lets the sweeper release lapsed holds", async () => {
    const r = await halteSlot(wunsch("2026-11-26T13:00:00.000Z"), { jetzt, quelle: "web" });
    expect(r.ok).toBe(true);
    const frei = await gebeAbgelaufeneFrei(new Date(jetzt.getTime() + 31 * MIN));
    expect(r.ok && frei).toContain(r.ok ? r.buchung.id : -1);
    if (!r.ok) return;
    const [b] = await db.select().from(buchungen).where(eq(buchungen.id, r.buchung.id));
    expect(b!.status).toBe("verfallen");
    const aktiv = await db
      .select()
      .from(belegungen)
      .where(and(eq(belegungen.buchungId, r.buchung.id), eq(belegungen.aktiv, true)));
    expect(aktiv).toHaveLength(0);
  });

  it("turns a booking under 48 hours into a request on the website, and writes nothing", async () => {
    const vor = await db.select({ n: sql<number>`count(*)::int` }).from(buchungen);
    const r = await halteSlot(wunsch("2026-11-02T13:00:00.000Z"), { jetzt, quelle: "web" });
    expect(r).toEqual({ ok: false, grund: "kurzfristig" });
    const nach = await db.select({ n: sql<number>`count(*)::int` }).from(buchungen);
    expect(nach[0]!.n).toBe(vor[0]!.n);
  });

  it("lets the owner book a phone order at short notice; it is confirmed at once", async () => {
    await imRollback(async (tx) => {
      const r = await halteSlot(
        wunsch("2026-11-02T13:00:00.000Z"),
        { jetzt, quelle: "telefon", akteur: admin },
        tx,
      );
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.buchung.status).toBe("bestaetigt");
        expect(r.buchung.haltenBis).toBeNull();
      }
    });
  });

  it("blocks a performer's free time, and refuses a block over a visit", async () => {
    await imRollback(async (tx) => {
      const tag = "2026-11-27";
      const sperre = await sperreDarsteller(
        {
          darstellerId: ids.solo,
          von: new Date(`${tag}T08:00:00.000Z`),
          bis: new Date(`${tag}T20:00:00.000Z`),
          grund: "Urlaub",
        },
        admin,
        tx,
      );
      expect(sperre.id).toBeGreaterThan(0);
      // „solo“ is off, „paar“ still plays A: the booking goes to „paar“.
      const r = await halteSlot(wunsch(`${tag}T13:00:00.000Z`), { jetzt, quelle: "web" }, tx);
      expect(r.ok && r.buchung.darsteller).toEqual([ids.paar]);
      await expect(
        sperreDarsteller(
          {
            darstellerId: ids.paar,
            von: new Date(`${tag}T12:00:00.000Z`),
            bis: new Date(`${tag}T14:00:00.000Z`),
            grund: "Arzt",
          },
          admin,
          tx,
        ),
      ).rejects.toBeInstanceOf(BuchungFehler);
    });
  });

  it("is backed by the database: two active overlapping Belegungen of one performer are refused", async () => {
    await imRollback(async (tx) => {
      const von = new Date("2026-11-28T10:00:00.000Z");
      const bis = new Date(von.getTime() + 2 * STUNDE);
      await tx.insert(belegungen).values({ darstellerId: ids.solo, art: "sperre", von, bis });
      await expect(
        tx.transaction((t) =>
          t.insert(belegungen).values({
            darstellerId: ids.solo,
            art: "sperre",
            von: new Date(von.getTime() + STUNDE),
            bis,
          }),
        ),
      ).rejects.toMatchObject({ cause: { code: "23P01" } });
    });
  });
});
