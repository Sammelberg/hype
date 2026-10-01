// @vitest-environment node
// The office's second round (migration 0008) against DATABASE_URL, inside one transaction rolled
// back at the end, like rechnungen.db.test.ts: part payments, Mahnungen, invoices on account and
// the final invoice, recurring invoices from a contract, offers that become orders.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db, type Tx } from "../../cms/db/client";
import { auftraege, mahnungen, rechnungen, vertraege, zahlungen } from "../db/schema";
import { firma as firmaBeispiel } from "../logik/xrechnung.beispiel";
import { bereiteAboRechnungenVor } from "./abo";
import { createAngebot, nimmAngebotAn, versendeAngebot } from "./angebote";
import { BueroError } from "./basis";
import { saveFirma } from "./firma";
import { entferneZahlung, erfasseZahlung, forderungVon, schreibeMahnung } from "./forderungen";
import { createKunde } from "./kunden";
import { createRechnung, stelleRechnung, storniereRechnung, xrechnungFuer } from "./rechnungen";

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

const kunde = {
  art: "firma" as const,
  firma: "Test Parkett GmbH",
  name: null,
  email: "buchhaltung@example.com",
  telefon: null,
  strasse: "Hauptstraße 1",
  plz: "79098",
  ort: "Freiburg",
  land: "DE",
  ustId: null,
  leitwegId: null,
  zahlungszielTage: null,
  ansprechpartner: [],
  notizen: null,
};

const position = (einzelpreis: number, menge = 1) => ({
  id: `p${einzelpreis}`,
  bezeichnung: "Entwicklung",
  menge,
  einheit: "LS" as const,
  einzelpreis,
  ustSatz: 19 as const,
});

const entwurf = (kundeId: number, over: Record<string, unknown> = {}) => ({
  art: "normal" as const,
  kundeId,
  auftragId: null,
  vertragId: null,
  leistungVon: "2026-09-01",
  leistungBis: "2026-09-30",
  zahlungszielTage: 14,
  einleitung: null,
  schlusstext: null,
  positionen: [position(1000)],
  ...over,
});

async function gestellt(tx: Tx, over: Record<string, unknown> = {}) {
  await saveFirma({ ...firmaBeispiel, basiszinssatz: 1.27 }, tx);
  const kundeId = await createKunde(kunde, tx);
  const id = await createRechnung(entwurf(kundeId, over), tx);
  await stelleRechnung(id, tx);
  return { id, kundeId };
}

// In a savepoint, so the transaction carries on after the refusal; the database's own message
// sits in the cause of drizzle's error (as in gobd.db.test.ts).
async function verweigert(tx: Tx, schreiben: (sp: Tx) => Promise<unknown>, message: RegExp) {
  const error = await tx.transaction(schreiben).then(
    () => null,
    (e: Error & { cause?: Error }) => e,
  );
  expect(error, "the database let it through").not.toBeNull();
  expect(error!.cause?.message ?? error!.message).toMatch(message);
}

const status = async (tx: Tx, id: number) =>
  (await tx.select().from(rechnungen).where(eq(rechnungen.id, id)))[0]!;

