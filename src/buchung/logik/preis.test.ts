import { describe, expect, it } from "vitest";

import { abPreisCent, preisAngebot } from "./preis";

describe("preisAngebot", () => {
  it("lists package, travel and extras line by line, with the total and the deposit", () => {
    const a = preisAngebot({
      paket: { name: "Klassik", preisCent: 24900 },
      zone: { name: "Frankfurt (Zone C)", aufschlagCent: 4000 },
      extras: [{ name: "Kinderschminken", preisCent: 3000 }],
      anzahlungProzent: 25,
      kleinunternehmer: false,
    });
    expect(a.positionen).toEqual([
      { art: "paket", bezeichnung: "Klassik", cent: 24900 },
      { art: "zone", bezeichnung: "Anfahrt Frankfurt (Zone C)", cent: 4000 },
      { art: "extra", bezeichnung: "Kinderschminken", cent: 3000 },
    ]);
    expect(a.summeCent).toBe(31900);
    expect(a.anzahlungCent).toBe(7975);
    expect(a.hinweis).toBe("Alle Preise sind Endpreise inkl. gesetzlicher MwSt.");
  });

  it("shows the home zone's travel as included rather than leaving it out", () => {
    const a = preisAngebot({
      paket: { name: "Mini", preisCent: 14900 },
      zone: { name: "Aschaffenburg (Zone A)", aufschlagCent: 0 },
      extras: [],
      anzahlungProzent: 30,
      kleinunternehmer: false,
    });
    expect(a.positionen[1]).toEqual({
      art: "zone",
      bezeichnung: "Anfahrt Aschaffenburg (Zone A)",
      cent: 0,
    });
    expect(a.anzahlungCent).toBe(4470);
  });

  it("rounds the deposit half away from zero to the cent", () => {
    const a = preisAngebot({
      paket: { name: "Mini", preisCent: 14999 },
      zone: { name: "A", aufschlagCent: 0 },
      extras: [],
      anzahlungProzent: 25,
      kleinunternehmer: false,
    });
    // 14999 × 25 % = 3749.75 cents
    expect(a.anzahlungCent).toBe(3750);
  });

  it("carries the § 19 note instead of VAT for a small business", () => {
    const a = preisAngebot({
      paket: { name: "Mini", preisCent: 14900 },
      zone: { name: "A", aufschlagCent: 0 },
      extras: [],
      anzahlungProzent: 25,
      kleinunternehmer: true,
    });
    expect(a.hinweis).toBe("Gemäß §19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.");
  });
});

describe("abPreisCent", () => {
  it("is the cheapest package that books itself, for the „ab … €“ on a character's card", () => {
    expect(
      abPreisCent([
        { preisCent: 24900, nurAnfrage: false },
        { preisCent: 14900, nurAnfrage: false },
        { preisCent: null, nurAnfrage: true },
      ]),
    ).toBe(14900);
    expect(abPreisCent([{ preisCent: null, nurAnfrage: true }])).toBeNull();
  });
});
