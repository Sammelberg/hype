import { describe, expect, it } from "vitest";

import {
  COLOUR_PERIOD,
  flicker,
  isAtRest,
  type Spring,
  starColour,
  stepSpring,
} from "./polar-star";

// Runs the spring at 60fps for `seconds`, returning every p along the way.
function run(from: Spring, target: number, seconds: number) {
  let s = from;
  const ps: number[] = [];
  for (let i = 0; i < seconds * 60; i++) {
    s = stepSpring(s, target, 1 / 60);
    ps.push(s.p);
  }
  return { s, ps };
}

describe("polar star spring", () => {
  it("grows at once, without a delay, and settles in under a second", () => {
    const { s, ps } = run({ p: 0, v: 0 }, 1, 1);
    expect(ps[1]).toBeGreaterThan(0);
    expect(s.p).toBeGreaterThan(0.99);
  });

  it("never overshoots and never stalls on the way", () => {
    const { ps } = run({ p: 0, v: 0 }, 1, 1.5);
    expect(Math.max(...ps)).toBeLessThanOrEqual(1);
    for (let i = 1; i < ps.length; i++) expect(ps[i]).toBeGreaterThanOrEqual(ps[i - 1]!);
  });

  it("reverses mid-way from where it is, with no jump", () => {
    const half = run({ p: 0, v: 0 }, 1, 0.15).s;
    const next = stepSpring(half, 0, 1 / 60);
    expect(Math.abs(next.p - half.p)).toBeLessThan(0.05);
    const { s } = run(half, 0, 1.5);
    expect(isAtRest(s, 0)).toBe(true);
  });

  it("keeps real time on a slow machine: at 8fps it is as far along as at 60fps", () => {
    let slow: Spring = { p: 0, v: 0 };
    for (let i = 0; i < 4; i++) slow = stepSpring(slow, 1, 1 / 8);
    const fast = run({ p: 0, v: 0 }, 1, 0.5).s;
    expect(Math.abs(slow.p - fast.p)).toBeLessThan(0.02);
  });

  it("advances at most a quarter second after a stalled tab", () => {
    const stalled = stepSpring({ p: 0, v: 0 }, 1, 5);
    const quarter = run({ p: 0, v: 0 }, 1, 0.25).s;
    expect(Math.abs(stalled.p - quarter.p)).toBeLessThan(0.02);
  });
});

describe("polar star twinkle", () => {
  it("starts in ice blue, passes white and copper gold, and comes round again", () => {
    expect(starColour(0)).toEqual([147, 191, 240]);
    expect(starColour(COLOUR_PERIOD / 3)).toEqual([255, 255, 255]);
    expect(starColour((COLOUR_PERIOD * 2) / 3)).toEqual([214, 138, 77]);
    expect(starColour(COLOUR_PERIOD)).toEqual(starColour(0));
  });

  it("flickers gently around full brightness", () => {
    const values = Array.from({ length: 2000 }, (_, i) => flicker(i / 60));
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0.86);
    expect(Math.max(...values)).toBeLessThanOrEqual(1.14);
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(0.15);
  });
});
