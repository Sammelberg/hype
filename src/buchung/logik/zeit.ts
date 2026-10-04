// German wall-clock times for booking starts, on top of the office's calendar arithmetic
// (kern's src/buero/logik/kalender.ts stays untouched). Pure, client-safe.
import { berlinTag, berlinUhrzeit, berlinZeitpunkt } from "../../buero/logik/kalender";

const STUNDE = 3_600_000;
const TAG = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const UHRZEIT = /^([01]\d|2[0-3]):[0-5]\d$/;

const zeigt = (t: Date, tag: string, uhrzeit: string) =>
  berlinTag(t) === tag && berlinUhrzeit(t) === uhrzeit;

/**
 * The instant a party starts at a German day and time. Null when that time does not exist (the
 * hour skipped when the clocks go forward); the first of the two moments when an hour repeats.
 */
export function berlinStart(tag: string, uhrzeit: string): Date | null {
  if (!TAG.test(tag) || !UHRZEIT.test(uhrzeit)) return null;
  const t = berlinZeitpunkt(tag, uhrzeit);
  if (Number.isNaN(t.getTime()) || !zeigt(t, tag, uhrzeit)) return null;
  const frueher = new Date(t.getTime() - STUNDE);
  return zeigt(frueher, tag, uhrzeit) ? frueher : t;
}

const TAG_TEXT = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "numeric",
  month: "long",
});
const WOCHENTAG = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", weekday: "long" });

/** An instant as the site names it: „21. November“, „Samstag“, „10:00“, in German time. */
export function terminText(t: Date) {
  return { tag: TAG_TEXT.format(t), wochentag: WOCHENTAG.format(t), uhrzeit: berlinUhrzeit(t) };
}
