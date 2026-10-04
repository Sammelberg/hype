import { describe, expect, it } from "vitest";

import {
  DarstellerSchema,
  EinstellungenSchema,
  ExtraSchema,
  FigurSchema,
  PaketSchema,
  StadtSchema,
  slugAus,
  ZoneSchema,
} from "./schemas";

const fehler = (r: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) => Object.fromEntries((r.error?.issues ?? []).map((i) => [i.path.join("."), i.message]));

describe("FigurSchema", () => {
  const figur = {
    slug: "eisprinzessin",
    name: "Eisprinzessin",
    kategorie: "prinzessinnen",
    alterVon: 3,
    alterBis: 8,
    sprachen: ["de", "uk"],
    kurz: "",
    beschreibung: "",
    programm: ["Tanz", "Quiz"],
    aktiv: true,
    sort: 0,
    fotos: [12, 7],
    metaTitle: "",
    metaDescription: "",
  };

  it("accepts a character and turns empty texts into null", () => {
    const r = FigurSchema.parse(figur);
    expect(r.kurz).toBeNull();
    expect(r.fotos).toEqual([12, 7]);
  });

  it("asks for a web address in small letters and an age range that makes sense", () => {
    const r = FigurSchema.safeParse({ ...figur, slug: "Eis Prinzessin", alterVon: 9, alterBis: 4 });
    expect(fehler(r)).toMatchObject({
      slug: "Nur Kleinbuchstaben, Ziffern und Bindestriche.",
      alterBis: "Das Höchstalter liegt unter dem Mindestalter.",
    });
  });

  it("needs at least one host language and drops empty programme lines", () => {
    expect(fehler(FigurSchema.safeParse({ ...figur, sprachen: [] }))).toMatchObject({
      sprachen: "Bitte mindestens eine Sprache wählen.",
    });
    expect(FigurSchema.parse({ ...figur, programm: ["Tanz", " ", ""] }).programm).toEqual(["Tanz"]);
  });
});

describe("PaketSchema", () => {
  const paket = {
    slug: "klassik",
    name: "Klassik",
    beschreibung: "",
    leistungen: ["Spiele"],
    dauerMin: 90,
    preis: 249,
    figurenAnzahl: 1,
    nurAnfrage: false,
    aktiv: true,
    sort: 0,
  };

  it("needs a duration and a price for a package that books itself", () => {
    expect(fehler(PaketSchema.safeParse({ ...paket, dauerMin: null, preis: null }))).toMatchObject({
      dauerMin: "Ein buchbares Paket braucht eine Dauer.",
      preis: "Ein buchbares Paket braucht einen Preis.",
    });
  });

  it("lets an on-request package go without them", () => {
    expect(
      PaketSchema.safeParse({ ...paket, dauerMin: null, preis: null, nurAnfrage: true }).success,
    ).toBe(true);
  });
});

describe("other master data", () => {
  it("checks a performer's e-mail", () => {
    expect(
      fehler(
        DarstellerSchema.safeParse({
          name: "Anna",
          email: "anna@",
          telefon: "",
          aktiv: true,
          prioritaet: 100,
          notiz: "",
          figuren: [],
        }),
      ),
    ).toMatchObject({ email: "Bitte eine gültige E-Mail-Adresse." });
  });

  it("keeps an extra's lead time and extra minutes at zero or more", () => {
    const r = ExtraSchema.safeParse({
      slug: "kerze",
      name: "Kerzenarrangement",
      beschreibung: "",
      preis: 45,
      dauerDeltaMin: -5,
      vorlaufTage: -1,
      zusatzFigur: false,
      nurAnfrage: false,
      aktiv: true,
      sort: 0,
    });
    expect(Object.keys(fehler(r)).sort()).toEqual(["dauerDeltaMin", "vorlaufTage"]);
  });

  it("names a zone by one or two capital letters", () => {
    expect(
      fehler(
        ZoneSchema.safeParse({
          code: "a",
          name: "Zone A",
          aufschlag: 0,
          fahrtMinuten: 20,
          nurAnfrage: false,
          sort: 0,
        }),
      ),
    ).toMatchObject({ code: "Ein oder zwei Großbuchstaben, z. B. A." });
  });

  it("needs a landing page text before a city gets its own page", () => {
    expect(
      fehler(
        StadtSchema.safeParse({
          name: "Hanau",
          slug: "hanau",
          zoneCode: "B",
          seite: true,
          intro: "",
          bezirke: "",
          orte: "",
          bedingungen: "",
          metaTitle: "",
          metaDescription: "",
          sort: 0,
        }),
      ),
    ).toMatchObject({ intro: "Eine eigene Seite braucht einen Einleitungstext." });
  });

  it("keeps the last start after the first and the deposit between 0 and 100 %", () => {
    const r = EinstellungenSchema.safeParse({
      vorbereitungMin: 20,
      abbauMin: 15,
      rasterMin: 30,
      ersterStart: "18:00",
      letzterStart: "10:00",
      anzahlungProzent: 120,
      haltenMin: 30,
      haltenLastschriftMin: 4320,
      mindestVorlaufStd: 48,
    });
    expect(fehler(r)).toMatchObject({
      letzterStart: "Der letzte Beginn liegt vor dem ersten.",
      anzahlungProzent: "Zwischen 0 und 100 %.",
    });
  });
});

describe("slugAus", () => {
  it("turns a German name into a web address", () => {
    expect(slugAus("Superheld in Rot")).toBe("superheld-in-rot");
    expect(slugAus("Märchenfee & Zauberer")).toBe("maerchenfee-zauberer");
    expect(slugAus("  Weißer Bär!  ")).toBe("weisser-baer");
  });
});
