// Which starts a day offers, which Darsteller is free for a Fenster, and the nearest free starts
// when the wished one is taken. Availability is per Darsteller: a Figur is free when at least one
// Darsteller who plays it is free. Pure: the booking form and the locking transaction share it.
import { berlinStart } from "./zeit";
import type { Fenster } from "./fenster";

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
  const frei = e.darsteller
    .filter(
      (d) => !e.belegungen.some((b) => b.darstellerId === d.id && ueberschneidet(b, e.fenster)),
    )
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
