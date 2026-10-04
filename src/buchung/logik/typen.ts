// Shared types of the booking domain. Pure and client-safe: the site, the admin and the
// repositories all import from here.

export const FIGUR_KATEGORIEN = [
  "superhelden",
  "prinzessinnen",
  "tiere",
  "clowns",
  "saisonal",
] as const;
export type FigurKategorie = (typeof FIGUR_KATEGORIEN)[number];

export const SPRACHEN = ["de", "uk", "ru", "en"] as const;
export type Sprache = (typeof SPRACHEN)[number];

export const BUCHUNG_STATUS = [
  "anfrage",
  "reserviert",
  "bestaetigt",
  "abgelehnt",
  "verfallen",
  "storniert",
  "abgeschlossen",
] as const;
export type BuchungStatus = (typeof BUCHUNG_STATUS)[number];

export const BUCHUNG_QUELLEN = ["web", "telefon", "instagram", "admin"] as const;
export type BuchungQuelle = (typeof BUCHUNG_QUELLEN)[number];

export const ZAHLUNG_ADAPTER = ["mollie", "rechnung", "test"] as const;
export type ZahlungAdapterName = (typeof ZAHLUNG_ADAPTER)[number];

/** One line of the price a booking was offered at, frozen into the booking. */
export type PreisPosition = {
  art: "paket" | "zone" | "extra";
  bezeichnung: string;
  cent: number;
};
