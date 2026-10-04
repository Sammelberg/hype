// What a sheet of an invoice (or an offer) says, in strings: the title, the address, the meta rows,
// the lines, the totals, the notes about payment and the footer. Every decision lives here, so the
// HTML sheet (admin/_components/buero/rechnungs-dokument.tsx, print view and live preview) and the
// PDF (buero/pdf) read the same — and the tests read it without rendering anything. Pure.
import { RECHNUNGSARTEN, type Rechnungsart, schlussBetrag } from "./abrechnung";
import { datumDe } from "./ablauf";
import { euro, positionNetto, rechnungsSummen } from "./geld";
import { EINHEITEN, type Einheit, type Empfaenger, type Firma } from "./typen";
import { KLEINUNTERNEHMER_HINWEIS } from "./xrechnung";

export type DokumentDaten = {
  nummer: string | null;
  storno: boolean;
  korrigiert?: string | null;
  ausgestelltAm: string | null;
  faelligAm: string | null;
  leistungVon: string | null;
  leistungBis: string | null;
  verkaeufer: Firma;
  empfaenger: Empfaenger | null;
  kundennummer?: string | null;
  kleinunternehmer: boolean;
  einleitung: string | null;
  schlusstext: string | null;
  positionen: {
    bezeichnung: string;
    menge: number;
    einheit: Einheit;
    einzelpreis: number;
    ustSatz: number;
  }[];
  art?: Rechnungsart;
  /**
   * A final invoice: the invoices on account it deducts, in cents — with their net and VAT,
   * which §14 Abs. 5 UStG wants stated (null for none recorded).
   */
  abzuege?: { nummer: string; brutto: number; netto?: number | null; steuer?: number | null }[];
  /** An offer instead of an invoice: valid until this day (or open). */
  angebot?: { gueltigBis: string | null };
};

export type Zeile = { label: string; wert: string };
export type Summe = { label: string; zusatz?: string; wert: string; stark?: boolean };
export type Posten = {
  pos: string;
  bezeichnung: string;
  menge: string;
  einzelpreis: string;
  ust: string;
  betrag: string;
};

export type Blatt = {
  titel: string;
  /** Title and number as the heading prints it. */
  ueberschrift: string;
  /** For screen readers and the PDF's title. */
  name: string;
  absenderZeile: string;
  /** Null: no customer chosen yet (a draft). */
  adresse: string[] | null;
  meta: Zeile[];
  korrektur: string | null;
  einleitung: string | null;
  mitUst: boolean;
  posten: Posten[];
  summen: Summe[];
  hinweise: string[];
  schlusstext: string | null;
  fuss: string[][];
};

const mengeFormat = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 3 });
/** DE02 1203 0000 0000 2020 51: how people read and type an IBAN. */
export const ibanLesbar = (iban: string) => iban.replace(/(.{4})/g, "$1 ").trim();
const d = (iso: string | null | undefined) => (iso ? datumDe(iso) : "—");
const ort = (plz: string | null, stadt: string | null) => [plz, stadt].filter(Boolean).join(" ");

