import { describe, expect, it } from "vitest";

import { carryCurve } from "./glide";

// Speed at the start in px/s, from the curve (numerically).
const startSpeed = ({ duration, easing }: ReturnType<typeof carryCurve>, distance: number) =>
  ((easing(1e-4) - easing(0)) / 1e-4) * (distance / duration);
const endSpeed = ({ duration, easing }: ReturnType<typeof carryCurve>, distance: number) =>
  ((easing(1) - easing(1 - 1e-4)) / 1e-4) * (distance / duration);

describe("carryCurve", () => {
  it("starts at the page's own speed and ends at rest on the target", () => {
    for (const speed of [0, 150, 400, 900]) {
      const curve = carryCurve(300, speed, { duration: 0.8 });
      expect(curve.easing(0)).toBe(0);
      expect(curve.easing(1)).toBeCloseTo(1, 10);
      expect(startSpeed(curve, 300)).toBeCloseTo(speed, 0);
      expect(endSpeed(curve, 300)).toBeCloseTo(0, 0);
    }
  });

  it("shortens the glide for a fast page instead of overshooting the target", () => {
    const curve = carryCurve(300, 3000, { duration: 0.8 });
    expect(curve.duration).toBeCloseTo(0.3, 5);
    expect(startSpeed(curve, 300)).toBeCloseTo(3000, -1);
    for (let t = 0; t <= 1; t += 0.05) expect(curve.easing(t)).toBeLessThanOrEqual(1 + 1e-9);
  });

  it("works upwards too", () => {
    const curve = carryCurve(-300, -500, { duration: 0.8 });
    expect(startSpeed(curve, -300)).toBeCloseTo(-500, 0);
  });

  it("turns a page that ran past the target round smoothly, without a jump", () => {
    // Target 100px back up, the page still moving down at 400px/s.
    const curve = carryCurve(-100, 400, { duration: 0.8 });
    expect(startSpeed(curve, -100)).toBeCloseTo(400, 0);
    expect(curve.easing(1)).toBeCloseTo(1, 10);
  });

  it("does nothing for a page already there", () => {
    expect(carryCurve(0.4, 300, { duration: 0.8 }).duration).toBe(0);
  });
});
