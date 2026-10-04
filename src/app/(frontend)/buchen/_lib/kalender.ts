// The days the booking calendar shows: whole weeks from Monday, so the grid has seven columns
// and the weekday of each date is where a person expects it. Pure, client-safe; German days as
// ISO strings („2026-11-14“), never instants, so the grid is the same in every timezone.
import { tagePlus } from "@/buero/logik/ablauf";

const WOCHENTAGE = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];
const MONATE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

const datum = (tag: string) => new Date(`${tag}T00:00:00Z`);

/** 0 Sunday … 6 Saturday. */
export const wochentag = (tag: string) => datum(tag).getUTCDay();

/** `wochen` whole weeks from the Monday of the week `wochenAb` weeks after `heute`. */
export function kalenderTage(heute: string, wochenAb: number, wochen: number): string[] {
  const montag = tagePlus(heute, -((wochentag(heute) + 6) % 7) + wochenAb * 7);
  return Array.from({ length: wochen * 7 }, (_, i) => tagePlus(montag, i));
}

/** „Samstag, 14. November“ */
export function tagText(tag: string) {
  const d = datum(tag);
  return `${WOCHENTAGE[d.getUTCDay()]}, ${d.getUTCDate()}. ${MONATE[d.getUTCMonth()]}`;
}

/** „November 2026“, or „November und Dezember 2026“ across a month's end. */
export function zeitraumText(tage: string[]) {
  const erster = datum(tage[0]!);
  const letzter = datum(tage.at(-1)!);
  const monat = (d: Date) => MONATE[d.getUTCMonth()];
  if (erster.getUTCMonth() === letzter.getUTCMonth())
    return `${monat(erster)} ${erster.getUTCFullYear()}`;
  if (erster.getUTCFullYear() === letzter.getUTCFullYear())
    return `${monat(erster)} bis ${monat(letzter)} ${letzter.getUTCFullYear()}`;
  return `${monat(erster)} ${erster.getUTCFullYear()} bis ${monat(letzter)} ${letzter.getUTCFullYear()}`;
}

export const tagNummer = (tag: string) => datum(tag).getUTCDate();

/** The starts of a day for a wished time („10:00“ … „18:00“). */
export function uhrzeiten(r: {
  ersterStartMin: number;
  letzterStartMin: number;
  rasterMin: number;
}) {
  const zeiten: string[] = [];
  for (let m = r.ersterStartMin; m <= r.letzterStartMin; m += r.rasterMin)
    zeiten.push(
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
    );
  return zeiten;
}
