import { describe, expect, it } from "vitest";

import { berechneFenster } from "./fenster";
import {
  freieDarsteller,
  freieStartsJeTag,
  naechsteFreie,
  samstageAb,
  startZeiten,
  waehleDarsteller,
} from "./raster";

const zeiten = (tag: string, von: number, bis: number, schritt = 30) =>
  startZeiten(tag, { ersterStartMin: von, letzterStartMin: bis, rasterMin: schritt }).map((d) =>
    d.toISOString().slice(11, 16),
  );

describe("startZeiten", () => {
  it("offers a start every half hour within the day's hours", () => {
    const z = zeiten("2026-11-14", 600, 1080);
    expect(z).toHaveLength(17);
    expect(z[0]).toBe("09:00"); // 10:00 in Germany, winter time
    expect(z.at(-1)).toBe("17:00");
  });

  it("leaves out the hour that does not exist when the clocks go forward", () => {
    expect(zeiten("2026-03-29", 60, 240)).toEqual(["00:00", "00:30", "01:00", "01:30", "02:00"]);
  });
});

const REGELN = { vorbereitungMin: 20, abbauMin: 15, extrasDeltaMin: 0 };
const fenster = (iso: string, fahrtMinuten: number, dauerMin: number) =>
  berechneFenster({ beginn: new Date(iso), fahrtMinuten, dauerMin, ...REGELN });

// Klassik 90 min in Wiesbaden (60 min away) at 14:00: the performer is gone 12:40–16:45.
const wiesbaden = fenster("2026-11-14T13:00:00.000Z", 60, 90);
const belegtWiesbaden = [{ darstellerId: 1, von: wiesbaden.von, bis: wiesbaden.bis }];

describe("waehleDarsteller", () => {
  const anna = { id: 1, prioritaet: 10, figuren: [1, 2] };
  const ben = { id: 2, prioritaet: 20, figuren: [1] };

  it("does not sell a Mainz slot that would only fit if the drive back from Wiesbaden were ignored", () => {
    // 17:00 in Mainz, also 60 min away: the window opens 15:40, while Anna is still on her way.
    const mainz = fenster("2026-11-14T16:00:00.000Z", 60, 45);
    expect(
      waehleDarsteller({
        figuren: [1],
        darsteller: [anna],
        belegungen: belegtWiesbaden,
        fenster: mainz,
      }),
    ).toBeNull();
    expect(
      waehleDarsteller({
        figuren: [1],
        darsteller: [anna, ben],
        belegungen: belegtWiesbaden,
        fenster: mainz,
      }),
    ).toEqual([2]);
  });

  it("lets a visit start the moment the previous one has ended", () => {
    const danach = {
      von: wiesbaden.bis,
      bis: new Date(wiesbaden.bis.getTime() + 3_600_000),
      partyEnde: wiesbaden.bis,
    };
    expect(
      waehleDarsteller({
        figuren: [1],
        darsteller: [anna],
        belegungen: belegtWiesbaden,
        fenster: danach,
      }),
    ).toEqual([1]);
  });

  it("sends two different performers for two characters, even when the first choice could play both", () => {
    const frei = fenster("2026-11-21T13:00:00.000Z", 0, 120);
    expect(
      waehleDarsteller({ figuren: [1, 2], darsteller: [anna, ben], belegungen: [], fenster: frei }),
    ).toEqual([2, 1]);
    expect(
      waehleDarsteller({ figuren: [1, 2], darsteller: [anna], belegungen: [], fenster: frei }),
    ).toBeNull();
  });

  it("picks by priority first, then the one with less work that week", () => {
    const frei = fenster("2026-11-21T13:00:00.000Z", 0, 45);
    const cara = { id: 3, prioritaet: 10, figuren: [1] };
    expect(
      waehleDarsteller({ figuren: [1], darsteller: [ben, anna], belegungen: [], fenster: frei }),
    ).toEqual([1]);
    expect(
      waehleDarsteller({
        figuren: [1],
        darsteller: [anna, cara],
        belegungen: [],
        fenster: frei,
        minutenDieseWoche: new Map([
          [1, 600],
          [3, 120],
        ]),
      }),
    ).toEqual([3]);
  });
});

