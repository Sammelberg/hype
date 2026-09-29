import { describe, expect, it } from "vitest";

import { afterFailure, afterSuccess, isLocked, lockMessage, MAX_ATTEMPTS } from "./lockout";

const t0 = new Date("2026-09-29T20:00:00Z");
const minutes = (n: number) => new Date(t0.getTime() + n * 60_000);

describe("lockout", () => {
  it("locks for ten minutes after five failures in a row", () => {
    let state = { failedAttempts: 0, lockedUntil: null as Date | null };
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) {
      state = afterFailure(state, t0);
      expect(isLocked(state, t0)).toBe(false);
    }
    state = afterFailure(state, t0);
    expect(isLocked(state, t0)).toBe(true);
    expect(state.lockedUntil).toEqual(minutes(10));
    expect(lockMessage(state, minutes(2))).toBe(
      "Zu viele Fehlversuche. Bitte warten Sie 8 Minuten.",
    );
  });

  it("opens again when the lock has run out and counts from zero", () => {
    const locked = { failedAttempts: 0, lockedUntil: minutes(10) };
    expect(isLocked(locked, minutes(10))).toBe(false);
    expect(afterFailure(locked, minutes(11))).toEqual({ failedAttempts: 1, lockedUntil: null });
  });

  it("a successful login clears the count", () => {
    expect(afterSuccess()).toEqual({ failedAttempts: 0, lockedUntil: null });
  });

  it("says one minute, not zero, right before the lock ends", () => {
    const state = { failedAttempts: 0, lockedUntil: minutes(10) };
    expect(lockMessage(state, new Date(minutes(10).getTime() - 10_000))).toContain("1 Minute.");
  });
});
