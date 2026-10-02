import { describe, expect, it } from "vitest";

import { FIR_DESIGNS } from "@/components/site/fir-shapes";

import { hullOf } from "./fir-hull";

describe("hullOf", () => {
  it("wraps a square's points in the square", () => {
    expect(hullOf("M0 0L10 0L10 10L0 10L5 5Z")).toBe("M0 0 L10 0 L10 10 L0 10 Z");
  });

  it("gives each of our firs one closed outline around all its strokes", () => {
    for (const fir of Object.values(FIR_DESIGNS)) {
      const hull = hullOf(fir.d);
      expect(hull.startsWith("M")).toBe(true);
      expect(hull.endsWith("Z")).toBe(true);
      const [vx, vy, vw, vh] = fir.viewBox.split(" ").map(Number) as [
        number,
        number,
        number,
        number,
      ];
      for (const [, x, y] of hull.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)) {
        expect(Number(x)).toBeGreaterThanOrEqual(vx - 1);
        expect(Number(x)).toBeLessThanOrEqual(vx + vw + 1);
        expect(Number(y)).toBeGreaterThanOrEqual(vy - 1);
        expect(Number(y)).toBeLessThanOrEqual(vy + vh + 1);
      }
    }
  });
});
