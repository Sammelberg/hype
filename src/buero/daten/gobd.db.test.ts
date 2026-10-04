// @vitest-environment node
// Tamper tests for the GoBD triggers (migrations 0002, 0006, 0016): every forbidden write is tried
// straight in SQL, past the application, inside a transaction that is rolled back at the end.
// After boden's tests/db-triggers/gobd-*.tamper.test.ts.
import { eq, sql, type SQL } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db, type Tx } from "../../cms/db/client";
import { rechnungPdfs, rechnungen } from "../db/schema";
import { firma as firmaBeispiel } from "../logik/xrechnung.beispiel";
import { saveFirma } from "./firma";
import { createKunde } from "./kunden";
import { createRechnung, pdfFuer, stelleRechnung, xrechnungFuer } from "./rechnungen";

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

// In a savepoint, so the transaction carries on after the refusal. The database's own message
// sits in the cause of drizzle's error.
async function refused(tx: Tx, statement: SQL, message = /GoBD/) {
  const error = await tx
    .transaction((sp) => sp.execute(statement))
    .then(
      () => null,
      (e: Error & { cause?: Error }) => e,
    );
  expect(error, "the database let it through").not.toBeNull();
  expect(error!.cause?.message ?? error!.message).toMatch(message);
}
const allowed = (tx: Tx, statement: SQL) =>
  expect(tx.transaction((sp) => sp.execute(statement))).resolves.toBeDefined();

// A series of its own, far from the real ones.
const TEST = sql`praefix = 'TX' and jahr = 8888`;

describe.skipIf(!process.env.DATABASE_URL)("GoBD: number series", () => {
  it("counts up by exactly one, never back, never twice, never skipping", async () => {
    await imRollback(async (tx) => {
      await tx.execute(
        sql`insert into buero.nummernkreise (praefix, jahr, letzte) values ('TX', 8888, 5)`,
      );
      await refused(tx, sql`update buero.nummernkreise set letzte = 5 where ${TEST}`);
      await refused(tx, sql`update buero.nummernkreise set letzte = 4 where ${TEST}`);
      await refused(tx, sql`update buero.nummernkreise set letzte = 7 where ${TEST}`);
      await allowed(tx, sql`update buero.nummernkreise set letzte = 6 where ${TEST}`);
    });
  });

  it("keeps its name and year and stays", async () => {
    await imRollback(async (tx) => {
      await tx.execute(
        sql`insert into buero.nummernkreise (praefix, jahr, letzte) values ('TX', 8888, 1)`,
      );
      await refused(tx, sql`update buero.nummernkreise set praefix = 'TY' where ${TEST}`);
      await refused(tx, sql`update buero.nummernkreise set jahr = 8889 where ${TEST}`);
      await refused(tx, sql`delete from buero.nummernkreise where ${TEST}`);
      await refused(tx, sql`truncate buero.nummernkreise`);
    });
  });

  it("starts at one or above", async () => {
    await imRollback(async (tx) => {
      await refused(
        tx,
        sql`insert into buero.nummernkreise (praefix, jahr, letzte) values ('TX', 8888, 0)`,
      );
    });
  });
});

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

async function entwurf(tx: Tx) {
  await saveFirma(firmaBeispiel, tx);
  const kundeId = await createKunde(kunde, tx);
  return createRechnung(
    {
      art: "normal",
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
    },
    tx,
  );
}

async function gestellteRechnung(tx: Tx) {
  const id = await entwurf(tx);
  await stelleRechnung(id, tx);
  return id;
}

