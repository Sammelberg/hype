import { describe, expect, it } from "vitest";

import { faelligeErinnerungen } from "./erinnerung";

// Saturday 21 November 2026, 14:00 in Germany; booked a month before.
const beginn = new Date("2026-11-21T13:00:00.000Z");
const gebucht = new Date("2026-10-20T10:00:00.000Z");
const um = (iso: string) => faelligeErinnerungen({ beginn, gebucht, jetzt: new Date(iso) });

describe("faelligeErinnerungen", () => {
  it("sends the week-ahead mail from seven days before, not to a party booked later", () => {
    expect(um("2026-11-14T12:00:00.000Z")).toEqual([]);
    expect(um("2026-11-14T13:05:00.000Z")).toEqual(["erinnerung"]);
    expect(um("2026-11-20T12:00:00.000Z")).toEqual([]);
    expect(
      faelligeErinnerungen({
        beginn,
        gebucht: new Date("2026-11-16T10:00:00.000Z"),
        jetzt: new Date("2026-11-17T10:00:00.000Z"),
      }),
    ).toEqual([]);
  });

  it("sends the day-before mail from 17:00 German time", () => {
    expect(um("2026-11-20T15:55:00.000Z")).toEqual([]);
    expect(um("2026-11-20T16:00:00.000Z")).toEqual(["vortag"]);
  });

  it("asks how it was from 10:00 the day after, for three days", () => {
    expect(um("2026-11-22T08:55:00.000Z")).toEqual([]);
    expect(um("2026-11-22T09:00:00.000Z")).toEqual(["bewertung"]);
    expect(um("2026-11-24T20:00:00.000Z")).toEqual(["bewertung"]);
    expect(um("2026-11-25T09:00:00.000Z")).toEqual([]);
  });

  it("keeps German hours across the clock change", () => {
    // Party Sunday 25 October 2026 (clocks go back that night), 11:00 German time = 10:00 UTC.
    const herbst = new Date("2026-10-25T10:00:00.000Z");
    const r = (iso: string) =>
      faelligeErinnerungen({ beginn: herbst, gebucht, jetzt: new Date(iso) });
    // Saturday 24th, 17:00 summer time = 15:00 UTC.
    expect(r("2026-10-24T14:59:00.000Z")).toEqual([]);
    expect(r("2026-10-24T15:00:00.000Z")).toEqual(["vortag"]);
    // Monday 26th, 10:00 winter time = 09:00 UTC.
    expect(r("2026-10-26T08:59:00.000Z")).toEqual([]);
    expect(r("2026-10-26T09:00:00.000Z")).toEqual(["bewertung"]);
  });
});
