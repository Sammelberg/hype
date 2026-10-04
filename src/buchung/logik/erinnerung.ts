// When the mails around a confirmed party are due. The beat (scripts/buchung-takt.ts) asks every
// five minutes; the mail log keeps each one to a single send. German days and hours, so a reminder
// never arrives at night and the clock change moves nothing.
import { tagePlus } from "../../buero/logik/ablauf";
import { berlinTag, berlinUhrzeit } from "../../buero/logik/kalender";

const TAG = 86_400_000;

export type ErinnerungsArt = "erinnerung" | "vortag" | "bewertung";

/**
 * The mails due now for a party at `beginn` booked at `gebucht`:
 * - a week ahead (from seven days before, if it was booked earlier than that, until two days before),
 * - the day before from 17:00,
 * - the day after from 10:00, for three days at most.
 */
export function faelligeErinnerungen(e: {
  beginn: Date;
  gebucht: Date;
  jetzt: Date;
}): ErinnerungsArt[] {
  const bis = e.beginn.getTime() - e.jetzt.getTime();
  const heute = berlinTag(e.jetzt);
  const uhr = berlinUhrzeit(e.jetzt);
  const feiertag = berlinTag(e.beginn);
  const faellig: ErinnerungsArt[] = [];
  if (bis <= 7 * TAG && bis > 2 * TAG && e.beginn.getTime() - e.gebucht.getTime() > 7 * TAG)
    faellig.push("erinnerung");
  if (heute === tagePlus(feiertag, -1) && uhr >= "17:00") faellig.push("vortag");
  if (
    heute > feiertag &&
    heute <= tagePlus(feiertag, 3) &&
    (heute !== tagePlus(feiertag, 1) || uhr >= "10:00")
  )
    faellig.push("bewertung");
  return faellig;
}
