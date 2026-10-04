// The price of a Buchung, line by line, as the customer sees it before entering any contact
// details: Paket, travel by Zone, Extras. End prices (PAngV); no surcharge appears later.
// Pure, client-safe: the booking form and the server compute the same numbers.
import { rundeCent } from "../../buero/logik/geld";
import { KLEINUNTERNEHMER_HINWEIS } from "../../buero/logik/xrechnung";
import type { PreisPosition } from "./typen";

const ganz = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const genau = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

/** A price as the site shows it: „149 €“, cents only where there are some („39,50 €“). */
export const preisText = (cent: number) => (cent % 100 === 0 ? ganz : genau).format(cent / 100);

export const ENDPREIS_HINWEIS = "Alle Preise sind Endpreise inkl. gesetzlicher MwSt.";

export type PreisAngebot = {
  positionen: PreisPosition[];
  summeCent: number;
  anzahlungCent: number;
  hinweis: string;
};

export function preisAngebot(e: {
  paket: { name: string; preisCent: number };
  zone: { name: string; aufschlagCent: number };
  extras: { name: string; preisCent: number }[];
  anzahlungProzent: number;
  kleinunternehmer: boolean;
}): PreisAngebot {
  const positionen: PreisPosition[] = [
    { art: "paket", bezeichnung: e.paket.name, cent: e.paket.preisCent },
    { art: "zone", bezeichnung: `Anfahrt ${e.zone.name}`, cent: e.zone.aufschlagCent },
    ...e.extras.map((x) => ({ art: "extra" as const, bezeichnung: x.name, cent: x.preisCent })),
  ];
  const summeCent = positionen.reduce((s, p) => s + p.cent, 0);
  return {
    positionen,
    summeCent,
    anzahlungCent: rundeCent((summeCent * e.anzahlungProzent) / 100),
    hinweis: e.kleinunternehmer ? KLEINUNTERNEHMER_HINWEIS : ENDPREIS_HINWEIS,
  };
}

/** The lowest price of a Paket that books itself, in the home Zone; null if there is none. */
export function abPreisCent(pakete: { preisCent: number | null; nurAnfrage: boolean }[]) {
  const preise = pakete
    .filter((p) => !p.nurAnfrage && p.preisCent !== null)
    .map((p) => p.preisCent as number);
  return preise.length ? Math.min(...preise) : null;
}
