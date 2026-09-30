import { describe, expect, it } from "vitest";

import { dokumentNummer, kannWechseln, naechstesVertragsende } from "./ablauf";

describe("dokumentNummer", () => {
  it("pads the running number per prefix and year", () => {
    expect(dokumentNummer("RE", 2026, 7)).toBe("RE-2026-0007");
    expect(dokumentNummer("AU", 2027, 12345)).toBe("AU-2027-12345");
  });
});

describe("kannWechseln", () => {
  it("lets an order move forward through its life, or be cancelled before it is billed", () => {
    expect(kannWechseln("auftrag", "angebot", "beauftragt")).toBe(true);
    expect(kannWechseln("auftrag", "in_arbeit", "abgenommen")).toBe(true);
    expect(kannWechseln("auftrag", "in_arbeit", "storniert")).toBe(true);
    expect(kannWechseln("auftrag", "abgerechnet", "storniert")).toBe(false);
    expect(kannWechseln("auftrag", "angebot", "abgerechnet")).toBe(false);
  });

  it("keeps an issued invoice issued: paid or cancelled by Storno, never a draft again", () => {
    expect(kannWechseln("rechnung", "entwurf", "gestellt")).toBe(true);
    expect(kannWechseln("rechnung", "gestellt", "bezahlt")).toBe(true);
    expect(kannWechseln("rechnung", "bezahlt", "storniert")).toBe(true);
    expect(kannWechseln("rechnung", "gestellt", "entwurf")).toBe(false);
  });

  it("ends a contract only once it is active", () => {
    expect(kannWechseln("vertrag", "entwurf", "aktiv")).toBe(true);
    expect(kannWechseln("vertrag", "aktiv", "gekuendigt")).toBe(true);
    expect(kannWechseln("vertrag", "gekuendigt", "beendet")).toBe(true);
    expect(kannWechseln("vertrag", "entwurf", "gekuendigt")).toBe(false);
  });
});

describe("naechstesVertragsende", () => {
  const vertrag = {
    beginn: "2026-01-01",
    laufzeitMonate: 12,
    verlaengerungMonate: 12,
    kuendigungsfristMonate: 3,
  };

  it("ends after the minimum term when notice can still be given in time", () => {
    expect(naechstesVertragsende(vertrag, "2026-06-15")).toEqual({
      ende: "2026-12-31",
      kuendigenBis: "2026-09-30",
    });
  });

  it("rolls over by the renewal period once the notice date has passed", () => {
    expect(naechstesVertragsende(vertrag, "2026-10-01")).toEqual({
      ende: "2027-12-31",
      kuendigenBis: "2027-09-30",
    });
  });

  it("ends by itself after the term when there is no renewal", () => {
    expect(naechstesVertragsende({ ...vertrag, verlaengerungMonate: null }, "2026-11-20")).toEqual({
      ende: "2026-12-31",
      kuendigenBis: null,
    });
  });

  it("without a minimum term, ends at the month's end once the notice has run", () => {
    expect(
      naechstesVertragsende(
        {
          beginn: "2026-01-01",
          laufzeitMonate: null,
          verlaengerungMonate: null,
          kuendigungsfristMonate: 1,
        },
        "2026-03-10",
      ),
    ).toEqual({ ende: "2026-04-30", kuendigenBis: "2026-03-10" });
  });
});
