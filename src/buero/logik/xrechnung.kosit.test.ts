// @vitest-environment node
// XRechnung conformance, measured against the real KoSIT validator — not assumed. Skipped unless
// KOSIT_URL points at one; start it locally with
//   docker run -d --rm -p 127.0.0.1:8083:8081 \
//     apps4everything/kosit-validator-xrechnung@sha256:10644cdaa950e6ad3598426df95a4e7efdee7ba02e3265524829f50d673e3bad
//   KOSIT_URL=http://127.0.0.1:8083 pnpm exec vitest run src/buero/logik/xrechnung.kosit.test.ts
// The daemon answers 200 with <rep:accept>, 406 with <rep:reject>; rule ids sit in the report's
// findings table (boden/tests/services/xrechnung-conformance.live.test.ts).
import { describe, expect, it } from "vitest";

import { beispiel } from "./xrechnung.beispiel";
import { xrechnungXml, type XRechnungDaten } from "./xrechnung";

const KOSIT_URL = process.env.KOSIT_URL;

async function pruefe(daten: XRechnungDaten) {
  const res = await fetch(`${KOSIT_URL}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xrechnungXml(daten),
  });
  const text = await res.text();
  const regeln = [...text.matchAll(/<td[^>]*>((?:BR|PEPPOL|UBL|CII)-[A-Z0-9-]+)<\/td>/g)].map(
    (m) => m[1],
  );
  return { akzeptiert: res.status === 200 && !text.includes("<rep:reject"), regeln };
}

describe.skipIf(!KOSIT_URL)(
  "every invoice this office can issue passes the KoSIT validator",
  () => {
    const faelle: [string, XRechnungDaten][] = [
      ["an invoice with two VAT rates", beispiel],
      ["a Kleinunternehmer's invoice", { ...beispiel, kleinunternehmer: true }],
      [
        "a Storno correcting an invoice",
        {
          ...beispiel,
          nummer: "RE-2026-0002",
          typ: "384",
          korrigiert: "RE-2026-0001",
          positionen: beispiel.positionen.map((p) => ({ ...p, menge: -p.menge })),
        },
      ],
      [
        "an invoice on account (Abschlagsrechnung)",
        { ...beispiel, nummer: "RE-2026-0003", typ: "326" },
      ],
      [
        "a final invoice deducting two invoices on account",
        {
          ...beispiel,
          nummer: "RE-2026-0006",
          vorherige: ["RE-2026-0003", "RE-2026-0004"],
          vorausbezahlt: 50000,
        },
      ],
      [
        "the Storno of a final invoice, taking its deductions back",
        {
          ...beispiel,
          nummer: "RE-2026-0007",
          typ: "384",
          korrigiert: "RE-2026-0006",
          positionen: beispiel.positionen.map((p) => ({ ...p, menge: -p.menge })),
          vorausbezahlt: -50000,
        },
      ],
      [
        "an invoice to an authority by Leitweg-ID, on one service day",
        {
          ...beispiel,
          leistungVon: "2026-09-15",
          leistungBis: null,
          empfaenger: { ...beispiel.empfaenger, leitwegId: "991-33333TEST-33" },
          hinweise: ["Vielen Dank für den Auftrag."],
        },
      ],
    ];

    for (const [name, daten] of faelle) {
      it(name, async () => {
        const urteil = await pruefe(daten);
        expect(urteil.regeln).toEqual([]);
        expect(urteil.akzeptiert).toBe(true);
      });
    }

    it("rejects a document broken on purpose: a validator that accepts everything is broken", async () => {
      const urteil = await pruefe({
        ...beispiel,
        verkaeufer: { ...beispiel.verkaeufer, telefon: null },
      });
      expect(urteil.akzeptiert).toBe(false);
    });
  },
);
