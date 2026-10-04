import { describe, expect, it } from "vitest";

import { type DokumentDaten, ibanLesbar, rechnungsBlatt } from "./blatt";
import { KLEINUNTERNEHMER_HINWEIS } from "./xrechnung";
import { beispiel } from "./xrechnung.beispiel";

const nbsp = (s: string) => s.replace(/ /g, " ");

const daten = (extra: Partial<DokumentDaten> = {}): DokumentDaten => ({
  nummer: beispiel.nummer,
  storno: false,
  ausgestelltAm: beispiel.ausgestelltAm,
  faelligAm: beispiel.faelligAm,
  leistungVon: beispiel.leistungVon,
  leistungBis: beispiel.leistungBis,
  verkaeufer: beispiel.verkaeufer,
  empfaenger: beispiel.empfaenger,
  kleinunternehmer: false,
  einleitung: null,
  schlusstext: null,
  positionen: beispiel.positionen,
  ...extra,
});

describe("rechnungsBlatt", () => {
  it("states number, dates, period and the tax per rate", () => {
    const blatt = rechnungsBlatt(daten({ kundennummer: "K-0001" }));
    expect(blatt.ueberschrift).toBe("Rechnung RE-2026-0001");
    expect(blatt.meta).toEqual([
      { label: "Rechnungsnummer", wert: "RE-2026-0001" },
      { label: "Rechnungsdatum", wert: "1.10.2026" },
      { label: "Kundennummer", wert: "K-0001" },
      { label: "Leistung", wert: "1.9.2026 bis 30.9.2026" },
    ]);
    expect(blatt.summen.map((s) => [s.label, nbsp(s.wert)].map(nbsp))).toEqual([
      ["Summe netto", "1.229,50 €"],
      ["USt 19 % auf 1.187,50 €", "225,63 €"],
      ["USt 7 % auf 42,00 €", "2,94 €"],
      ["Gesamtbetrag", "1.458,07 €"],
    ]);
    expect(blatt.posten[0]).toMatchObject({ pos: "1", menge: "12,5 Stunde" });
    expect(blatt.hinweise.at(-1)).toContain(`bis zum 15.10.2026`);
    expect(blatt.hinweise.at(-1)).toContain(ibanLesbar("DE02120300000000202051"));
  });

  it("shows a Kleinunternehmer's invoice without tax and with the §19 note", () => {
    const blatt = rechnungsBlatt(daten({ kleinunternehmer: true }));
    expect(blatt.mitUst).toBe(false);
    expect(blatt.summen.map((s) => s.label)).toEqual(["Summe netto", "Gesamtbetrag"]);
    expect(blatt.hinweise[0]).toBe(KLEINUNTERNEHMER_HINWEIS);
  });

  it("names the corrected invoice on a Storno", () => {
    const blatt = rechnungsBlatt(daten({ storno: true, korrigiert: "RE-2026-0000" }));
    expect(blatt.titel).toBe("Rechnungskorrektur (Storno)");
    expect(blatt.korrektur).toBe("Diese Korrektur hebt die Rechnung RE-2026-0000 auf.");
  });

  it("deducts the invoices on account of a final invoice and asks for the rest", () => {
    const blatt = rechnungsBlatt(
      daten({
        art: "schluss",
        abzuege: [{ nummer: "RE-2026-0000", brutto: 50_000, netto: 42_017, steuer: 7_983 }],
      }),
    );
    const labels = blatt.summen.map((s) => s.label);
    expect(labels).toContain("abzüglich Abschlagsrechnung RE-2026-0000");
    expect(nbsp(blatt.summen.at(-1)!.wert)).toBe("958,07 €");
    expect(blatt.hinweise.at(-1)).toContain("den Zahlbetrag");
  });

  it("marks a draft as such", () => {
    const blatt = rechnungsBlatt(daten({ nummer: null, ausgestelltAm: null }));
    expect(blatt.name).toBe("Rechnungsentwurf");
    expect(blatt.meta[0]!.wert).toBe("Entwurf");
    expect(blatt.meta[1]!.wert).toBe("beim Stellen");
  });
});

describe("ibanLesbar", () => {
  it("groups by four", () => {
    expect(ibanLesbar("DE02120300000000202051")).toBe("DE02 1203 0000 0000 2020 51");
  });
});
