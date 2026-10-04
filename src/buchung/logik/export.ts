// The bookings of a period as a CSV the owner hands to the tax adviser: German Excel format
// (byte order mark, semicolons, comma decimals, dd.mm.yyyy). Pure: the route reads, this writes.
import { STATUS_NAMEN, ZAHLUNG_NAMEN, type BuchungStatus, type ZahlungAdapterName } from "./typen";

export type ExportZeile = {
  datum: string;
  uhrzeit: string;
  nummer: string;
  status: BuchungStatus;
  kunde: string;
  ort: string;
  /** numeric(12,2) as Postgres returns it, or "" */
  summe: string;
  anzahlung: string;
  stornogebuehr: string;
  zahlungsart: ZahlungAdapterName | "";
};

const BOM = "﻿";
const feld = (wert: string) => (/[";\n\r]/.test(wert) ? `"${wert.replace(/"/g, '""')}"` : wert);
const betrag = (wert: string) => wert.replace(".", ",");
const tagDe = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

const KOPF = [
  "Datum",
  "Uhrzeit",
  "Buchung",
  "Status",
  "Kunde",
  "Ort",
  "Summe",
  "Anzahlung",
  "Stornogebühr",
  "Zahlungsart",
];

export function buchungenCsv(zeilen: ExportZeile[]): string {
  const reihen = zeilen.map((z) =>
    [
      tagDe(z.datum),
      z.uhrzeit,
      z.nummer,
      STATUS_NAMEN[z.status],
      z.kunde,
      z.ort,
      betrag(z.summe),
      betrag(z.anzahlung),
      betrag(z.stornogebuehr),
      z.zahlungsart ? ZAHLUNG_NAMEN[z.zahlungsart] : "",
    ]
      .map(feld)
      .join(";"),
  );
  return BOM + [KOPF.join(";"), ...reihen].join("\r\n") + "\r\n";
}
