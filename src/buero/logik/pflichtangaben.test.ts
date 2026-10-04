import { describe, expect, it } from "vitest";

import { pruefeRechnung } from "./pflichtangaben";
import type { Empfaenger, Firma } from "./typen";

const firma: Firma = {
  name: "Muster GmbH",
  inhaber: "Erika Mustermann",
  strasse: "Musterstraße 1",
  plz: "12345",
  ort: "Musterstadt",
  steuernummer: "06001/12345",
  ustId: null,
  kleinunternehmer: false,
  iban: "DE02120300000000202051",
  bic: null,
  bank: null,
  telefon: "0761 123456",
  email: "rechnung@example.com",
  zahlungszielTage: 14,
  fusszeile: null,
  basiszinssatz: null,
  datev: null,
};

const empfaenger: Empfaenger = {
  name: "Krone Parkett GmbH",
  firma: "Krone Parkett GmbH",
  strasse: "Hauptstraße 1",
  plz: "79098",
  ort: "Freiburg",
  land: "DE",
  ustId: null,
  leitwegId: null,
  email: "buchhaltung@example.com",
  privat: false,
};

const rechnung = {
  firma,
  empfaenger,
  positionen: [{ bezeichnung: "Entwicklung", menge: 10, einzelpreis: 95 }],
  leistungVon: "2026-09-01",
  leistungBis: "2026-09-30",
};

const texte = (m: { text: string }[]) => m.map((x) => x.text);

describe("pruefeRechnung", () => {
  it("finds nothing missing on a complete invoice", () => {
    expect(pruefeRechnung(rechnung)).toEqual({ stellen: [], xrechnung: [] });
  });

  it("blocks issuing without a tax number or VAT id of the issuer (§14 Abs. 4 Nr. 2)", () => {
    const r = pruefeRechnung({ ...rechnung, firma: { ...firma, steuernummer: null } });
    expect(r.stellen).toEqual([
      { text: "Steuernummer oder USt-IdNr des Unternehmens", norm: "§14 Abs. 4 Nr. 2 UStG" },
    ]);
  });

  it("blocks issuing without the recipient's address and without a service date", () => {
    const r = pruefeRechnung({
      ...rechnung,
      empfaenger: { ...empfaenger, strasse: null },
      leistungVon: null,
      leistungBis: null,
    });
    expect(texte(r.stellen)).toEqual([
      "Anschrift des Kunden",
      "Zeitpunkt oder Zeitraum der Leistung",
    ]);
  });

  it("lets an invoice be issued but not sent as XRechnung without IBAN, phone and e-mail", () => {
    const r = pruefeRechnung({
      ...rechnung,
      firma: { ...firma, iban: null, telefon: null },
      empfaenger: { ...empfaenger, email: null },
    });
    expect(r.stellen).toEqual([]);
    expect(texte(r.xrechnung)).toEqual([
      "IBAN des Unternehmens",
      "Telefon des Unternehmens",
      "E-Mail-Adresse des Kunden",
    ]);
  });
});