describe.skipIf(!process.env.DATABASE_URL)("GoBD: issued invoices", () => {
  it("refuse every change to what they say", async () => {
    await imRollback(async (tx) => {
      const id = await gestellteRechnung(tx);
      const where = sql`id = ${id}`;
      for (const change of [
        sql`summe_brutto = 1`,
        sql`summe_netto = 1`,
        sql`nummer = 'RE-2026-9999'`,
        sql`positionen = '[]'`,
        sql`empfaenger = '{}'`,
        sql`leistung_bis = '2026-12-31'`,
        sql`ausgestellt_am = '2020-01-01'`,
        sql`status = 'entwurf'`,
      ])
        await refused(tx, sql`update buero.rechnungen set ${change} where ${where}`);
      await allowed(
        tx,
        sql`update buero.rechnungen set status = 'bezahlt', bezahlt_am = '2026-10-01' where ${where}`,
      );
    });
  });

  it("are neither deleted nor emptied", async () => {
    await imRollback(async (tx) => {
      const id = await gestellteRechnung(tx);
      await refused(tx, sql`delete from buero.rechnungen where id = ${id}`);
      await refused(tx, sql`truncate buero.rechnungen cascade`);
    });
  });

  it("keep the XRechnung first handed out, byte for byte", async () => {
    await imRollback(async (tx) => {
      const id = await gestellteRechnung(tx);
      const first = await xrechnungFuer(id, tx);
      const [row] = await tx.select().from(rechnungen).where(eq(rechnungen.id, id));
      expect(row!.archivXml).toBe(first.xml);
      expect(row!.archivSha256).toMatch(/^[0-9a-f]{64}$/);
      expect((await xrechnungFuer(id, tx)).xml).toBe(first.xml);

      await refused(tx, sql`update buero.rechnungen set archiv_xml = '<x/>' where id = ${id}`);
      await refused(tx, sql`update buero.rechnungen set archiv_sha256 = null where id = ${id}`);
      await refused(
        tx,
        sql`update buero.rechnungen set archiv_xml = null, archiv_sha256 = null where id = ${id}`,
      );
    });
  });

  it("do not hand out an archive that no longer matches its hash", async () => {
    await imRollback(async (tx) => {
      const id = await gestellteRechnung(tx);
      await xrechnungFuer(id, tx);
      await tx.execute(sql`alter table buero.rechnungen disable trigger rechnungen_festschreibung`);
      await tx.execute(
        sql`update buero.rechnungen set archiv_xml = archiv_xml || ' ' where id = ${id}`,
      );
      await tx.execute(sql`alter table buero.rechnungen enable trigger rechnungen_festschreibung`);
      await expect(xrechnungFuer(id, tx)).rejects.toThrow(/Prüfsumme/);
    });
  });
});

describe.skipIf(!process.env.DATABASE_URL)("GoBD: the archived PDF", () => {
  it("is the first one handed out, byte for byte, with the ZUGFeRD XML inside", async () => {
    await imRollback(async (tx) => {
      const id = await gestellteRechnung(tx);
      const first = await pdfFuer(id, tx);
      expect(first.zugferd).toBe(true);
      expect(Buffer.from(first.pdf).subarray(0, 5).toString()).toBe("%PDF-");
      expect(Buffer.from(first.pdf).includes("factur-x.xml")).toBe(true);
      const again = await pdfFuer(id, tx);
      expect(Buffer.from(again.pdf).equals(Buffer.from(first.pdf))).toBe(true);
      const [row] = await tx.select().from(rechnungPdfs).where(eq(rechnungPdfs.rechnungId, id));
      expect(row!.sha256).toMatch(/^[0-9a-f]{64}$/);
    });
  }, 30_000);

  it("is neither changed, deleted nor emptied", async () => {
    await imRollback(async (tx) => {
      const id = await gestellteRechnung(tx);
      await pdfFuer(id, tx);
      await refused(
        tx,
        sql`update buero.rechnung_pdfs set pdf = '\\x00' where rechnung_id = ${id}`,
      );
      await refused(
        tx,
        sql`update buero.rechnung_pdfs set sha256 = ${"0".repeat(64)} where rechnung_id = ${id}`,
      );
      await refused(tx, sql`delete from buero.rechnung_pdfs where rechnung_id = ${id}`);
      await refused(tx, sql`truncate buero.rechnung_pdfs`);
    });
  }, 30_000);

  it("exists only for an issued invoice", async () => {
    await imRollback(async (tx) => {
      const id = await entwurf(tx);
      await refused(
        tx,
        sql`insert into buero.rechnung_pdfs (rechnung_id, pdf, sha256, zugferd) values (${id}, '\\x00', ${"0".repeat(64)}, false)`,
        /gestellte Rechnung/,
      );
      await expect(pdfFuer(id, tx)).rejects.toThrow(/Entwurf/);
    });
  });

  it("is not handed out once it no longer matches its hash", async () => {
    await imRollback(async (tx) => {
      const id = await gestellteRechnung(tx);
      await pdfFuer(id, tx);
      await tx.execute(
        sql`alter table buero.rechnung_pdfs disable trigger rechnung_pdfs_unveraendert`,
      );
      await tx.execute(
        sql`update buero.rechnung_pdfs set pdf = pdf || '\\x20'::bytea where rechnung_id = ${id}`,
      );
      await tx.execute(
        sql`alter table buero.rechnung_pdfs enable trigger rechnung_pdfs_unveraendert`,
      );
      await expect(pdfFuer(id, tx)).rejects.toThrow(/Prüfsumme/);
    });
  }, 30_000);
});
