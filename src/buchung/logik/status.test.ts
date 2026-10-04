import { describe, expect, it } from "vitest";

import { belegt, kannWechseln } from "./status";

describe("kannWechseln", () => {
  it("lets an Anfrage be held, confirmed or declined", () => {
    expect(kannWechseln("anfrage", "reserviert")).toBe(true);
    expect(kannWechseln("anfrage", "bestaetigt")).toBe(true);
    expect(kannWechseln("anfrage", "abgelehnt")).toBe(true);
  });

  it("lets a held slot be paid, lapse or be cancelled", () => {
    expect(kannWechseln("reserviert", "bestaetigt")).toBe(true);
    expect(kannWechseln("reserviert", "verfallen")).toBe(true);
    expect(kannWechseln("reserviert", "storniert")).toBe(true);
  });

  it("lets a confirmed Buchung be cancelled or done, nothing else", () => {
    expect(kannWechseln("bestaetigt", "storniert")).toBe(true);
    expect(kannWechseln("bestaetigt", "abgeschlossen")).toBe(true);
    expect(kannWechseln("bestaetigt", "reserviert")).toBe(false);
    expect(kannWechseln("bestaetigt", "verfallen")).toBe(false);
  });

  it("keeps the end states final", () => {
    for (const ende of ["abgelehnt", "verfallen", "storniert", "abgeschlossen"] as const) {
      expect(kannWechseln(ende, "bestaetigt")).toBe(false);
      expect(kannWechseln(ende, "reserviert")).toBe(false);
    }
  });
});

describe("belegt", () => {
  it("takes the performers only while a Buchung is held or confirmed", () => {
    expect(belegt("reserviert")).toBe(true);
    expect(belegt("bestaetigt")).toBe(true);
    expect(belegt("anfrage")).toBe(false);
    expect(belegt("verfallen")).toBe(false);
    expect(belegt("storniert")).toBe(false);
    expect(belegt("abgeschlossen")).toBe(false);
  });
});