export function rechnungsBlatt(daten: DokumentDaten): Blatt {
  const v = daten.verkaeufer;
  const e = daten.empfaenger;
  const positionen = daten.positionen.filter(
    (p) => Number.isFinite(p.menge) && Number.isFinite(p.einzelpreis),
  );
  const summen = rechnungsSummen(positionen, daten.kleinunternehmer);
  const angebot = daten.angebot;
  const abzuege = daten.abzuege ?? [];
  const { zahlbetrag } = schlussBetrag(
    summen.brutto,
    abzuege.map((a) => a.brutto),
  );
  const titel = angebot
    ? "Angebot"
    : daten.storno
      ? "Rechnungskorrektur (Storno)"
      : daten.art && daten.art !== "abo"
        ? RECHNUNGSARTEN[daten.art]
        : "Rechnung";
  const zeitraum =
    daten.leistungVon && daten.leistungBis && daten.leistungVon !== daten.leistungBis
      ? `${d(daten.leistungVon)} bis ${d(daten.leistungBis)}`
      : d(daten.leistungVon ?? daten.leistungBis);

  const meta: Zeile[] = [
    {
      label: angebot ? "Angebotsnummer" : "Rechnungsnummer",
      wert: daten.nummer ?? "Entwurf",
    },
    {
      label: angebot ? "Datum" : "Rechnungsdatum",
      wert: daten.ausgestelltAm
        ? d(daten.ausgestelltAm)
        : angebot
          ? "beim Versenden"
          : "beim Stellen",
    },
    ...(daten.kundennummer ? [{ label: "Kundennummer", wert: daten.kundennummer }] : []),
    ...(angebot
      ? angebot.gueltigBis
        ? [{ label: "Gültig bis", wert: d(angebot.gueltigBis) }]
        : []
      : [{ label: "Leistung", wert: zeitraum }]),
    ...(e?.ustId ? [{ label: "Ihre USt-IdNr", wert: e.ustId }] : []),
  ];

  const summenZeilen: Summe[] = [
    { label: "Summe netto", wert: euro(summen.netto) },
    ...(daten.kleinunternehmer
      ? []
      : summen.gruppen.map((g) => ({
          label: `USt ${g.satz} % auf ${euro(g.netto)}`,
          wert: euro(g.steuer),
        }))),
    { label: "Gesamtbetrag", wert: euro(summen.brutto), stark: true },
    ...abzuege.map((a) => ({
      label: `${a.brutto < 0 ? "verrechnet mit" : "abzüglich"} Abschlagsrechnung ${a.nummer}`,
      ...(a.netto != null && a.steuer != null && !daten.kleinunternehmer
        ? {
            zusatz: `netto ${euro(Math.abs(a.netto))} zuzüglich USt ${euro(Math.abs(a.steuer))}`,
          }
        : {}),
      wert: euro(-a.brutto),
    })),
    ...(abzuege.length > 0 ? [{ label: "Zahlbetrag", wert: euro(zahlbetrag), stark: true }] : []),
  ];

  const zahlung = angebot
    ? angebot.gueltigBis
      ? `An dieses Angebot halten wir uns bis zum ${d(angebot.gueltigBis)} gebunden.`
      : "Wir freuen uns auf Ihre Zusage."
    : daten.storno
      ? "Der Betrag wird mit der ursprünglichen Rechnung verrechnet oder erstattet."
      : `Bitte überweisen Sie ${abzuege.length > 0 ? "den Zahlbetrag" : "den Gesamtbetrag"}${
          daten.faelligAm ? ` bis zum ${d(daten.faelligAm)}` : " innerhalb des Zahlungsziels"
        } ohne Abzug${v.iban ? ` auf das Konto ${ibanLesbar(v.iban)}` : ""} unter Angabe der Rechnungsnummer.`;

  const name = daten.nummer
    ? `${titel} ${daten.nummer}`
    : angebot
      ? "Angebotsentwurf"
      : "Rechnungsentwurf";

  return {
    titel,
    ueberschrift: `${titel}${daten.nummer ? ` ${daten.nummer}` : ""}`,
    name,
    absenderZeile: [v.name, v.strasse, ort(v.plz, v.ort)].filter(Boolean).join(" · "),
    adresse: e
      ? [
          ...(e.firma && e.firma !== e.name ? [e.firma] : []),
          e.name,
          e.strasse ?? "",
          ort(e.plz, e.ort),
          ...(e.land !== "DE" ? [e.land] : []),
        ].filter((zeile) => zeile.trim() !== "")
      : null,
    meta,
    korrektur:
      daten.storno && daten.korrigiert
        ? `Diese Korrektur hebt die Rechnung ${daten.korrigiert} auf.`
        : null,
    einleitung: daten.einleitung,
    mitUst: !daten.kleinunternehmer,
    posten: positionen.map((p, i) => ({
      pos: String(i + 1),
      bezeichnung: p.bezeichnung || "—",
      menge: `${mengeFormat.format(p.menge)} ${EINHEITEN[p.einheit]}`,
      einzelpreis: euro(Math.round(p.einzelpreis * 100)),
      ust: `${p.ustSatz} %`,
      betrag: euro(positionNetto(p)),
    })),
    summen: summenZeilen,
    hinweise: [...(daten.kleinunternehmer ? [KLEINUNTERNEHMER_HINWEIS] : []), zahlung],
    schlusstext: daten.schlusstext,
    fuss: [
      [v.name, ...(v.inhaber ? [`Inhaber ${v.inhaber}`] : []), v.strasse ?? "", ort(v.plz, v.ort)],
      [
        ...(v.telefon ? [`Telefon ${v.telefon}`] : []),
        ...(v.email ? [v.email] : []),
        ...(v.steuernummer ? [`Steuernummer ${v.steuernummer}`] : []),
        ...(v.ustId ? [`USt-IdNr ${v.ustId}`] : []),
      ],
      [
        ...(v.bank ? [v.bank] : []),
        ...(v.iban ? [`IBAN ${ibanLesbar(v.iban)}`] : []),
        ...(v.bic ? [`BIC ${v.bic}`] : []),
        ...(v.fusszeile ? [v.fusszeile] : []),
      ],
    ].map((spalte) => spalte.filter((zeile) => zeile.trim() !== "")),
  };
}