describe("naechsteFreie", () => {
  const um = (hhmm: string) => new Date(`2026-11-14T${hhmm}:00.000Z`);
  const kandidaten = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"].map(um);

  it("offers the free starts nearest to the wished one, earlier first on a tie", () => {
    const belegt = new Set(["12:00", "13:00", "14:00"].map((h) => um(h).getTime()));
    const frei = (d: Date) => !belegt.has(d.getTime());
    expect(
      naechsteFreie(kandidaten, um("13:00"), frei, 3).map((d) => d.toISOString().slice(11, 16)),
    ).toEqual(["11:00", "15:00", "10:00"]);
  });
});

describe("freieDarsteller", () => {
  it("names who is free for a Fenster, whatever they play", () => {
    const f = fenster("2026-11-14T16:00:00.000Z", 60, 45);
    expect(freieDarsteller([1, 2], belegtWiesbaden, f)).toEqual([2]);
    expect(freieDarsteller([1], [], f)).toEqual([1]);
  });
});

describe("samstageAb", () => {
  it("lists the coming Saturdays in German days, today included when it is one", () => {
    // Thursday 12 November 2026, evening in Germany
    expect(samstageAb(new Date("2026-11-12T20:00:00.000Z"), 3)).toEqual([
      "2026-11-14",
      "2026-11-21",
      "2026-11-28",
    ]);
    // Saturday 14 November, 00:30 in Germany is still that Saturday
    expect(samstageAb(new Date("2026-11-13T23:30:00.000Z"), 1)).toEqual(["2026-11-14"]);
  });
});

describe("freieStartsJeTag", () => {
  const regeln = { ersterStartMin: 600, letzterStartMin: 720, rasterMin: 60 };
  const basis = {
    fahrtMinuten: 60,
    vorbereitungMin: 20,
    dauerMin: 90,
    extrasDeltaMin: 0,
    abbauMin: 15,
  };
  const anna = { id: 1, prioritaet: 10, figuren: [1] };
  const um = (iso: string) => new Date(iso);

  it("offers per day the starts someone who plays the Figur is free for, the whole Fenster long", () => {
    // Anna is busy 12:30–15:00 on Saturday 14 November (German time).
    const belegt = [
      { darstellerId: 1, von: um("2026-11-14T11:30:00Z"), bis: um("2026-11-14T14:00:00Z") },
    ];
    const frei = freieStartsJeTag({
      tage: ["2026-11-14", "2026-11-15"],
      regeln,
      fensterBasis: basis,
      figuren: [1],
      darsteller: [anna],
      belegungen: belegt,
      fruehestens: um("2026-11-01T00:00:00Z"),
    });
    const uhr = (tag: string) => frei[tag]!.map((d) => d.toISOString().slice(11, 16));
    // 10:00 → Fenster 08:40–13:25 hits the 12:30 Belegung; 11:00 and 12:00 too.
    expect(uhr("2026-11-14")).toEqual([]);
    expect(uhr("2026-11-15")).toEqual(["09:00", "10:00", "11:00"]);
  });

  it("leaves out starts before the earliest moment the website may sell", () => {
    const frei = freieStartsJeTag({
      tage: ["2026-11-15"],
      regeln,
      fensterBasis: basis,
      figuren: [1],
      darsteller: [anna],
      belegungen: [],
      fruehestens: um("2026-11-15T09:30:00Z"),
    });
    expect(frei["2026-11-15"]!.map((d) => d.toISOString().slice(11, 16))).toEqual([
      "10:00",
      "11:00",
    ]);
  });
});