describe.skipIf(!process.env.DATABASE_URL)("payments and reminders", () => {
  it("count part payments, mark paid when covered, and reopen when one is removed", async () => {
    await imRollback(async (tx) => {
      const { id } = await gestellt(tx);
      const erste = await erfasseZahlung(
        { rechnungId: id, betrag: 500, am: "2026-10-05", notiz: null },
        tx,
      );
      expect(erste.offen).toBe(69000);
      expect((await status(tx, id)).status).toBe("gestellt");
      await erfasseZahlung({ rechnungId: id, betrag: 690, am: "2026-10-09", notiz: null }, tx);
      expect(await status(tx, id)).toMatchObject({ status: "bezahlt", bezahltAm: "2026-10-09" });
      await expect(
        erfasseZahlung({ rechnungId: id, betrag: 1, am: "2026-10-10", notiz: null }, tx),
      ).rejects.toThrow(BueroError);
      await entferneZahlung(erste.id, tx);
      expect(await status(tx, id)).toMatchObject({ status: "gestellt", bezahltAm: null });
    });
  });

  it("refuse a payment on a draft, and any change to a recorded payment", async () => {
    await imRollback(async (tx) => {
      const kundeId = await createKunde(kunde, tx);
      const id = await createRechnung(entwurf(kundeId), tx);
      await verweigert(
        tx,
        (sp) => sp.insert(zahlungen).values({ rechnungId: id, betrag: "10.00", am: "2026-10-01" }),
        /./,
      );
    });
    await imRollback(async (tx) => {
      const { id } = await gestellt(tx);
      const { id: zid } = await erfasseZahlung(
        { rechnungId: id, betrag: 100, am: "2026-10-05", notiz: null },
        tx,
      );
      await verweigert(
        tx,
        (sp) => sp.update(zahlungen).set({ betrag: "1.00" }).where(eq(zahlungen.id, zid)),
        /nicht geändert/,
      );
    });
  });

  it("write Mahnungen step by step on what is open, and keep each as written", async () => {
    await imRollback(async (tx) => {
      const { id } = await gestellt(tx);
      const r = await status(tx, id);
      await expect(
        schreibeMahnung(
          {
            rechnungId: id,
            am: r.faelligAm!,
            frist: "2099-01-01",
            zinssatz: 0,
            zinsen: 0,
            pauschale: 0,
            gebuehr: 0,
            text: null,
          },
          tx,
        ),
      ).rejects.toThrow(/nach dem Fälligkeitstag/);
      await erfasseZahlung({ rechnungId: id, betrag: 190, am: "2026-10-05", notiz: null }, tx);
      const nach = (tage: number) => {
        const d = new Date(`${r.faelligAm}T00:00:00Z`);
        d.setUTCDate(d.getUTCDate() + tage);
        return d.toISOString().slice(0, 10);
      };
      const basis = {
        rechnungId: id,
        zinssatz: 10.27,
        zinsen: 5,
        pauschale: 40,
        gebuehr: 0,
        text: null,
      };
      const erste = await schreibeMahnung(
        { ...basis, am: nach(5), frist: nach(12), zinsen: 0, pauschale: 0 },
        tx,
      );
      const zweite = await schreibeMahnung({ ...basis, am: nach(40), frist: nach(50) }, tx);
      const dritte = await schreibeMahnung(
        { ...basis, am: nach(60), frist: nach(70), pauschale: 0 },
        tx,
      );
      expect([erste.stufe, zweite.stufe, dritte.stufe]).toEqual([0, 1, 2]);
      await expect(
        schreibeMahnung({ ...basis, am: nach(80), frist: nach(90) }, tx),
      ).rejects.toThrow(/letzte/);
      const { mahnungen: m } = await forderungVon(id, tx);
      // Open is 1190 − 190 = 1000; the second adds 5 € interest and the 40 € flat fee.
      expect(m.map((x) => [x.offen, x.gesamt])).toEqual([
        ["1000.00", "1000.00"],
        ["1000.00", "1045.00"],
        ["1000.00", "1005.00"],
      ]);
      await verweigert(
        tx,
        (sp) => sp.update(mahnungen).set({ gesamt: "0" }).where(eq(mahnungen.id, erste.id)),
        /nicht geändert/,
      );
      await verweigert(tx, (sp) => sp.delete(mahnungen).where(eq(mahnungen.id, erste.id)), /./);
    });
  });
});

describe.skipIf(!process.env.DATABASE_URL)("invoices on account and the final invoice", () => {
  it("deducts every issued invoice on account, frozen, and says so in the XRechnung", async () => {
    await imRollback(async (tx) => {
      await saveFirma(firmaBeispiel, tx);
      const kundeId = await createKunde(kunde, tx);
      const [auftrag] = await tx
        .insert(auftraege)
        .values({ nummer: "AU-TEST-0001", kundeId, titel: "Portal", status: "in_arbeit" })
        .returning();
      const abschlag = async (betrag: number) => {
        const id = await createRechnung(
          entwurf(kundeId, {
            art: "abschlag",
            auftragId: auftrag!.id,
            positionen: [position(betrag)],
          }),
          tx,
        );
        await stelleRechnung(id, tx);
        return (await status(tx, id)).nummer!;
      };
      const eins = await abschlag(3000);
      const zwei = await abschlag(2000);
      const schluss = await createRechnung(
        entwurf(kundeId, { art: "schluss", auftragId: auftrag!.id, positionen: [position(10000)] }),
        tx,
      );
      await stelleRechnung(schluss, tx);
      const r = await status(tx, schluss);
      expect(r.abschlaege).toEqual([
        {
          id: expect.any(Number),
          nummer: eins,
          brutto: "3570.00",
          gruppen: [{ satz: 19, netto: 300000, steuer: 57000 }],
        },
        {
          id: expect.any(Number),
          nummer: zwei,
          brutto: "2380.00",
          gruppen: [{ satz: 19, netto: 200000, steuer: 38000 }],
        },
      ]);
      await verweigert(
        tx,
        (sp) => sp.update(rechnungen).set({ abschlaege: [] }).where(eq(rechnungen.id, schluss)),
        /festgeschrieben/,
      );
      await verweigert(
        tx,
        (sp) => sp.update(rechnungen).set({ art: "normal" }).where(eq(rechnungen.id, schluss)),
        /festgeschrieben/,
      );
      const { xml } = await xrechnungFuer(schluss, tx);
      expect(xml).toContain(`<cbc:ID>${eins}</cbc:ID>`);
      expect(xml).toContain('<cbc:PrepaidAmount currencyID="EUR">5950.00</cbc:PrepaidAmount>');
      expect(xml).toContain('<cbc:PayableAmount currencyID="EUR">5950.00</cbc:PayableAmount>');
      // Its Storno takes the deductions back: the two cancel out exactly.
      const stornoId = await storniereRechnung(schluss, tx);
      const storno = await status(tx, stornoId);
      expect(storno.abschlaege).toEqual(r.abschlaege);
      const { xml: stornoXml } = await xrechnungFuer(stornoId, tx);
      expect(stornoXml).toContain(
        '<cbc:PrepaidAmount currencyID="EUR">-5950.00</cbc:PrepaidAmount>',
      );
      expect(stornoXml).toContain(
        '<cbc:PayableAmount currencyID="EUR">-5950.00</cbc:PayableAmount>',
      );
      // The order is billed by the final invoice, not by the ones on account.
      expect(
        (await tx.select().from(auftraege).where(eq(auftraege.id, auftrag!.id)))[0]!.status,
      ).toBe("in_arbeit");
    });
  });

  it("refuses a final invoice smaller than what was billed on account", async () => {
    await imRollback(async (tx) => {
      await saveFirma(firmaBeispiel, tx);
      const kundeId = await createKunde(kunde, tx);
      const [auftrag] = await tx
        .insert(auftraege)
        .values({ nummer: "AU-TEST-0002", kundeId, titel: "Portal", status: "in_arbeit" })
        .returning();
      const a = await createRechnung(
        entwurf(kundeId, { art: "abschlag", auftragId: auftrag!.id, positionen: [position(3000)] }),
        tx,
      );
      await stelleRechnung(a, tx);
      const schluss = await createRechnung(
        entwurf(kundeId, { art: "schluss", auftragId: auftrag!.id, positionen: [position(1000)] }),
        tx,
      );
      await expect(stelleRechnung(schluss, tx)).rejects.toThrow(/übersteigen/);
    });
  });

  it("needs an order for an invoice on account", async () => {
    await imRollback(async (tx) => {
      await saveFirma(firmaBeispiel, tx);
      const kundeId = await createKunde(kunde, tx);
      const id = await createRechnung(entwurf(kundeId, { art: "abschlag" }), tx);
      await expect(stelleRechnung(id, tx)).rejects.toThrow(/Auftrag/);
    });
  });
});

