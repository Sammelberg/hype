// What an issued invoice still claims: payments against it, when the customer is in default
// (§286 BGB), default interest (§288 BGB) and the steps of reminding. Pure, in cents and ISO days;
// the admin proposes these numbers and the owner may change them before a Mahnung is written.
import { rundeCent } from "./geld";

export type Zahlungsstand = "offen" | "teilbezahlt" | "bezahlt";

/** Gross total less every payment; negative when the customer paid too much. */
export const offenerBetrag = (brutto: number, zahlungen: number[]) =>
  brutto - zahlungen.reduce((s, z) => s + z, 0);

export function zahlungsstand(brutto: number, zahlungen: number[]): Zahlungsstand {
  if (zahlungen.length === 0) return "offen";
  return offenerBetrag(brutto, zahlungen) <= 0 ? "bezahlt" : "teilbezahlt";
}

const tagMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const isoAus = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const plusTage = (iso: string, tage: number) => isoAus(tagMs(iso) + tage * 86_400_000);
/** Days from `von` to `bis`, `bis` not counted. */
export const tageZwischen = (von: string, bis: string) =>
  Math.max(0, Math.round((tagMs(bis) - tagMs(von)) / 86_400_000));

/**
 * §288 BGB: the base rate (Bundesbank, changes on 1 January and 1 July) plus five points, or nine
 * points when no consumer is involved; per day on a 365-day year.
 */
export function verzugszinsen(a: {
  betrag: number;
  basiszins: number;
  privat: boolean;
  tage: number;
}) {
  const satz = Math.round((a.basiszins + (a.privat ? 5 : 9)) * 100) / 100;
  const cent = a.tage > 0 && a.betrag > 0 ? rundeCent((a.betrag * satz * a.tage) / 36_500) : 0;
  return { satz, cent };
}

/**
 * The first day of default (§286 BGB). A Mahnung after the due date puts the customer in default
 * the day after it; without one, a business is in default 30 days after the invoice (Abs. 3) — a
 * consumer only if the invoice said so, which ours do not. A payment date the invoice alone sets
 * is not „durch den Kalender bestimmt“ (Abs. 2), so it starts nothing by itself. Never before the
 * due date has passed.
 */
export function verzugsbeginn(r: {
  ausgestelltAm: string;
  faelligAm: string;
  privat: boolean;
  ersteMahnung: string | null;
}): string | null {
  const kandidaten = [
    r.ersteMahnung ? plusTage(r.ersteMahnung, 1) : null,
    r.privat ? null : plusTage(r.ausgestelltAm, 31),
  ].filter((t): t is string => t !== null);
  if (kandidaten.length === 0) return null;
  const frueheste = kandidaten.sort()[0]!;
  const nachFaelligkeit = plusTage(r.faelligAm, 1);
  return frueheste < nachFaelligkeit ? nachFaelligkeit : frueheste;
}

export const MAHNSTUFEN = [
  { stufe: 0, titel: "Zahlungserinnerung", fristTage: 7 },
  { stufe: 1, titel: "1. Mahnung", fristTage: 10 },
  { stufe: 2, titel: "2. Mahnung", fristTage: 10 },
] as const;
export type Mahnstufe = (typeof MAHNSTUFEN)[number]["stufe"];

export const mahnTitel = (stufe: number) =>
  MAHNSTUFEN.find((s) => s.stufe === stufe)?.titel ?? "Mahnung";

/** The step after the ones already written; null after the last (then: Mahnbescheid, lawyer). */
export function naechsteMahnstufe(geschrieben: number[]): Mahnstufe | null {
  const hoechste = geschrieben.length ? Math.max(...geschrieben) : -1;
  return (MAHNSTUFEN.find((s) => s.stufe === hoechste + 1)?.stufe ?? null) as Mahnstufe | null;
}

/** §288 Abs. 5 BGB: 40 € once per claim, when the debtor is not a consumer. */
export const VERZUGSPAUSCHALE = 4000;

export type MahnungVorschlag = {
  stufe: Mahnstufe;
  offen: number;
  verzugSeit: string | null;
  tage: number;
  zinssatz: number;
  zinsen: number;
  pauschale: number;
  gebuehr: number;
  gesamt: number;
  neueFrist: string;
};

/**
 * The next reminder as the admin proposes it on `am`: the open amount, interest from the start of
 * default to that day on what is open, the flat fee if it is due and not yet charged, no fee of
 * our own (a Mahngebühr is only the real cost; the owner adds one by hand) and a new deadline.
 * Payments are counted against the principal.
 */
export function mahnungVorschlag(a: {
  brutto: number;
  zahlungen: number[];
  ausgestelltAm: string;
  faelligAm: string;
  privat: boolean;
  basiszins: number;
  am: string;
  frueher: { stufe: number; am: string; pauschale: number }[];
}): MahnungVorschlag {
  const stufe = naechsteMahnstufe(a.frueher.map((m) => m.stufe)) ?? 2;
  const offen = Math.max(0, offenerBetrag(a.brutto, a.zahlungen));
  const ersteMahnung =
    a.frueher
      .filter((m) => m.stufe >= 1)
      .map((m) => m.am)
      .sort()[0] ?? null;
  const beginn = verzugsbeginn({
    ausgestelltAm: a.ausgestelltAm,
    faelligAm: a.faelligAm,
    privat: a.privat,
    ersteMahnung,
  });
  const imVerzug = beginn !== null && beginn <= a.am;
  const tage = imVerzug ? tageZwischen(beginn, a.am) : 0;
  const { satz, cent: zinsen } = verzugszinsen({
    betrag: offen,
    basiszins: a.basiszins,
    privat: a.privat,
    tage,
  });
  const schonPauschale = a.frueher.some((m) => m.pauschale > 0);
  const pauschale = imVerzug && !a.privat && !schonPauschale ? VERZUGSPAUSCHALE : 0;
  const frist = MAHNSTUFEN.find((s) => s.stufe === stufe)!.fristTage;
  return {
    stufe,
    offen,
    verzugSeit: imVerzug ? beginn : null,
    tage,
    zinssatz: satz,
    zinsen,
    pauschale,
    gebuehr: 0,
    gesamt: offen + zinsen + pauschale,
    neueFrist: plusTage(a.am, frist),
  };
}
