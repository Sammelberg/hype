// Kinds of invoice beyond the plain one: recurring invoices from a contract's fee, and invoices on
// account (Abschlag) settled by a final invoice (Schlussrechnung) that deducts them. Pure.
import { datumDe, monatePlus, tagePlus } from "./ablauf";
import type { Position } from "./typen";

export const RECHNUNGSARTEN = {
  normal: "Rechnung",
  abo: "Laufende Rechnung",
  abschlag: "Abschlagsrechnung",
  schluss: "Schlussrechnung",
} as const;
export type Rechnungsart = keyof typeof RECHNUNGSARTEN;

/**
 * UNTDID 1001 as XRechnung allows it (BR-DE-17): an Abschlag is a partial invoice (326), a
 * Storno a correction (384), everything else a commercial invoice (380).
 */
export const typCode = (typ: "rechnung" | "storno", art: Rechnungsart) =>
  typ === "storno" ? "384" : art === "abschlag" ? "326" : "380";

// ---------------------------------------------------------------------------------------------
// Recurring invoices: a contract with a fee per month, quarter or year is billed in advance, at
// the start of each period. Periods are anchored on the contract's start, so a contract from the
// 31st is billed on the last day of every month and never drifts.

export const INTERVALL_MONATE = { monatlich: 1, quartal: 3, jaehrlich: 12 } as const;
export type AboIntervall = keyof typeof INTERVALL_MONATE;
export type Zeitraum = { von: string; bis: string };

/** At most this many periods at once: a contract forgotten for years is not billed in one go. */
export const MAX_ZEITRAEUME = 24;

export function faelligeZeitraeume(v: {
  beginn: string;
  intervall: AboIntervall;
  /** The end of the last period billed; null when none was. */
  abgerechnetBis: string | null;
  endetAm: string | null;
  stichtag: string;
}): Zeitraum[] {
  const schritt = INTERVALL_MONATE[v.intervall];
  const liste: Zeitraum[] = [];
  for (let n = 0; liste.length < MAX_ZEITRAEUME; n++) {
    const von = monatePlus(v.beginn, n * schritt);
    if (von > v.stichtag) break;
    if (v.endetAm && von > v.endetAm) break;
    const ende = tagePlus(monatePlus(v.beginn, (n + 1) * schritt), -1);
    const bis = v.endetAm && ende > v.endetAm ? v.endetAm : ende;
    if (v.abgerechnetBis && bis <= v.abgerechnetBis) continue;
    liste.push({ von, bis });
  }
  return liste;
}

/** The line a recurring invoice carries for one period. */
export function aboPosition(
  v: { titel: string; verguetungNetto: number; intervall: AboIntervall },
  z: Zeitraum,
  id: string,
): Position {
  return {
    id,
    bezeichnung: `${v.titel}, ${datumDe(z.von)} – ${datumDe(z.bis)}`,
    menge: 1,
    einheit: v.intervall === "monatlich" ? "MON" : "LS",
    einzelpreis: v.verguetungNetto,
    ustSatz: 19,
  };
}

// ---------------------------------------------------------------------------------------------
// Final invoice: the whole work at its full price, less the gross of every invoice on account
// (BT-113 „Paid amount“); what remains is due (BT-115).

export function schlussBetrag(brutto: number, abschlaegeBrutto: number[]) {
  const vorausbezahlt = abschlaegeBrutto.reduce((s, b) => s + b, 0);
  return { vorausbezahlt, zahlbetrag: brutto - vorausbezahlt };
}
