import { describe, expect, it } from "vitest";

import {
  aboPosition,
  faelligeZeitraeume,
  MAX_ZEITRAEUME,
  schlussBetrag,
  typCode,
} from "./abrechnung";

describe("faelligeZeitraeume", () => {
  it("bills every started month up to the day, in advance", () => {
    expect(
      faelligeZeitraeume({
        beginn: "2026-08-01",
        intervall: "monatlich",
        abgerechnetBis: null,
        endetAm: null,
        stichtag: "2026-10-01",
      }),
    ).toEqual([
      { von: "2026-08-01", bis: "2026-08-31" },
      { von: "2026-09-01", bis: "2026-09-30" },
      { von: "2026-10-01", bis: "2026-10-31" },
    ]);
  });

  it("skips what was billed already", () => {
    expect(
      faelligeZeitraeume({
        beginn: "2026-08-01",
        intervall: "monatlich",
        abgerechnetBis: "2026-09-30",
        endetAm: null,
        stichtag: "2026-10-15",
      }),
    ).toEqual([{ von: "2026-10-01", bis: "2026-10-31" }]);
  });

  it("keeps a contract from the 31st on each month's last day", () => {
    expect(
      faelligeZeitraeume({
        beginn: "2026-01-31",
        intervall: "monatlich",
        abgerechnetBis: null,
        endetAm: null,
        stichtag: "2026-03-31",
      }),
    ).toEqual([
      { von: "2026-01-31", bis: "2026-02-27" },
      { von: "2026-02-28", bis: "2026-03-30" },
      { von: "2026-03-31", bis: "2026-04-29" },
    ]);
  });

  it("bills quarters and years, and cuts the last period at the contract's end", () => {
    expect(
      faelligeZeitraeume({
        beginn: "2026-01-01",
        intervall: "quartal",
        abgerechnetBis: null,
        endetAm: "2026-05-15",
        stichtag: "2026-12-31",
      }),
    ).toEqual([
      { von: "2026-01-01", bis: "2026-03-31" },
      { von: "2026-04-01", bis: "2026-05-15" },
    ]);
    expect(
      faelligeZeitraeume({
        beginn: "2025-07-01",
        intervall: "jaehrlich",
        abgerechnetBis: "2026-06-30",
        endetAm: null,
        stichtag: "2026-10-01",
      }),
    ).toEqual([{ von: "2026-07-01", bis: "2027-06-30" }]);
  });

  it("bills nothing before the start, and never more than a cap at once", () => {
    expect(
      faelligeZeitraeume({
        beginn: "2026-11-01",
        intervall: "monatlich",
        abgerechnetBis: null,
        endetAm: null,
        stichtag: "2026-10-01",
      }),
    ).toEqual([]);
    expect(
      faelligeZeitraeume({
        beginn: "2020-01-01",
        intervall: "monatlich",
        abgerechnetBis: null,
        endetAm: null,
        stichtag: "2026-10-01",
      }),
    ).toHaveLength(MAX_ZEITRAEUME);
  });
});

describe("aboPosition", () => {
  it("names the period and bills a month by the month, longer periods as a lump sum", () => {
    expect(
      aboPosition(
        { titel: "Betrieb und Wartung", verguetungNetto: 450, intervall: "monatlich" },
        { von: "2026-10-01", bis: "2026-10-31" },
        "p1",
      ),
    ).toEqual({
      id: "p1",
      bezeichnung: "Betrieb und Wartung, 1.10.2026 – 31.10.2026",
      menge: 1,
      einheit: "MON",
      einzelpreis: 450,
      ustSatz: 19,
    });
    expect(
      aboPosition(
        { titel: "Lizenz", verguetungNetto: 1200, intervall: "jaehrlich" },
        { von: "2026-01-01", bis: "2026-12-31" },
        "p2",
      ).einheit,
    ).toBe("LS");
  });
});

describe("schlussBetrag / typCode", () => {
  it("deducts every invoice on account from the final invoice", () => {
    expect(schlussBetrag(1_190_000, [357_000, 357_000])).toEqual({
      vorausbezahlt: 714_000,
      zahlbetrag: 476_000,
    });
  });

  it("codes an Abschlag as a partial invoice and a Storno as a correction", () => {
    expect(typCode("rechnung", "abschlag")).toBe("326");
    expect(typCode("rechnung", "schluss")).toBe("380");
    expect(typCode("rechnung", "abo")).toBe("380");
    expect(typCode("storno", "abschlag")).toBe("384");
  });
});
