// The calendar's arithmetic: months in whole weeks from Monday, the German wall clock (summer and
// winter time) without a time-zone package, and events laid out per day. Pure, client-safe.
import { tagePlus } from "./ablauf";

const ZONE = "Europe/Berlin";

const teile = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function wand(d: Date) {
  const p = Object.fromEntries(teile.formatToParts(d).map((x) => [x.type, x.value]));
  return { tag: `${p.year}-${p.month}-${p.day}`, uhrzeit: `${p.hour}:${p.minute}` };
}

/** The German calendar day an instant falls on. */
export const berlinTag = (d: Date) => wand(d).tag;
/** „09:30“: the German wall-clock time of an instant. */
export const berlinUhrzeit = (d: Date) => wand(d).uhrzeit;

/**
 * The instant of a German wall-clock time: taken as UTC first, then corrected by the zone's
 * offset at that moment (twice, so a guess on the other side of a clock change settles).
 */
export function berlinZeitpunkt(isoTag: string, uhrzeit: string): Date {
  const ziel = Date.parse(`${isoTag}T${uhrzeit}:00Z`);
  let t = ziel;
  for (let i = 0; i < 2; i++) {
    const w = wand(new Date(t));
    const gesehen = Date.parse(`${w.tag}T${w.uhrzeit}:00Z`);
    t += ziel - gesehen;
  }
  return new Date(t);
}

const wochentag = (isoTag: string) => (new Date(`${isoTag}T00:00:00Z`).getUTCDay() + 6) % 7;

/** Monday to Sunday of the week a day lies in. */
export function wochenTage(isoTag: string) {
  const montag = tagePlus(isoTag, -wochentag(isoTag));
  return Array.from({ length: 7 }, (_, i) => tagePlus(montag, i));
}

/** „2026-10“ as weeks of seven ISO days, from the Monday on or before the first. */
export function monatsRaster(monat: string): string[][] {
  const erster = `${monat}-01`;
  const wochen: string[][] = [];
  let woche = wochenTage(erster);
  while (wochen.length === 0 || woche[0]!.startsWith(monat)) {
    wochen.push(woche);
    woche = woche.map((t) => tagePlus(t, 7));
  }
  return wochen;
}

export const KALENDER_ARTEN = {
  termin: "Termin",
  wiedervorlage: "Wiedervorlage",
  faellig: "Rechnung fällig",
  mahnfrist: "Mahnfrist",
  angebot: "Angebot gültig bis",
  kuendigung: "Kündbar bis",
  vertragsende: "Vertragsende",
  veroeffentlichung: "Geplante Veröffentlichung",
} as const;
export type KalenderArt = keyof typeof KALENDER_ARTEN;

export type KalenderEreignis = {
  key: string;
  art: KalenderArt;
  titel: string;
  /** First and last German day it covers (the same for most). */
  von: string;
  bis: string;
  /** Start time on its first day; null = all day. */
  uhrzeit: string | null;
  bisUhrzeit?: string | null;
  ort?: string | null;
  notiz?: string | null;
  kundeId?: number | null;
  kundeName?: string | null;
  /** Where the event comes from; a Termin has none (it opens in the calendar). */
  href?: string;
  /** A Termin's id, to edit it. */
  terminId?: number;
};

/** Each day with its events: all-day ones (longest first), then by start time. */
export function jeTag(ereignisse: KalenderEreignis[], tage: string[]) {
  const map = new Map<string, KalenderEreignis[]>(tage.map((t) => [t, []]));
  for (const e of ereignisse)
    for (const t of tage) if (e.von <= t && t <= e.bis) map.get(t)!.push(e);
  for (const liste of map.values())
    liste.sort((a, b) => {
      if ((a.uhrzeit === null) !== (b.uhrzeit === null)) return a.uhrzeit === null ? -1 : 1;
      if (a.uhrzeit === null)
        return a.von.localeCompare(b.von) || a.titel.localeCompare(b.titel, "de");
      return a.uhrzeit.localeCompare(b.uhrzeit!);
    });
  return map;
}
