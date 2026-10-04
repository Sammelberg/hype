import { describe, expect, it } from "vitest";

import {
  anfrageGrundVorab,
  angebotFuer,
  vorauswahl,
  zweiFigurenNoetig,
  type BuchungsExtra,
  type BuchungsPaket,
  type BuchungsStadt,
} from "./buchen";

const paket = (p: Partial<BuchungsPaket> = {}): BuchungsPaket => ({
  id: 1,
  slug: "klassik",
  name: "Klassik",
  beschreibung: null,
  dauerMin: 90,
  preisCent: 24900,
  figurenAnzahl: 1,
  nurAnfrage: false,
  ...p,
});
const stadt = (aufschlagCent: number, nurAnfrage = false): BuchungsStadt => ({
  id: 7,
  slug: "hanau",
  name: "Hanau",
  zone: { code: "B", name: "Hanau und Offenbach", aufschlagCent, nurAnfrage },
});
const extra = (x: Partial<BuchungsExtra> = {}): BuchungsExtra => ({
  id: 3,
  name: "Kinderschminken",
  beschreibung: null,
  preisCent: 3000,
  dauerDeltaMin: 20,
  vorlaufTage: 0,
  zusatzFigur: false,
  nurAnfrage: false,
  ...x,
});
const regeln = {
  anzahlungProzent: 25,
  kleinunternehmer: false,
  mindestVorlaufStd: 48,
  ersterStartMin: 600,
  letzterStartMin: 1080,
  rasterMin: 30,
};

describe("vorauswahl", () => {
  const daten = {
    figuren: [
      { id: 1, slug: "pirat", buchbar: true },
      { id: 2, slug: "fee", buchbar: false },
    ] as never,
    pakete: [paket()],
    staedte: [stadt(2000)],
  };

  it("starts the form with what the link names", () => {
    expect(
      vorauswahl({ figur: "pirat", paket: "klassik", ort: "hanau", sprache: "uk" }, daten),
    ).toEqual({
      figurId: 1,
      paketId: 1,
      stadtId: 7,
      sprache: "uk",
    });
  });

  it("drops what it does not know or cannot book", () => {
    expect(
      vorauswahl({ figur: "fee", paket: ["klassik"], ort: "mond", sprache: "fr" }, daten),
    ).toEqual({
      figurId: null,
      paketId: null,
      stadtId: null,
      sprache: null,
    });
  });
});

describe("zweiFigurenNoetig", () => {
  it("asks for a second Figur with a two-Figur Paket or the Extra for it", () => {
    expect(zweiFigurenNoetig(paket(), [])).toBe(false);
    expect(zweiFigurenNoetig(paket({ figurenAnzahl: 2 }), [])).toBe(true);
    expect(zweiFigurenNoetig(paket(), [extra({ zusatzFigur: true })])).toBe(true);
  });
});

describe("angebotFuer", () => {
  it("adds Paket, travel and Extras and names the Anzahlung", () => {
    const a = angebotFuer({ regeln }, { paket: paket(), stadt: stadt(2000), extras: [extra()] });
    expect(a?.positionen.map((p) => [p.bezeichnung, p.cent])).toEqual([
      ["Klassik", 24900],
      ["Anfahrt nach Hanau", 2000],
      ["Kinderschminken", 3000],
    ]);
    expect(a?.summeCent).toBe(29900);
    expect(a?.anzahlungCent).toBe(7475);
  });

  it("has no price while something is only on request or still missing", () => {
    expect(angebotFuer({ regeln }, { paket: null, stadt: stadt(0), extras: [] })).toBeNull();
    expect(
      angebotFuer({ regeln }, { paket: paket(), stadt: stadt(0, true), extras: [] }),
    ).toBeNull();
    expect(
      angebotFuer(
        { regeln },
        { paket: paket(), stadt: stadt(0), extras: [extra({ preisCent: null })] },
      ),
    ).toBeNull();
  });
});

describe("anfrageGrundVorab", () => {
  it("knows before the date when the form can only send an Anfrage", () => {
    expect(anfrageGrundVorab({ paket: paket(), stadt: stadt(0), extras: [] })).toBeNull();
    expect(anfrageGrundVorab({ paket: paket(), stadt: stadt(0, true), extras: [] })).toBe("zone");
    expect(anfrageGrundVorab({ paket: paket({ nurAnfrage: true }), stadt: null, extras: [] })).toBe(
      "paket",
    );
    expect(
      anfrageGrundVorab({ paket: paket(), stadt: stadt(0), extras: [extra({ nurAnfrage: true })] }),
    ).toBe("extra");
  });
});
