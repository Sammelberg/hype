import { describe, expect, it } from "vitest";

import { beispiel, empfaenger } from "./xrechnung.beispiel";
import { XRECHNUNG_CUSTOMIZATION, xrechnungXml } from "./xrechnung";

const zwischen = (xml: string, tag: string) =>
  [...xml.matchAll(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "g"))].map((m) => m[1]);

describe("xrechnungXml", () => {
  it("declares XRechnung 3.0 and carries the invoice's identity", () => {
    const xml = xrechnungXml(beispiel);
    expect(zwischen(xml, "cbc:CustomizationID")).toEqual([XRECHNUNG_CUSTOMIZATION]);
    expect(zwischen(xml, "cbc:InvoiceTypeCode")).toEqual(["380"]);
    // BT-10 falls back to the invoice number without a Leitweg-ID.
    expect(zwischen(xml, "cbc:BuyerReference")).toEqual(["RE-2026-0001"]);
  });

  it("breaks the tax down per rate and totals it once per group", () => {
    const xml = xrechnungXml(beispiel);
    // 1187.50 at 19 % = 225.63 (225.625 rounds up); 42.00 at 7 % = 2.94
    expect(zwischen(xml, "cbc:TaxableAmount")).toEqual(["1187.50", "42.00"]);
    expect(zwischen(xml, "cbc:TaxAmount")).toEqual(["228.57", "225.63", "2.94"]);
    expect(zwischen(xml, "cbc:PayableAmount")).toEqual(["1458.07"]);
  });

  it("escapes what the customer typed", () => {
    expect(xrechnungXml(beispiel)).toContain("Krone &amp; Söhne Parkett GmbH");
  });

  it("marks a Kleinunternehmer's invoice exempt with the §19 note and no tax", () => {
    const xml = xrechnungXml({ ...beispiel, kleinunternehmer: true });
    expect(zwischen(xml, "cbc:Note")[0]).toBe(
      "Gemäß §19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.",
    );
    expect(zwischen(xml, "cbc:TaxAmount")).toEqual(["0.00", "0.00"]);
    expect(xml).not.toContain("<cbc:ID>S</cbc:ID>");
  });

  it("names the corrected invoice on a Storno and routes an authority by its Leitweg-ID", () => {
    const xml = xrechnungXml({
      ...beispiel,
      nummer: "RE-2026-0002",
      typ: "384",
      korrigiert: "RE-2026-0001",
      empfaenger: { ...empfaenger, leitwegId: "04011000-1234512345-06" },
    });
    expect(xml).toContain(
      "<cac:InvoiceDocumentReference><cbc:ID>RE-2026-0001</cbc:ID></cac:InvoiceDocumentReference>",
    );
    expect(zwischen(xml, "cbc:BuyerReference")).toEqual(["04011000-1234512345-06"]);
    expect(xml).toContain(
      '<cbc:EndpointID schemeID="0204">04011000-1234512345-06</cbc:EndpointID>',
    );
  });

  it("identifies a seller without USt-IdNr by the Steuernummer as BT-29 (BR-CO-26)", () => {
    const ohneUstId = xrechnungXml({
      ...beispiel,
      verkaeufer: { ...beispiel.verkaeufer, ustId: null },
    });
    expect(ohneUstId).toContain(
      "<cac:PartyIdentification><cbc:ID>06001/12345</cbc:ID></cac:PartyIdentification>",
    );
    expect(xrechnungXml(beispiel)).not.toContain("<cac:PartyIdentification>");
  });
});
