import { describe, expect, it } from "vitest";

import { kalenderwoche, legeWocheAus, woche } from "./woche";

describe("woche", () => {
  it("runs Monday to Sunday in German time, as instants", () => {
    const w = woche("2026-11-18");
    expect(w.tage).toEqual([
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
    ]);
    expect(w.von.toISOString()).toBe("2026-11-15T23:00:00.000Z");
    expect(w.bis.toISOString()).toBe("2026-11-22T23:00:00.000Z");
  });

  it("keeps the week whole across the night the clocks go back", () => {
    const w = woche("2026-10-25");
    expect(w.von.toISOString()).toBe("2026-10-18T22:00:00.000Z");
    expect(w.bis.toISOString()).toBe("2026-10-25T23:00:00.000Z");
  });
});

const z = (iso: string) => new Date(iso);

describe("legeWocheAus", () => {
  const w = woche("2026-11-21");

  it("places a visit on its day in German wall-clock minutes, travel and party apart", () => {
    // Wiesbaden, Saturday 21 November: gone 12:40, party 14:00–15:30, home 16:45 (winter time).
    const tage = legeWocheAus(w.tage, [
      {
        key: "b1",
        von: z("2026-11-21T11:40:00.000Z"),
        bis: z("2026-11-21T15:45:00.000Z"),
        beginn: z("2026-11-21T13:00:00.000Z"),
        partyEnde: z("2026-11-21T14:30:00.000Z"),
      },
    ]);
    const samstag = tage[5]!;
    expect(samstag).toEqual([
      {
        key: "b1",
        vonMin: 760,
        bisMin: 1005,
        partyVonMin: 840,
        partyBisMin: 930,
        spur: 0,
        spuren: 1,
      },
    ]);
    expect(tage.filter((t) => t.length > 0)).toHaveLength(1);
  });

  it("puts overlapping visits side by side, and a later one back to full width", () => {
    const tage = legeWocheAus(w.tage, [
      { key: "a", von: z("2026-11-21T09:00:00.000Z"), bis: z("2026-11-21T12:00:00.000Z") },
      { key: "b", von: z("2026-11-21T10:00:00.000Z"), bis: z("2026-11-21T11:00:00.000Z") },
      { key: "c", von: z("2026-11-21T14:00:00.000Z"), bis: z("2026-11-21T15:00:00.000Z") },
    ]);
    expect(tage[5]!.map((b) => [b.key, b.spur, b.spuren])).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
      ["c", 0, 1],
    ]);
  });

  it("cuts a stretch that runs past midnight at the end of its day and goes on the next", () => {
    const tage = legeWocheAus(w.tage, [
      { key: "s", von: z("2026-11-20T21:00:00.000Z"), bis: z("2026-11-21T07:00:00.000Z") },
    ]);
    expect(tage[4]!.map((b) => [b.vonMin, b.bisMin])).toEqual([[1320, 1440]]);
    expect(tage[5]!.map((b) => [b.vonMin, b.bisMin])).toEqual([[0, 480]]);
  });
});

describe("kalenderwoche", () => {
  it("counts ISO weeks, including the turns of the year", () => {
    expect(kalenderwoche("2026-11-21")).toBe(47);
    expect(kalenderwoche("2027-01-01")).toBe(53);
    expect(kalenderwoche("2026-01-01")).toBe(1);
    expect(kalenderwoche("2024-12-30")).toBe(1);
  });
});
