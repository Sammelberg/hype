import { describe, expect, it } from "vitest";

import { kalenderTage, tagText, uhrzeiten, wochentag, zeitraumText } from "./kalender";

describe("kalenderTage", () => {
  it("starts on the Monday of this week and runs whole weeks", () => {
    // Thursday 12 November 2026
    const tage = kalenderTage("2026-11-12", 0, 2);
    expect(tage).toHaveLength(14);
    expect(tage[0]).toBe("2026-11-09");
    expect(wochentag(tage[0]!)).toBe(1);
    expect(tage.at(-1)).toBe("2026-11-22");
  });

  it("pages on by whole weeks, across the clock change and the year", () => {
    expect(kalenderTage("2026-10-21", 0, 1)[6]).toBe("2026-10-25");
    expect(kalenderTage("2026-12-28", 1, 1)[0]).toBe("2027-01-04");
    // A Sunday belongs to the week that began the Monday before.
    expect(kalenderTage("2026-11-15", 0, 1)[0]).toBe("2026-11-09");
  });
});

describe("texts", () => {
  it("names days and the span in German", () => {
    expect(tagText("2026-11-14")).toBe("Samstag, 14. November");
    expect(zeitraumText(kalenderTage("2026-11-12", 0, 6))).toBe("November bis Dezember 2026");
    expect(zeitraumText(["2026-12-28", "2027-01-03"])).toBe("Dezember 2026 bis Januar 2027");
  });

  it("lists the wished times of a day", () => {
    expect(uhrzeiten({ ersterStartMin: 600, letzterStartMin: 690, rasterMin: 30 })).toEqual([
      "10:00",
      "10:30",
      "11:00",
      "11:30",
    ]);
  });
});
