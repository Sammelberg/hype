// The steps of a Buchung. Pure, client-safe: the admin only offers the steps the server accepts.
import type { BuchungStatus } from "./typen";

const NACH: Record<BuchungStatus, readonly BuchungStatus[]> = {
  anfrage: ["reserviert", "bestaetigt", "abgelehnt"],
  reserviert: ["bestaetigt", "verfallen", "storniert"],
  bestaetigt: ["storniert", "abgeschlossen"],
  abgelehnt: [],
  verfallen: [],
  storniert: [],
  abgeschlossen: [],
};

export const kannWechseln = (von: BuchungStatus, nach: BuchungStatus) => NACH[von].includes(nach);

/** Whether the Buchung's Einsätze take the Darsteller (their Belegungen are active). */
export const belegt = (status: BuchungStatus) => status === "reserviert" || status === "bestaetigt";
