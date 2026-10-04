import { describe, expect, it } from "vitest";

import { buchungenCsv } from "./export";

describe("buchungenCsv", () => {
  it("writes the German CSV Excel opens: BOM, semicolons, comma decimals, German dates", () => {
    const csv = buchungenCsv([
      {
        datum: "2026-11-21",
        uhrzeit: "14:00",
        nummer: "BU-2026-0001",
        status: "bestaetigt",
        kunde: 'Müller; "Familie"',
        ort: "Hanau",
        summe: "299.00",
        anzahlung: "74.75",
        stornogebuehr: "",
        zahlungsart: "mollie",
      },
    ]);
    const [kopf, zeile, ende] = csv.replace(/^﻿/, "").split("\r\n");
    expect(csv.startsWith("﻿")).toBe(true);
    expect(kopf).toBe(
      "Datum;Uhrzeit;Buchung;Status;Kunde;Ort;Summe;Anzahlung;Stornogebühr;Zahlungsart",
    );
    expect(zeile).toBe(
      '21.11.2026;14:00;BU-2026-0001;Bestätigt;"Müller; ""Familie""";Hanau;299,00;74,75;;Mollie',
    );
    expect(ende).toBe("");
  });
});
