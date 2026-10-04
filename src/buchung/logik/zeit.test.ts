import { describe, expect, it } from "vitest";

import { berlinStart, terminText } from "./zeit";

describe("berlinStart", () => {
  it("reads a start time on the days around both clock changes", () => {
    expect(berlinStart("2026-03-28", "14:00")?.toISOString()).toBe("2026-03-28T13:00:00.000Z");
    expect(berlinStart("2026-03-29", "14:00")?.toISOString()).toBe("2026-03-29T12:00:00.000Z");
    expect(berlinStart("2026-10-24", "14:00")?.toISOString()).toBe("2026-10-24T12:00:00.000Z");
    expect(berlinStart("2026-10-25", "14:00")?.toISOString()).toBe("2026-10-25T13:00:00.000Z");
  });

  it("refuses a time that does not exist when the clocks go forward", () => {
    expect(berlinStart("2026-03-29", "02:30")).toBeNull();
  });

  it("takes the first of the two moments when the clocks go back and an hour repeats", () => {
    expect(berlinStart("2026-10-25", "02:30")?.toISOString()).toBe("2026-10-25T00:30:00.000Z");
  });

  it("refuses what is not a day and a time", () => {
    expect(berlinStart("2026-13-01", "14:00")).toBeNull();
    expect(berlinStart("2026-11-14", "25:00")).toBeNull();
  });
});

describe("terminText", () => {
  it("names the German day and time of an instant, in winter and in summer", () => {
    expect(terminText(new Date("2026-11-21T09:00:00.000Z"))).toEqual({
      tag: "21. November",
      wochentag: "Samstag",
      uhrzeit: "10:00",
    });
    expect(terminText(new Date("2026-06-20T08:30:00.000Z")).uhrzeit).toBe("10:30");
    // 23:30 UTC on Friday is already Saturday in Germany
    expect(terminText(new Date("2026-11-13T23:30:00.000Z")).tag).toBe("14. November");
  });
});
