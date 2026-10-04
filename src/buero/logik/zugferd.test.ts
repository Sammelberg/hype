import { describe, expect, it } from "vitest";

import { beispiel, empfaenger } from "./xrechnung.beispiel";
import { KLEINUNTERNEHMER_HINWEIS } from "./xrechnung";
import { zugferdXml } from "./zugferd";

const zwischen = (xml: string, tag: string) =>
  [...xml.matchAll(new RegExp(`<${tag}(?: [^>]*)?>([^<]*)</${tag}>`, "g"))].map((m) => m[1]);

// The CII inside the PDF says what the XRechnung says (xrechnung.test.ts); Mustang validates both
// against EN 16931 (pnpm erechnung:pruefen).
describe("zugferdXml", () => {
  it("declares EN 16931 and carries the invoice's identity", () => {
    const xml = zugferdXml(beispiel);
    expect(xml).toContain("<ram:ID>urn:cen.eu:en16931:2017</ram:ID>");
    expect(zwischen(xml, "ram:TypeCode")[0]).toBe("380");
    expect(zwischen(xml, "ram:BuyerReference")).toEqual(["RE-2026-0001"]);
  });

  it("breaks the tax down per rate and totals it once per group", () => {
    const xml = zugferdXml(beispiel);
    expect(zwischen(xml, "ram:BasisAmount")).toEqual(["1187.50", "42.00"]);
    expect(zwischen(xml, "ram:CalculatedAmount")).toEqual(["225.63", "2.94"]);
    expect(zwischen(xml, "ram:TaxTotalAmount")).toEqual(["228.57"]);
    expect(zwischen(xml, "ram:DuePayableAmount")).toEqual(["1458.07"]);
  });

  it("escapes what the customer typed", () => {
    expect(zugferdXml(beispiel)).toContain("Krone &amp; Söhne Parkett GmbH");
  });

  it("marks a Kleinunternehmer's invoice exempt with the §19 note and no tax", () => {
    const xml = zugferdXml({ ...beispiel, kleinunternehmer: true });
    expect(xml).toContain(KLEINUNTERNEHMER_HINWEIS);
    expect(zwischen(xml, "ram:CategoryCode")).not.toContain("S");
    expect(zwischen(xml, "ram:TaxTotalAmount")).toEqual(["0.00"]);
  });

  it("names the corrected invoice on a Storno and routes an authority by its Leitweg-ID", () => {
    const xml = zugferdXml({
      ...beispiel,
      nummer: "RE-2026-0002",
      typ: "384",
      korrigiert: "RE-2026-0001",
      empfaenger: { ...empfaenger, leitwegId: "04011000-1234512345-06" },
    });
    expect(xml).toMatch(
      /<ram:InvoiceReferencedDocument><ram:IssuerAssignedID>RE-2026-0001<\/ram:IssuerAssignedID>/,
    );
    expect(zwischen(xml, "ram:BuyerReference")).toEqual(["04011000-1234512345-06"]);
  });

  it("identifies a seller without USt-IdNr by the Steuernummer (BR-CO-26)", () => {
    const xml = zugferdXml({ ...beispiel, verkaeufer: { ...beispiel.verkaeufer, ustId: null } });
    expect(xml).toContain('<ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">06001/12345');
    expect(xml).not.toContain('schemeID="VA"');
  });
});
