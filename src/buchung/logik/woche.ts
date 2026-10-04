// The admin's week of Einsätze and Sperren: Monday to Sunday in German time, each stretch placed
// on its days in wall-clock minutes, overlapping ones side by side. Pure, client-safe.
import { tagePlus } from "../../buero/logik/ablauf";
import { berlinUhrzeit, wochenTage } from "../../buero/logik/kalender";
import { berlinStart } from "./zeit";

export type Woche = { tage: string[]; von: Date; bis: Date };

/** The German week a day lies in: its seven days, Monday 00:00 to the next Monday 00:00. */
export function woche(tag: string): Woche {
  const tage = wochenTage(tag);
  return {
    tage,
    von: berlinStart(tage[0]!, "00:00")!,
    bis: berlinStart(tagePlus(tage[6]!, 1), "00:00")!,
  };
}

export type WochenEintrag = {
  key: string;
  von: Date;
  bis: Date;
  /** For an Einsatz: the party itself, inside the Fenster. */
  beginn?: Date;
  partyEnde?: Date;
};

export type Block = {
  key: string;
  vonMin: number;
  bisMin: number;
  partyVonMin?: number;
  partyBisMin?: number;
  /** Side by side with what overlaps it: its lane and how many lanes its cluster has. */
  spur: number;
  spuren: number;
};

const minuten = (d: Date) => {
  const [h, m] = berlinUhrzeit(d).split(":").map(Number);
  return h! * 60 + m!;
};

export function legeWocheAus(tage: string[], eintraege: WochenEintrag[]): Block[][] {
  return tage.map((tag) => {
    const start = berlinStart(tag, "00:00")!.getTime();
    const ende = berlinStart(tagePlus(tag, 1), "00:00")!.getTime();
    const imTag = (d: Date) => (d.getTime() <= start ? 0 : d.getTime() >= ende ? 1440 : minuten(d));

    const bloecke = eintraege
      .filter((e) => e.von.getTime() < ende && e.bis.getTime() > start)
      .map((e) => {
        const b: Omit<Block, "spur" | "spuren"> = {
          key: e.key,
          vonMin: imTag(e.von),
          bisMin: imTag(e.bis),
        };
        if (e.beginn && e.partyEnde && e.beginn.getTime() < ende && e.partyEnde.getTime() > start) {
          b.partyVonMin = imTag(e.beginn);
          b.partyBisMin = imTag(e.partyEnde);
        }
        return b;
      })
      .sort((a, b) => a.vonMin - b.vonMin || b.bisMin - a.bisMin);

    // Clusters of overlapping blocks share the column; each block takes the first free lane.
    const ergebnis: Block[] = [];
    let cluster: Block[] = [];
    let clusterEnde = -1;
    const schliesse = () => {
      const spuren = Math.max(0, ...cluster.map((b) => b.spur + 1));
      for (const b of cluster) b.spuren = spuren;
      ergebnis.push(...cluster);
      cluster = [];
    };
    for (const b of bloecke) {
      if (b.vonMin >= clusterEnde && cluster.length > 0) schliesse();
      const belegt = new Set(cluster.filter((c) => c.bisMin > b.vonMin).map((c) => c.spur));
      let spur = 0;
      while (belegt.has(spur)) spur++;
      cluster.push({ ...b, spur, spuren: 1 });
      clusterEnde = Math.max(clusterEnde, b.bisMin);
    }
    if (cluster.length > 0) schliesse();
    return ergebnis;
  });
}

/** The ISO week number of a day (the week with the year's first Thursday is week 1). */
export function kalenderwoche(tag: string) {
  const d = new Date(`${tag}T00:00:00Z`);
  const wochentag = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - wochentag + 3);
  const ersterDonnerstag = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const tage = (d.getTime() - ersterDonnerstag.getTime()) / 86_400_000;
  return 1 + Math.round((tage - 3 + ((ersterDonnerstag.getUTCDay() + 6) % 7)) / 7);
}
