// @vitest-environment node
// Runs against DATABASE_URL inside one transaction that is rolled back at the end: an issued
// invoice cannot be deleted (GoBD trigger), so a test that issues one must never commit it —
// neither the invoice nor the number it took from the series.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db, type Tx } from "../../cms/db/client";
import { rechnungen } from "../db/schema";
import { firma as firmaBeispiel } from "../logik/xrechnung.beispiel";
import { BueroError } from "./basis";
import { saveFirma } from "./firma";
import { createKunde } from "./kunden";
import {
  createRechnung,
  getRechnung,
  markiereBezahlt,
  stelleRechnung,
  storniereRechnung,
  xrechnungFuer,
} from "./rechnungen";

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

const entwurf = (kundeId: number) => ({
  art: "normal" as const,
  kundeId,
  auftragId: null,
  vertragId: null,
  leistungVon: "2026-09-01",
  leistungBis: "2026-09-30",
  zahlungszielTage: 14,
  einleitung: null,
  schlusstext: null,
  positionen: [
    {
      id: "a",
      bezeichnung: "Entwicklung",
      menge: 10,
      einheit: "HUR" as const,
      einzelpreis: 95,
      ustSatz: 19 as const,
    },
  ],
});

describe.skipIf(!process.env.DATABASE_URL)("invoices", () => {
  it("issue with a number, freeze, get paid, and are corrected only by a Storno", async () => {
    await imRollback(async (tx) => {
      await saveFirma(firmaBeispiel, tx);
      const kundeId = await createKunde(kunde, tx);
      const id = await createRechnung(entwurf(kundeId), tx);

      const nummer = await stelleRechnung(id, tx);
      expect(nummer).toMatch(/^RE-\d{4}-\d{4}$/);
      const gestellt = (await getRechnung(id, tx))!.rechnung;
      expect(gestellt).toMatchObject({
        status: "gestellt",
        summeNetto: "950.00",
        summeBrutto: "1130.50",
      });
      expect(gestellt.empfaenger?.name).toBe("Test Parkett GmbH");

      // The trigger refuses any change to what the invoice says (inside a savepoint, so the
      // transaction goes on).
      await expect(
        tx.transaction((sp) =>
          sp.update(rechnungen).set({ summeBrutto: "1.00" }).where(eq(rechnungen.id, id)),
        ),
      ).rejects.toThrow();
      await expect(
        tx.transaction((sp) => sp.delete(rechnungen).where(eq(rechnungen.id, id))),
      ).rejects.toThrow();

      await markiereBezahlt(id, "2026-10-10", tx);
      const stornoId = await storniereRechnung(id, tx);
      const storno = (await getRechnung(stornoId, tx))!;
      expect(storno.rechnung).toMatchObject({
        typ: "storno",
        status: "gestellt",
        summeBrutto: "-1130.50",
      });
      expect(storno.korrigiert?.nummer).toBe(nummer);
      expect((await getRechnung(id, tx))!.rechnung.status).toBe("storniert");

      const { xml } = await xrechnungFuer(stornoId, tx);
      expect(xml).toContain("<cbc:InvoiceTypeCode>384</cbc:InvoiceTypeCode>");
      expect(xml).toContain(`<cbc:ID>${nummer}</cbc:ID></cac:InvoiceDocumentReference>`);
    });
  });

  it("is not issued while §14 details are missing, and takes no number then", async () => {
    await imRollback(async (tx) => {
      await saveFirma({ ...firmaBeispiel, steuernummer: null, ustId: null }, tx);
      const kundeId = await createKunde(kunde, tx);
      const id = await createRechnung(entwurf(kundeId), tx);
      const vorher = await tx.execute(
        sql`select coalesce(max(letzte), 0) as n from buero.nummernkreise where praefix = 'RE'`,
      );
      await expect(stelleRechnung(id, tx)).rejects.toThrow(BueroError);
      await expect(stelleRechnung(id, tx)).rejects.toThrow(/Steuernummer oder USt-IdNr/);
      const nachher = await tx.execute(
        sql`select coalesce(max(letzte), 0) as n from buero.nummernkreise where praefix = 'RE'`,
      );
      expect(nachher.rows).toEqual(vorher.rows);
      expect((await getRechnung(id, tx))!.rechnung.status).toBe("entwurf");
    });
  });
});
