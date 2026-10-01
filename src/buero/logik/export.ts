// What the tax adviser gets: the invoice journal as CSV, VAT per month, and a DATEV booking batch
// (EXTF „Buchungsstapel“) of the revenue. Issued invoices and Stornos only, by issue date
// (Sollversteuerung). Pure: the route reads the invoices, this turns them into files.
import { rechnungsSummen } from "./geld";
import type { Position } from "./typen";

export type JournalRechnung = {
  nummer: string;
  typ: "rechnung" | "storno";
  art: string;
  ausgestelltAm: string;
  faelligAm: string;
  kundeNummer: string;
  kundeName: string;
  positionen: Position[];
  kleinunternehmer: boolean;
  status: string;
  bezahltAm: string | null;
  korrigiert: string | null;
};

const zahl = (cent: number) => (cent / 100).toFixed(2).replace(".", ",");
const feld = (wert: string) => (/[";\n\r]/.test(wert) ? `"${wert.replace(/"/g, '""')}"` : wert);
const tagDe = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

/** Excel in Germany opens UTF-8 only with the byte order mark. */
const BOM = "﻿";

const steuerJeSatz = (r: JournalRechnung) => {
  const s = rechnungsSummen(r.positionen, r.kleinunternehmer);
  const satz = (n: number) => s.gruppen.find((g) => g.satz === n);
  return {
    netto: s.netto,
    brutto: s.brutto,
    gruppen: s.gruppen,
    ust19: satz(19)?.steuer ?? 0,
    ust7: satz(7)?.steuer ?? 0,
  };
};

export function journalCsv(rechnungen: JournalRechnung[]): string {
  const kopf = [
    "Rechnungsnummer",
    "Art",
    "Rechnungsdatum",
    "Fällig am",
    "Kundennummer",
    "Kunde",
    "Netto",
    "USt 19 %",
    "USt 7 %",
    "Brutto",
    "Status",
    "Bezahlt am",
    "Korrigiert Rechnung",
  ];
  const zeilen = rechnungen.map((r) => {
    const s = steuerJeSatz(r);
    return [
      r.nummer,
      r.typ === "storno" ? "Storno" : r.art,
      tagDe(r.ausgestelltAm),
      tagDe(r.faelligAm),
      r.kundeNummer,
      r.kundeName,
      zahl(s.netto),
      zahl(s.ust19),
      zahl(s.ust7),
      zahl(s.brutto),
      r.status,
      r.bezahltAm ? tagDe(r.bezahltAm) : "",
      r.korrigiert ?? "",
    ]
      .map(feld)
      .join(";");
  });
  return BOM + [kopf.join(";"), ...zeilen].join("\r\n") + "\r\n";
}

export type UstMonat = {
  monat: string;
  netto19: number;
  ust19: number;
  netto7: number;
  ust7: number;
  netto0: number;
  brutto: number;
  anzahl: number;
};

/** Revenue and VAT per month of issue, the figures of the Umsatzsteuer-Voranmeldung (Soll). */
export function ustNachMonat(rechnungen: JournalRechnung[]): UstMonat[] {
  const monate = new Map<string, UstMonat>();
  for (const r of rechnungen) {
    const monat = r.ausgestelltAm.slice(0, 7);
    const m = monate.get(monat) ?? {
      monat,
      netto19: 0,
      ust19: 0,
      netto7: 0,
      ust7: 0,
      netto0: 0,
      brutto: 0,
      anzahl: 0,
    };
    const s = steuerJeSatz(r);
    for (const g of s.gruppen) {
      if (g.satz === 19) {
        m.netto19 += g.netto;
        m.ust19 += g.steuer;
      } else if (g.satz === 7) {
        m.netto7 += g.netto;
        m.ust7 += g.steuer;
      } else m.netto0 += g.netto;
    }
    m.brutto += s.brutto;
    m.anzahl += 1;
    monate.set(monat, m);
  }
  return [...monate.values()].sort((a, b) => a.monat.localeCompare(b.monat));
}

export function ustCsv(monate: UstMonat[]): string {
  const kopf = [
    "Monat",
    "Rechnungen",
    "Netto 19 %",
    "USt 19 %",
    "Netto 7 %",
    "USt 7 %",
    "Netto steuerfrei",
    "Brutto",
  ];
  const zeilen = monate.map((m) =>
    [
      `${m.monat.slice(5, 7)}/${m.monat.slice(0, 4)}`,
      String(m.anzahl),
      zahl(m.netto19),
      zahl(m.ust19),
      zahl(m.netto7),
      zahl(m.ust7),
      zahl(m.netto0),
      zahl(m.brutto),
    ].join(";"),
  );
  return BOM + [kopf.join(";"), ...zeilen].join("\r\n") + "\r\n";
}

// ---------------------------------------------------------------------------------------------
// DATEV: a booking batch in the EXTF format (version 700, category 21) the adviser imports into
// Kanzlei-Rechnungswesen. One booking per invoice and VAT rate: the gross on the debtor account
// against the revenue account; the revenue accounts are automatic accounts, so DATEV splits off
// the VAT itself and no BU key is set. Accounts and numbers come from the Firmendaten, where the
// adviser's values belong — the defaults are SKR03's usual ones.

export type DatevEinstellungen = {
  beraternummer: number;
  mandantennummer: number;
  kontenrahmen: "03" | "04";
  sachkontenlaenge: number;
  debitor: number;
  erloes19: number;
  erloes7: number;
  erloes0: number;
};

export const DATEV_VORGABE: Record<
  "03" | "04",
  Omit<
    DatevEinstellungen,
    "beraternummer" | "mandantennummer" | "sachkontenlaenge" | "kontenrahmen"
  >
> = {
  "03": { debitor: 10000, erloes19: 8400, erloes7: 8300, erloes0: 8195 },
  "04": { debitor: 10000, erloes19: 4400, erloes7: 4300, erloes0: 4185 },
};

const text = (s: string, max: number) => `"${s.replace(/"/g, "'").slice(0, max)}"`;
const kompakt = (iso: string) => iso.replaceAll("-", "");

export function datevBuchungsstapel(a: {
  rechnungen: JournalRechnung[];
  einstellungen: DatevEinstellungen;
  von: string;
  bis: string;
  /** When the file was made, as YYYYMMDDHHMMSSFFF. */
  erzeugt: string;
}): string {
  const e = a.einstellungen;
  const wjBeginn = `${a.von.slice(0, 4)}0101`;
  const kopf = [
    '"EXTF"',
    "700",
    "21",
    '"Buchungsstapel"',
    "13",
    a.erzeugt,
    "",
    '"RE"',
    '""',
    '""',
    String(e.beraternummer),
    String(e.mandantennummer),
    wjBeginn,
    String(e.sachkontenlaenge),
    kompakt(a.von),
    kompakt(a.bis),
    text(`Ausgangsrechnungen ${tagDe(a.von)}–${tagDe(a.bis)}`, 30),
    '""',
    "1",
    "0",
    "0",
    '"EUR"',
    "",
    '""',
    "",
    "",
    `"${e.kontenrahmen}"`,
    "",
    "",
    '""',
    '""',
  ].join(";");
  const spalten = [
    "Umsatz (ohne Soll/Haben-Kz)",
    "Soll/Haben-Kennzeichen",
    "WKZ Umsatz",
    "Kurs",
    "Basis-Umsatz",
    "WKZ Basis-Umsatz",
    "Konto",
    "Gegenkonto (ohne BU-Schlüssel)",
    "BU-Schlüssel",
    "Belegdatum",
    "Belegfeld 1",
    "Belegfeld 2",
    "Skonto",
    "Buchungstext",
  ].join(";");
  const konto = (satz: number) => (satz === 19 ? e.erloes19 : satz === 7 ? e.erloes7 : e.erloes0);
  const buchungen = a.rechnungen.flatMap((r) =>
    rechnungsSummen(r.positionen, r.kleinunternehmer).gruppen.map((g) => {
      const brutto = g.netto + g.steuer;
      return [
        zahl(Math.abs(brutto)),
        // An invoice debits the customer; a Storno (negative) credits them.
        brutto < 0 ? '"H"' : '"S"',
        '"EUR"',
        "",
        "",
        '""',
        String(e.debitor),
        String(konto(g.satz)),
        '""',
        `${r.ausgestelltAm.slice(8, 10)}${r.ausgestelltAm.slice(5, 7)}`,
        text(r.nummer, 36),
        // Belegfeld 2 carries the due date as TTMMJJ, which DATEV's open items read.
        text(`${r.faelligAm.slice(8, 10)}${r.faelligAm.slice(5, 7)}${r.faelligAm.slice(2, 4)}`, 12),
        "",
        text(`${r.kundeName}`, 60),
      ].join(";");
    }),
  );
  return [kopf, spalten, ...buchungen].join("\r\n") + "\r\n";
}
