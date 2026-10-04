// @vitest-environment node
import { describe, expect, it } from "vitest";

import type { DokumentDaten } from "../logik/blatt";
import { beispiel } from "../logik/xrechnung.beispiel";
import { zugferdXml } from "../logik/zugferd";
import { blattPdf, rechnungsPdf } from "./index";

const daten: DokumentDaten = {
  nummer: beispiel.nummer,
  storno: false,
  ausgestelltAm: beispiel.ausgestelltAm,
  faelligAm: beispiel.faelligAm,
  leistungVon: beispiel.leistungVon,
  leistungBis: beispiel.leistungBis,
  verkaeufer: beispiel.verkaeufer,
  empfaenger: beispiel.empfaenger,
  kleinunternehmer: false,
  einleitung: "Vielen Dank für Ihren Auftrag.",
  schlusstext: null,
  positionen: beispiel.positionen,
};

const latin1 = (bytes: Uint8Array) => new TextDecoder("latin1").decode(bytes);
const isPdf = (bytes: Uint8Array) => latin1(bytes.subarray(0, 5)) === "%PDF-";

describe("the invoice PDF", () => {
  it("embeds the Liberation Sans faces and no standard-14 font", async () => {
    const text = latin1(await blattPdf(daten));
    expect(text).toMatch(/\/BaseFont \/[A-Z]{6}\+LiberationSans/);
    expect(text).not.toMatch(/\/BaseFont \/Helvetica/);
  });

  it("renders a draft", async () => {
    expect(isPdf(await blattPdf({ ...daten, nummer: null, ausgestelltAm: null }))).toBe(true);
  });

  it("carries the CII as factur-x.xml when issued with complete data", async () => {
    const pdf = await rechnungsPdf(daten, zugferdXml(beispiel), new Date("2026-10-01T09:00:00Z"));
    const text = latin1(pdf);
    expect(isPdf(pdf)).toBe(true);
    expect(text).toContain("factur-x.xml");
    expect(text).toContain("/AFRelationship /Alternative");
    expect(text).toContain("/OutputIntents");
  });

  it("is plain PDF/A-3b without the XML", async () => {
    const text = latin1(await rechnungsPdf(daten, null, new Date("2026-10-01T09:00:00Z")));
    expect(text).not.toContain("factur-x.xml");
    expect(text).toContain("/OutputIntents");
  });
});
