// @vitest-environment node
// Runs against DATABASE_URL inside one transaction that is rolled back at the end.
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db, type Tx } from "../../cms/db/client";
import {
  buchungen,
  darsteller,
  darstellerFiguren,
  einstellungen,
  figuren,
  pakete,
  staedte,
  zahlungen,
  zonen,
} from "../db/schema";
import { testAdapter } from "../zahlung/test-adapter";
import { halteSlot } from "./belegung";
import { loescheNichtZustandegekommene } from "./aufbewahrung";
import { freieStarts, kundenSicht, stelleAnfrage, storniereDurchKunde } from "./buchen";
import {
  erstatteAnzahlung,
  gleicheAb,
  meldeZahlung,
  merkeEreignis,
  starteAnzahlung,
} from "./zahlungen";
import type { ZahlungsAdapter } from "../zahlung/adapter";
import { sperreTestdatei } from "./test-sperre";

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

// Thursday 12 November 2026, 10:30 in Germany.
const jetzt = new Date("2026-11-12T09:30:00.000Z");
const kontakt = { name: "test-Kundin", email: "test@example.com", telefon: "06021 1" };

async function aufbau(tx: Tx) {
  await tx
    .update(einstellungen)
    .set({
      ersterStartMin: 600,
      letzterStartMin: 660,
      rasterMin: 60,
      mindestVorlaufStd: 48,
      haltenMin: 30,
    })
    .where(eq(einstellungen.id, 1));
  await tx.insert(zonen).values({ code: "TK", name: "test-K", aufschlag: "20", fahrtMinuten: 20 });
  await tx
    .insert(zonen)
    .values({ code: "TQ", name: "test-Q", aufschlag: "0", fahrtMinuten: 200, nurAnfrage: true });
  const [nah] = await tx
    .insert(staedte)
    .values({ name: "test-Nah", slug: "test-nah-b", zoneCode: "TK" })
    .returning();
  const [weit] = await tx
    .insert(staedte)
    .values({ name: "test-Weit", slug: "test-weit-b", zoneCode: "TQ" })
    .returning();
  const [figur] = await tx
    .insert(figuren)
    .values({ slug: "test-figur-b", name: "test-Figur", kategorie: "clowns" })
    .returning();
  const [paket] = await tx
    .insert(pakete)
    .values({ slug: "test-kurz-b", name: "test-Kurz", dauerMin: 60, preis: "100.00" })
    .returning();
  const [person] = await tx.insert(darsteller).values({ name: "test-Kai" }).returning();
  await tx.insert(darstellerFiguren).values({ darstellerId: person!.id, figurId: figur!.id });
  return { nah: nah!, weit: weit!, figur: figur!, paket: paket! };
}

const wunsch = (a: Awaited<ReturnType<typeof aufbau>>, beginn: Date) => ({
  figurId: a.figur.id,
  zweiteFigurId: null,
  paketId: a.paket.id,
  extraIds: [],
  stadtId: a.nah.id,
  beginn,
  zahlungsart: "test" as const,
  kontakt,
});

