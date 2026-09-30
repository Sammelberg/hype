// A complete invoice for the tests: two VAT rates, a company customer, a whole month of work.
import type { Empfaenger, Firma } from "./typen";
import type { XRechnungDaten } from "./xrechnung";

export const firma: Firma = {
  name: "Schwarzwald Systems",
  inhaber: "Oleksandr Zamula",
  strasse: "Merianhof 5",
  plz: "79104",
  ort: "Freiburg im Breisgau",
  steuernummer: "06001/12345",
  ustId: "DE123456789",
  kleinunternehmer: false,
  iban: "DE02120300000000202051",
  bic: null,
  bank: null,
  telefon: "0761 123456",
  email: "rechnung@example.com",
  zahlungszielTage: 14,
  fusszeile: null,
};

export const empfaenger: Empfaenger = {
  name: "Krone & Söhne Parkett GmbH",
  firma: "Krone & Söhne Parkett GmbH",
  strasse: "Hauptstraße 1",
  plz: "79098",
  ort: "Freiburg",
  land: "DE",
  ustId: null,
  leitwegId: null,
  email: "buchhaltung@example.com",
  privat: false,
};

export const beispiel: XRechnungDaten = {
  nummer: "RE-2026-0001",
  typ: "380",
  ausgestelltAm: "2026-10-01",
  faelligAm: "2026-10-15",
  leistungVon: "2026-09-01",
  leistungBis: "2026-09-30",
  verkaeufer: firma,
  empfaenger,
  positionen: [
    {
      bezeichnung: "Entwicklung Kundenportal",
      menge: 12.5,
      einheit: "HUR",
      einzelpreis: 95,
      ustSatz: 19,
    },
    { bezeichnung: "Fachbuch", menge: 1, einheit: "C62", einzelpreis: 42, ustSatz: 7 },
  ],
  kleinunternehmer: false,
};