describe.skipIf(!process.env.DATABASE_URL)("recurring invoices", () => {
  it("prepare one draft per period due, once", async () => {
    await imRollback(async (tx) => {
      await saveFirma(firmaBeispiel, tx);
      const kundeId = await createKunde(kunde, tx);
      const [v] = await tx
        .insert(vertraege)
        .values({
          nummer: "VT-TEST-0001",
          kundeId,
          art: "wartung",
          titel: "Betrieb und Wartung",
          status: "aktiv",
          beginn: "2026-08-01",
          verguetungNetto: "450.00",
          verguetungIntervall: "monatlich",
          aboRechnungen: true,
        })
        .returning();
      const erst = await bereiteAboRechnungenVor("2026-10-01", tx);
      expect(erst.entwuerfe).toBeGreaterThanOrEqual(3);
      const eigene = await tx.select().from(rechnungen).where(eq(rechnungen.vertragId, v!.id));
      expect(eigene.map((r) => [r.art, r.status, r.leistungVon, r.leistungBis])).toEqual([
        ["abo", "entwurf", "2026-08-01", "2026-08-31"],
        ["abo", "entwurf", "2026-09-01", "2026-09-30"],
        ["abo", "entwurf", "2026-10-01", "2026-10-31"],
      ]);
      expect(
        (await tx.select().from(vertraege).where(eq(vertraege.id, v!.id)))[0]!.abgerechnetBis,
      ).toBe("2026-10-31");
      await bereiteAboRechnungenVor("2026-10-15", tx);
      expect(
        await tx.select().from(rechnungen).where(eq(rechnungen.vertragId, v!.id)),
      ).toHaveLength(3);
    });
  });
});

describe.skipIf(!process.env.DATABASE_URL)("offers", () => {
  it("are numbered when sent and commission a new order when accepted", async () => {
    await imRollback(async (tx) => {
      await saveFirma(firmaBeispiel, tx);
      const kundeId = await createKunde(kunde, tx);
      const id = await createAngebot(
        {
          kundeId,
          auftragId: null,
          titel: "Kundenportal",
          einleitung: null,
          schlusstext: null,
          gueltigBis: "2026-11-01",
          positionen: [position(8000)],
        },
        tx,
      );
      await expect(nimmAngebotAn(id, tx)).rejects.toThrow(BueroError);
      const nummer = await versendeAngebot(id, tx);
      expect(nummer).toMatch(/^AN-\d{4}-\d{4}$/);
      const auftragId = await nimmAngebotAn(id, tx);
      const [a] = await tx.select().from(auftraege).where(eq(auftraege.id, auftragId!));
      expect(a).toMatchObject({
        kundeId,
        titel: "Kundenportal",
        status: "beauftragt",
        betragNetto: "8000.00",
      });
    });
  });
});
