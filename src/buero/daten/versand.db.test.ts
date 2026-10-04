// @vitest-environment node
// Runs against DATABASE_URL inside one transaction that is rolled back (an issued invoice must
// never be committed by a test), with a stand-in for the mail server.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db, type Tx } from "../../cms/db/client";
import type { sendMail } from "../../cms/mail/send";
import { kundenHistorie } from "../db/schema";
import { firma as firmaBeispiel } from "../logik/xrechnung.beispiel";
import { saveFirma } from "./firma";
import { createKunde } from "./kunden";
import { createRechnung, stelleRechnung } from "./rechnungen";
import { versendeRechnung } from "./versand";

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

type Gesendet = Parameters<typeof sendMail>;

async function rechnung(tx: Tx, stellen = true) {
  await saveFirma(firmaBeispiel, tx);
  const kundeId = await createKunde(
    {
      art: "firma",
      firma: "Versand Test GmbH",
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
    },
    tx,
  );
  const id = await createRechnung(
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
          menge: 2,
          einheit: "HUR",
          einzelpreis: 100,
          ustSatz: 19,
        },
      ],
    },
    tx,
  );
  const nummer = stellen ? await stelleRechnung(id, tx) : null;
  return { id, kundeId, nummer };
}

const pdf = new TextEncoder().encode("%PDF-1.7\n% Testdatei\n");

describe.skipIf(!process.env.DATABASE_URL)("sending an invoice", () => {
  it("attaches the archived XRechnung and the PDF and writes the customer's history", async () => {
    await imRollback(async (tx) => {
      const { id, kundeId, nummer } = await rechnung(tx);
      const gesendet: Gesendet[] = [];
      const senden = (async (...args: Gesendet) => {
        gesendet.push(args);
        return { messageId: "<test>" };
      }) as unknown as typeof sendMail;

      const result = await versendeRechnung(
        {
          id,
          to: " buchhaltung@example.com ",
          subject: `Rechnung ${nummer}`,
          text: "Anbei.",
          xrechnung: true,
          pdf: { name: "Druck: Rechnung!.pdf", bytes: pdf },
        },
        { userId: null, autor: "Test" },
        { senden, client: tx },
      );
      expect(result.anhaenge).toEqual([`${nummer}.xml`, "Druck Rechnung.pdf"]);
      const [mail, log] = gesendet[0]!;
      expect(mail.to).toBe("buchhaltung@example.com");
      expect(mail.attachments?.[0]?.contentType).toBe("application/xml");
      expect(String(mail.attachments?.[0]?.content)).toContain(`<cbc:ID>${nummer}</cbc:ID>`);
      expect(log).toEqual({ kind: "rechnung", sentById: null, target: { type: "rechnung", id } });

      const historie = await tx
        .select()
        .from(kundenHistorie)
        .where(eq(kundenHistorie.kundeId, kundeId));
      expect(historie).toHaveLength(1);
      expect(historie[0]).toMatchObject({ art: "email", autor: "Test" });
      expect(historie[0]!.text).toContain(
        `Rechnung ${nummer} per E-Mail an buchhaltung@example.com`,
      );
    });
  });

  it("refuses a draft, a fake PDF and a mail without attachment, sending nothing", async () => {
    await imRollback(async (tx) => {
      let calls = 0;
      const senden = (async () => {
        calls++;
        return {};
      }) as unknown as typeof sendMail;
      const base = { to: "a@example.com", subject: "Rechnung", text: "Anbei." };

      const entwurf = await rechnung(tx, false);
      await expect(
        versendeRechnung(
          { ...base, id: entwurf.id, xrechnung: true, pdf: null },
          { userId: null, autor: null },
          { senden, client: tx },
        ),
      ).rejects.toThrow(/Entwurf/);

      const { id } = await rechnung(tx);
      await expect(
        versendeRechnung(
          { ...base, id, xrechnung: false, pdf: { name: "x.pdf", bytes: new Uint8Array([1, 2]) } },
          { userId: null, autor: null },
          { senden, client: tx },
        ),
      ).rejects.toThrow(/kein PDF/);
      await expect(
        versendeRechnung(
          { ...base, id, xrechnung: false, pdf: null },
          { userId: null, autor: null },
          { senden, client: tx },
        ),
      ).rejects.toThrow(/XRechnung oder das PDF/);
      await expect(
        versendeRechnung(
          { ...base, id, to: "kein-at", xrechnung: true, pdf: null },
          { userId: null, autor: null },
          { senden, client: tx },
        ),
      ).rejects.toThrow(/Empfängeradresse/);
      expect(calls).toBe(0);
    });
  });
});
