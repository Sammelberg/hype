import { describe, expect, it } from "vitest";

import {
  berlinTag,
  berlinUhrzeit,
  berlinZeitpunkt,
  jeTag,
  monatsRaster,
  type KalenderEreignis,
  wochenTage,
} from "./kalender";

describe("berlinZeitpunkt / berlinTag / berlinUhrzeit", () => {
  it("reads a wall-clock time in Germany, summer and winter", () => {
    expect(berlinZeitpunkt("2026-07-15", "09:30").toISOString()).toBe("2026-07-15T07:30:00.000Z");
    expect(berlinZeitpunkt("2026-12-15", "09:30").toISOString()).toBe("2026-12-15T08:30:00.000Z");
  });

  it("gets the days the clocks change right", () => {
    // 29 March 2026: 02:00 becomes 03:00; 25 October 2026: 03:00 becomes 02:00.
    expect(berlinZeitpunkt("2026-03-29", "12:00").toISOString()).toBe("2026-03-29T10:00:00.000Z");
    expect(berlinZeitpunkt("2026-10-25", "12:00").toISOString()).toBe("2026-10-25T11:00:00.000Z");
  });

  it("turns an instant back into the German day and time", () => {
    const d = new Date("2026-10-31T23:30:00.000Z");
    expect(berlinTag(d)).toBe("2026-11-01");
    expect(berlinUhrzeit(d)).toBe("00:30");
  });
});

describe("monatsRaster", () => {
  it("lays a month out in whole weeks from Monday", () => {
    const wochen = monatsRaster("2026-10");
    expect(wochen).toHaveLength(5);
    expect(wochen[0]![0]).toBe("2026-09-28");
    expect(wochen[0]![3]).toBe("2026-10-01");
    expect(wochen.at(-1)!.at(-1)).toBe("2026-11-01");
    expect(wochen.every((w) => w.length === 7)).toBe(true);
  });

  it("needs six weeks for a month that starts on a Sunday", () => {
    // 1 November 2026 is a Sunday.
    expect(monatsRaster("2026-11")).toHaveLength(6);
  });
});

describe("wochenTage", () => {
  it("is Monday to Sunday around a day", () => {
    expect(wochenTage("2026-10-01")).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
  });
});

describe("jeTag", () => {
  const e = (over: Partial<KalenderEreignis>): KalenderEreignis => ({
    key: "x",
    art: "termin",
    titel: "Termin",
    von: "2026-10-05",
    bis: "2026-10-05",
    uhrzeit: null,
    ...over,
  });

  it("puts each event on its days, all-day ones first, then by time", () => {
    const tage = jeTag(
      [
        e({ key: "spaet", uhrzeit: "15:00" }),
        e({ key: "frueh", uhrzeit: "08:30" }),
        e({ key: "ganz", art: "wiedervorlage" }),
        e({ key: "messe", von: "2026-10-04", bis: "2026-10-06" }),
      ],
      ["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07"],
    );
    expect(tage.get("2026-10-05")!.map((x) => x.key)).toEqual(["messe", "ganz", "frueh", "spaet"]);
    expect(tage.get("2026-10-04")!.map((x) => x.key)).toEqual(["messe"]);
    expect(tage.get("2026-10-06")!.map((x) => x.key)).toEqual(["messe"]);
    expect(tage.get("2026-10-07")).toEqual([]);
  });
});
