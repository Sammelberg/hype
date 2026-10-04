// Which starts a day offers, which Darsteller is free for a Fenster, and the nearest free starts
// when the wished one is taken. Availability is per Darsteller: a Figur is free when at least one
// Darsteller who plays it is free. Pure: the booking form and the locking transaction share it.
import { tagePlus } from "../../buero/logik/ablauf";
import { berlinTag } from "../../buero/logik/kalender";
import { berlinStart } from "./zeit";
import { berechneFenster, type Fenster, type FensterEingabe } from "./fenster";

const uhrzeit = (minuten: number) =>
  `${String(Math.floor(minuten / 60)).padStart(2, "0")}:${String(minuten % 60).padStart(2, "0")}`;

/** The starts of a German day, every `rasterMin` within the day's hours; skipped hours left out. */
export function startZeiten(
  tag: string,
  r: { ersterStartMin: number; letzterStartMin: number; rasterMin: number },
): Date[] {
  const starts: Date[] = [];
  for (let m = r.ersterStartMin; m <= r.letzterStartMin; m += r.rasterMin) {
    const start = berlinStart(tag, uhrzeit(m));
    if (start) starts.push(start);
  }
  return starts;
}

export type Belegt = { darstellerId: number; von: Date; bis: Date };
export type Kandidat = { id: number; prioritaet: number; figuren: number[] };

// Half-open: a visit may begin the moment the previous one ends.
const ueberschneidet = (a: { von: Date; bis: Date }, b: { von: Date; bis: Date }) =>
  a.von.getTime() < b.bis.getTime() && b.von.getTime() < a.bis.getTime();

/** The Darsteller among `ids` with nothing planned in the Fenster, whatever they play. */
export function freieDarsteller(
  ids: number[],
  belegungen: Belegt[],
  fenster: Pick<Fenster, "von" | "bis">,
): number[] {
  return ids.filter(
    (id) => !belegungen.some((b) => b.darstellerId === id && ueberschneidet(b, fenster)),
  );
}

/** The next `n` Saturdays as German days, today included when it is one. */
export function samstageAb(jetzt: Date, n: number): string[] {
  const heute = berlinTag(jetzt);
  const wochentag = new Date(`${heute}T00:00:00Z`).getUTCDay();
  const erster = tagePlus(heute, (6 - wochentag + 7) % 7);
  return Array.from({ length: n }, (_, i) => tagePlus(erster, i * 7));
}

/**
 * The Darsteller to send, one per Figur in order, or null when the Fenster cannot be staffed.
 * Two Figuren always get two different people. Order: priority, then less work that week, then id.
 */
export function waehleDarsteller(e: {
  figuren: number[];
  darsteller: Kandidat[];
  belegungen: Belegt[];
  fenster: Pick<Fenster, "von" | "bis">;
  minutenDieseWoche?: Map<number, number>;
}): number[] | null {
  const last = (id: number) => e.minutenDieseWoche?.get(id) ?? 0;
  const freiIds = new Set(
    freieDarsteller(
      e.darsteller.map((d) => d.id),
      e.belegungen,
      e.fenster,
    ),
  );
  const frei = e.darsteller
    .filter((d) => freiIds.has(d.id))
    .sort((a, b) => a.prioritaet - b.prioritaet || last(a.id) - last(b.id) || a.id - b.id);

  const besetze = (rest: number[], vergeben: number[]): number[] | null => {
    if (rest.length === 0) return vergeben;
    const [figur, ...weiter] = rest;
    for (const d of frei) {
      if (vergeben.includes(d.id) || !d.figuren.includes(figur!)) continue;
      const ergebnis = besetze(weiter, [...vergeben, d.id]);
      if (ergebnis) return ergebnis;
    }
    return null;
  };
  return besetze(e.figuren, []);
}

/** Up to `n` free starts nearest to the wished one; on a tie the earlier comes first. */
export function naechsteFreie(
  kandidaten: Date[],
  wunsch: Date,
  frei: (start: Date) => boolean,
  n = 3,
): Date[] {
  const ziel = wunsch.getTime();
  return kandidaten
    .filter((d) => d.getTime() !== ziel && frei(d))
    .sort(
      (a, b) =>
        Math.abs(a.getTime() - ziel) - Math.abs(b.getTime() - ziel) || a.getTime() - b.getTime(),
    )
    .slice(0, n);
}

/**
 * The starts the website can sell, per German day: within the day's hours, not before
 * `fruehestens`, and with someone free for every Figur for the whole Fenster. The booking form
 * offers exactly these; the locking transaction checks the chosen one again.
 */
export function freieStartsJeTag(e: {
  tage: string[];
  regeln: { ersterStartMin: number; letzterStartMin: number; rasterMin: number };
  fensterBasis: Omit<FensterEingabe, "beginn">;
  figuren: number[];
  darsteller: Kandidat[];
  belegungen: Belegt[];
  fruehestens: Date;
}): Record<string, Date[]> {
  const ergebnis: Record<string, Date[]> = {};
  for (const tag of e.tage) {
    ergebnis[tag] = startZeiten(tag, e.regeln).filter(
      (beginn) =>
        beginn.getTime() >= e.fruehestens.getTime() &&
        waehleDarsteller({
          figuren: e.figuren,
          darsteller: e.darsteller,
          belegungen: e.belegungen,
          fenster: berechneFenster({ ...e.fensterBasis, beginn }),
        }) !== null,
    );
  }
  return ergebnis;
}
