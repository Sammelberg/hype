import { describe, expect, it } from "vitest";

import {
  DATEV_VORGABE,
  datevBuchungsstapel,
  journalCsv,
  letztesQuartal,
  type JournalRechnung,
  ustCsv,
  ustNachMonat,
  zeitraum,
} from "./export";

const pos = (einzelpreis: number, ustSatz: 19 | 7, menge = 1) => ({
  id: `p${einzelpreis}`,
  bezeichnung: "Leistung",
  menge,
  einheit: "LS" as const,
  einzelpreis,
  ustSatz,
});

const rechnung = (over: Partial<JournalRechnung> = {}): JournalRechnung => ({
  nummer: "RE-2026-0001",
  typ: "rechnung",
  art: "Rechnung",
  ausgestelltAm: "2026-09-14",
  faelligAm: "2026-09-28",
  kundeNummer: "KD-0001",
  kundeName: "Krone Parkett GmbH",
  positionen: [pos(1000, 19), pos(100, 7)],
  kleinunternehmer: false,
  status: "gestellt",
  bezahltAm: null,
  korrigiert: null,
  ...over,
});

describe("journalCsv", () => {
  it("writes one German line per invoice, with a BOM so Excel reads the umlauts", () => {
    const csv = journalCsv([rechnung()]);
    expect(csv.startsWith("﻿Rechnungsnummer;Art;Rechnungsdatum")).toBe(true);
    expect(csv.split("\r\n")[1]).toBe(
      "RE-2026-0001;Rechnung;14.09.2026;28.09.2026;KD-0001;Krone Parkett GmbH;1100,00;190,00;7,00;1297,00;gestellt;;",
    );
  });

  it("quotes a field with a semicolon or quote in it", () => {
    const csv = journalCsv([rechnung({ kundeName: 'Holz; "Meister"' })]);
    expect(csv).toContain(';"Holz; ""Meister""";');
  });

  it("shows a Storno with negative amounts and the invoice it corrects", () => {
    const csv = journalCsv([
      rechnung({
        nummer: "RE-2026-0002",
        typ: "storno",
        positionen: [pos(1000, 19, -1)],
        korrigiert: "RE-2026-0001",
      }),
    ]);
    expect(csv.split("\r\n")[1]).toContain(";Storno;");
    expect(csv.split("\r\n")[1]).toContain(";-1000,00;-190,00;0,00;-1190,00;");
    expect(csv.split("\r\n")[1]!.endsWith(";RE-2026-0001")).toBe(true);
  });
});

describe("ustNachMonat", () => {
  it("adds revenue and VAT per month and rate, Stornos subtracting", () => {
    const monate = ustNachMonat([
      rechnung(),
      rechnung({ nummer: "RE-2026-0002", ausgestelltAm: "2026-09-20", positionen: [pos(500, 19)] }),
      rechnung({
        nummer: "RE-2026-0003",
        typ: "storno",
        ausgestelltAm: "2026-10-02",
        positionen: [pos(500, 19, -1)],
      }),
      rechnung({
        nummer: "RE-2026-0004",
        ausgestelltAm: "2026-10-05",
        kleinunternehmer: true,
        positionen: [pos(200, 19)],
      }),
    ]);
    expect(monate).toEqual([
      {
        monat: "2026-09",
        netto19: 150000,
        ust19: 28500,
        netto7: 10000,
        ust7: 700,
        netto0: 0,
        brutto: 189200,
        anzahl: 2,
      },
      {
        monat: "2026-10",
        netto19: -50000,
        ust19: -9500,
        netto7: 0,
        ust7: 0,
        netto0: 20000,
        brutto: -39500,
        anzahl: 2,
      },
    ]);
    expect(ustCsv(monate).split("\r\n")[1]).toBe(
      "09/2026;2;1500,00;285,00;100,00;7,00;0,00;1892,00",
    );
  });
});

describe("datevBuchungsstapel", () => {
  const einstellungen = {
    beraternummer: 1001,
    mandantennummer: 1,
    kontenrahmen: "03" as const,
    sachkontenlaenge: 4,
    ...DATEV_VORGABE["03"],
  };

  it("opens with the EXTF header for a booking batch of the period", () => {
    const [kopf, spalten] = datevBuchungsstapel({
      rechnungen: [],
      einstellungen,
      von: "2026-09-01",
      bis: "2026-09-30",
      erzeugt: "20261001120000000",
    }).split("\r\n");
    const f = kopf!.split(";");
    expect(f.slice(0, 6)).toEqual([
      '"EXTF"',
      "700",
      "21",
      '"Buchungsstapel"',
      "13",
      "20261001120000000",
    ]);
    expect(f[10]).toBe("1001");
    expect(f[11]).toBe("1");
    expect(f[12]).toBe("20260101");
    expect(f[13]).toBe("4");
    expect(f[14]).toBe("20260901");
    expect(f[15]).toBe("20260930");
    expect(f[21]).toBe('"EUR"');
    expect(f[26]).toBe('"03"');
    expect(spalten!.startsWith("Umsatz (ohne Soll/Haben-Kz);Soll/Haben-Kennzeichen")).toBe(true);
  });

  it("books each VAT rate of an invoice gross against its automatic revenue account", () => {
    const zeilen = datevBuchungsstapel({
      rechnungen: [rechnung()],
      einstellungen,
      von: "2026-09-01",
      bis: "2026-09-30",
      erzeugt: "20261001120000000",
    }).split("\r\n");
    expect(zeilen[2]).toBe(
      '1190,00;"S";"EUR";;;"";10000;8400;"";1409;"RE-2026-0001";"280926";;"Krone Parkett GmbH"',
    );
    expect(zeilen[3]!.startsWith('107,00;"S";"EUR";;;"";10000;8300;')).toBe(true);
  });

  it("credits the customer for a Storno and books a Kleinunternehmer's revenue on its own account", () => {
    const zeilen = datevBuchungsstapel({
      rechnungen: [
        rechnung({ typ: "storno", positionen: [pos(1000, 19, -1)] }),
        rechnung({ nummer: "RE-2026-0009", kleinunternehmer: true, positionen: [pos(300, 19)] }),
      ],
      einstellungen,
      von: "2026-09-01",
      bis: "2026-09-30",
      erzeugt: "20261001120000000",
    }).split("\r\n");
    expect(zeilen[2]!.startsWith('1190,00;"H";"EUR";;;"";10000;8400;')).toBe(true);
    expect(zeilen[3]!.startsWith('300,00;"S";"EUR";;;"";10000;8195;')).toBe(true);
  });
});

describe("zeitraum", () => {
  it("reads a month, a quarter and a year", () => {
    expect(zeitraum("2026-02")).toEqual({
      schluessel: "2026-02",
      name: "Februar 2026",
      von: "2026-02-01",
      bis: "2026-02-28",
    });
    expect(zeitraum("2026-Q3")).toMatchObject({ von: "2026-07-01", bis: "2026-09-30" });
    expect(zeitraum("2028")).toMatchObject({ von: "2028-01-01", bis: "2028-12-31" });
    expect(zeitraum("2026-13")).toBeNull();
    expect(zeitraum("irgendwas")).toBeNull();
  });

  it("proposes the quarter before today's", () => {
    expect(letztesQuartal("2026-10-01")).toBe("2026-Q3");
    expect(letztesQuartal("2027-02-10")).toBe("2026-Q4");
  });
});