describe.skipIf(!process.env.DATABASE_URL)("Buchen auf der Website (Datenbank)", () => {
  let freigeben: (() => Promise<void>) | undefined;
  beforeAll(async () => {
    freigeben = await sperreTestdatei();
  }, 120_000);
  afterAll(async () => {
    await freigeben?.();
  });

  it("offers per day the free starts, from 48 hours on, and none for a town on request", async () => {
    await imRollback(async (tx) => {
      const a = await aufbau(tx);
      const anfrage = { figurIds: [a.figur.id], paketId: a.paket.id, extraIds: [], tage: 3 };
      const frei = await freieStarts(
        { ...anfrage, stadtId: a.nah.id, ab: "2026-11-13" },
        jetzt,
        tx,
      );
      // Friday 13th is under 48 hours away; Saturday 14th 10:00 too (09:00 UTC < 09:30 UTC).
      expect(frei).toEqual({
        "2026-11-13": [],
        "2026-11-14": ["11:00"],
        "2026-11-15": ["10:00", "11:00"],
      });

      await halteSlot(
        wunsch(a, new Date("2026-11-15T09:00:00.000Z")),
        { jetzt, quelle: "web" },
        tx,
      );
      const danach = await freieStarts(
        { ...anfrage, stadtId: a.nah.id, ab: "2026-11-15" },
        jetzt,
        tx,
      );
      // 10:00 is held; 11:00 overlaps its Fenster (travel and packing around the hour).
      expect(danach["2026-11-15"]).toEqual([]);

      expect(
        await freieStarts({ ...anfrage, stadtId: a.weit.id, ab: "2026-11-15" }, jetzt, tx),
      ).toEqual({});
    });
  });

  it("writes an Anfrage without taking anyone and shows it behind its link", async () => {
    await imRollback(async (tx) => {
      const a = await aufbau(tx);
      const r = await stelleAnfrage(
        {
          ...wunsch(a, new Date("2026-11-13T12:00:00.000Z")),
          stadtId: a.weit.id,
          zahlungsart: "mollie",
          rechnungAn: null,
          adresse: { strasse: "Weg 1", plz: "90402", ort: "Nürnberg" },
          kind: { name: null, alter: 5, anzahl: 8 },
          sprache: null,
          notizKunde: null,
        },
        jetzt,
        tx,
      );
      const sicht = await kundenSicht(r.zugriffToken, jetzt, tx);
      expect(sicht?.status).toBe("anfrage");
      // The town's travel is on request: the Paket is priced, the total waits for the owner.
      expect(sicht?.positionen.map((p) => p.art)).toEqual(["paket"]);
      expect(sicht?.summeCent).toBeNull();
      expect(sicht?.storno).toBeNull();
      expect(await kundenSicht("x".repeat(32), jetzt, tx)).toBeNull();
    });
  });

  it("confirms a held Buchung once its Anzahlung is paid, and only once", async () => {
    await imRollback(async (tx) => {
      const a = await aufbau(tx);
      const r = await halteSlot(
        { ...wunsch(a, new Date("2026-11-28T09:00:00.000Z")), zahlungsart: "mollie" },
        { jetzt, quelle: "web" },
        tx,
      );
      if (!r.ok) throw new Error("nicht gehalten");
      const weiter = await starteAnzahlung(r.buchung.zugriffToken, testAdapter, jetzt, tx);
      const externId = new URL(weiter, "http://x").searchParams.get("zahlung")!;
      expect(weiter).toContain(`/buchung/${r.buchung.zugriffToken}/testzahlung`);

      const erst = await meldeZahlung({ adapter: "test", externId, ausgang: "bezahlt" }, jetzt, tx);
      const nochmal = await meldeZahlung(
        { adapter: "test", externId, ausgang: "fehlgeschlagen" },
        jetzt,
        tx,
      );
      expect(erst.buchungStatus).toBe("bestaetigt");
      expect(nochmal.buchungStatus).toBe("bestaetigt");
      const [z] = await tx.select().from(zahlungen).where(eq(zahlungen.buchungId, r.buchung.id));
      expect(z?.status).toBe("bezahlt");
      const [b] = await tx.select().from(buchungen).where(eq(buchungen.id, r.buchung.id));
      expect(b?.haltenBis).toBeNull();
    });
  });

  it("lets the customer cancel far ahead, and sends them to the owner close to the party", async () => {
    await imRollback(async (tx) => {
      const a = await aufbau(tx);
      const fern = await halteSlot(
        wunsch(a, new Date("2026-12-12T09:00:00.000Z")),
        { jetzt, quelle: "web" },
        tx,
      );
      const nah = await halteSlot(
        { ...wunsch(a, new Date("2026-11-15T09:00:00.000Z")), zahlungsart: "mollie" },
        { jetzt, quelle: "web" },
        tx,
      );
      if (!fern.ok || !nah.ok) throw new Error("nicht gehalten");
      const r = await storniereDurchKunde(fern.buchung.zugriffToken, jetzt, tx);
      expect(r.status).toBe("storniert");

      const weiter = await starteAnzahlung(nah.buchung.zugriffToken, testAdapter, jetzt, tx);
      const externId = new URL(weiter, "http://x").searchParams.get("zahlung")!;
      await meldeZahlung({ adapter: "test", externId, ausgang: "bezahlt" }, jetzt, tx);
      await expect(storniereDurchKunde(nah.buchung.zugriffToken, jetzt, tx)).rejects.toThrow(
        /gemeinsam mit Ihnen/,
      );
    });
  });
  it("asks the provider on return, refunds through it and notes each webhook call once", async () => {
    await imRollback(async (tx) => {
      const a = await aufbau(tx);
      const erstattet: [string, number][] = [];
      const fake: ZahlungsAdapter = {
        name: "mollie",
        starte: async (z) => ({ externId: `tr_fake${z.zahlungId}`, weiter: "https://checkout" }),
        stand: async () => "bezahlt",
        erstatte: async (id, cent) => {
          erstattet.push([id, cent]);
          return "re_fake";
        },
      };
      const r = await halteSlot(
        { ...wunsch(a, new Date("2026-12-19T10:00:00.000Z")), zahlungsart: "mollie" },
        { jetzt, quelle: "web" },
        tx,
      );
      if (!r.ok) throw new Error("nicht gehalten");
      expect(await starteAnzahlung(r.buchung.zugriffToken, fake, jetzt, tx)).toBe(
        "https://checkout",
      );
      const [z] = await tx.select().from(zahlungen).where(eq(zahlungen.buchungId, r.buchung.id));

      const ab = await gleicheAb(fake, z!.externId!, jetzt, tx);
      expect(ab).toEqual({ stand: "bezahlt", buchungId: r.buchung.id, neuBestaetigt: true });
      expect((await gleicheAb(fake, z!.externId!, jetzt, tx)).neuBestaetigt).toBe(false);

      // 25 % of 120 € (Paket 100 € + travel 20 €) went in; all of it goes back.
      const zurueck = await erstatteAnzahlung(r.buchung.id, 99_999, () => fake, jetzt, tx);
      expect(zurueck).not.toBeNull();
      expect(erstattet).toEqual([[z!.externId!, 3000]]);

      expect(await merkeEreignis("mollie", "tr_fake:bezahlt", tx)).toBe(true);
      expect(await merkeEreignis("mollie", "tr_fake:bezahlt", tx)).toBe(false);
    });
  });
  it("deletes bookings that never came about after six months, and keeps contracts", async () => {
    await imRollback(async (tx) => {
      const a = await aufbau(tx);
      const anfrage = await stelleAnfrage(
        {
          ...wunsch(a, new Date("2026-11-13T12:00:00.000Z")),
          zahlungsart: "mollie",
          rechnungAn: null,
          adresse: { strasse: null, plz: null, ort: null },
          kind: { name: null, alter: null, anzahl: null },
          sprache: null,
          notizKunde: null,
        },
        jetzt,
        tx,
      );
      const gebucht = await halteSlot(
        { ...wunsch(a, new Date("2026-12-05T09:00:00.000Z")), zahlungsart: "rechnung" },
        { jetzt, quelle: "telefon" },
        tx,
      );
      if (!gebucht.ok) throw new Error("nicht gebucht");
      const alt = new Date("2026-01-01T00:00:00.000Z");
      await tx.update(buchungen).set({ updatedAt: alt }).where(eq(buchungen.id, anfrage.id));
      await tx
        .update(buchungen)
        .set({ updatedAt: alt })
        .where(eq(buchungen.id, gebucht.buchung.id));

      // Five months later nothing goes; seven months later the Anfrage, never the confirmed one.
      expect(await loescheNichtZustandegekommene(new Date("2026-06-01T00:00:00.000Z"), tx)).toBe(0);
      expect(await loescheNichtZustandegekommene(new Date("2026-08-01T00:00:00.000Z"), tx)).toBe(1);
      const rest = await tx
        .select({ id: buchungen.id })
        .from(buchungen)
        .where(eq(buchungen.id, gebucht.buchung.id));
      expect(rest).toHaveLength(1);
    });
  });
});
