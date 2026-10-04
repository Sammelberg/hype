// The cancellation grid of the AGB, also quoted in the confirmation mail. Measured in hours to the
// party's Beginn: more than 14 days, 14 to 7 days, 7 days to 48 hours, under 48 hours.
import { rundeCent } from "../../buero/logik/geld";

const STUNDE = 3_600_000;

export type StornoErgebnis = {
  gebuehrCent: number;
  /** What goes back to the customer of what was paid. */
  erstattungCent: number;
  /** What the fee exceeds the payment by. */
  nachforderungCent: number;
  slotFrei: boolean;
  /** „admin“: the owner decides (fee and slot) before anything happens. */
  entscheidung: "auto" | "admin";
};

export function stornoGebuehr(e: {
  beginn: Date;
  jetzt: Date;
  summeCent: number;
  bezahltCent: number;
  durch: "kunde" | "agentur";
}): StornoErgebnis {
  const stunden = (e.beginn.getTime() - e.jetzt.getTime()) / STUNDE;
  const ergebnis = (gebuehrCent: number, slotFrei: boolean, entscheidung: "auto" | "admin") => ({
    gebuehrCent,
    erstattungCent: Math.max(0, e.bezahltCent - gebuehrCent),
    nachforderungCent: Math.max(0, gebuehrCent - e.bezahltCent),
    slotFrei,
    entscheidung,
  });

  if (e.durch === "agentur") return ergebnis(0, true, "auto");
  if (stunden > 14 * 24) return ergebnis(0, true, "auto");
  if (stunden >= 7 * 24) return ergebnis(e.bezahltCent, true, "auto");
  if (stunden >= 48) return ergebnis(rundeCent(e.summeCent / 2), false, "admin");
  return ergebnis(e.summeCent, false, "admin");
}
