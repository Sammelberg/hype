import { describe, expect, it } from "vitest";

import { loeschGrenze } from "./grenze";

// Local wall-clock time, as the server keeps it: date-fns counts months in local time.
const local = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours()];

describe("loeschGrenze", () => {
  it("goes back six months to the same day and hour", () => {
    expect(local(loeschGrenze(new Date(2026, 8, 30, 3)))).toEqual([2026, 3, 30, 3]);
  });

  it("stops at the end of a shorter month instead of running over", () => {
    expect(local(loeschGrenze(new Date(2026, 7, 31, 12)))).toEqual([2026, 2, 28, 12]);
  });
});
