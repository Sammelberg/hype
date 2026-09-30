import { describe, expect, it } from "vitest";

import { centAusBetrag, euro, rechnungsSummen } from "./geld";

describe("rechnungsSummen", () => {
  it("adds lines per VAT rate and taxes each group once, in whole cents", () => {
    const summen = rechnungsSummen(
      [
        { menge: 12.5, einzelpreis: 95, ustSatz: 19 },
        { menge: 1, einzelpreis: 49.99, ustSatz: 19 },
        { menge: 3, einzelpreis: 10.1, ustSatz: 7 },
      ],
      false,
    );
    // 1187.50 + 49.99 = 1237.49 at 19 % → 235.1231 → 235.12; 30.30 at 7 % → 2.121 → 2.12
    expect(summen.netto).toBe(126779);
    expect(summen.gruppen).toEqual([
      { satz: 19, netto: 123749, steuer: 23512 },
      { satz: 7, netto: 3030, steuer: 212 },
    ]);
    expect(summen.steuer).toBe(23724);
    expect(summen.brutto).toBe(150503);
  });

  it("rounds each line half away from zero before summing", () => {
    // 0.333 × 3.00 = 0.999 → 1.00; 2 × 0.005 → 0.01
    const summen = rechnungsSummen(
      [
        { menge: 0.333, einzelpreis: 3, ustSatz: 19 },
        { menge: 1, einzelpreis: 0.005, ustSatz: 19 },
      ],
      false,
    );
    expect(summen.netto).toBe(101);
  });

  it("charges no VAT for a Kleinunternehmer and keeps one exempt group", () => {
    const summen = rechnungsSummen([{ menge: 2, einzelpreis: 500, ustSatz: 19 }], true);
    expect(summen).toEqual({
      netto: 100000,
      gruppen: [{ satz: 0, netto: 100000, steuer: 0 }],
      steuer: 0,
      brutto: 100000,
    });
  });

  it("works for a Storno: negative quantities give negative totals", () => {
    const summen = rechnungsSummen([{ menge: -10, einzelpreis: 95, ustSatz: 19 }], false);
    expect(summen.netto).toBe(-95000);
    expect(summen.steuer).toBe(-18050);
    expect(summen.brutto).toBe(-113050);
  });
});

describe("euro", () => {
  it("formats cents the German way", () => {
    expect(euro(150503)).toBe("1.505,03 €");
    expect(euro(-95000)).toBe("-950,00 €");
  });

  it("reads a stored decimal string back to cents", () => {
    expect(centAusBetrag("1505.03")).toBe(150503);
    expect(centAusBetrag("-0.10")).toBe(-10);
  });
});
