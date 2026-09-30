import { describe, expect, it } from "vitest";

import { retryMessage, windowOf } from "./window";

describe("windowOf", () => {
  it("puts every moment of a window into the same one", () => {
    const a = windowOf(new Date("2026-09-30T10:00:00Z"), 600);
    const b = windowOf(new Date("2026-09-30T10:09:59.999Z"), 600);
    expect(a).toEqual(b);
    expect(a.start.toISOString()).toBe("2026-09-30T10:00:00.000Z");
    expect(a.end.toISOString()).toBe("2026-09-30T10:10:00.000Z");
  });

  it("starts a new one at the boundary", () => {
    const next = windowOf(new Date("2026-09-30T10:10:00Z"), 600);
    expect(next.start.toISOString()).toBe("2026-09-30T10:10:00.000Z");
  });
});

describe("retryMessage", () => {
  it("rounds up to whole minutes, at least one", () => {
    expect(retryMessage(5)).toBe("Zu viele Versuche. Bitte warten Sie 1 Minute.");
    expect(retryMessage(61)).toBe("Zu viele Versuche. Bitte warten Sie 2 Minuten.");
  });
});
