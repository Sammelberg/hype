import { describe, expect, it } from "vitest";

import { createLight, lightAt, lightCount, MAX_LIGHTS } from "./lights";
import { random } from "./starfield";

describe("lights", () => {
  const lights = Array.from({ length: 300 }, (_, i) => createLight(random(i + 1), 1440, 900, 0));

  it("are few, like the block's sixteen", () => {
    expect(lightCount(375)).toBe(6);
    expect(lightCount(1440)).toBe(10);
    expect(lightCount(2560)).toBe(17);
    expect(lightCount(4000)).toBe(MAX_LIGHTS);
  });

  it("are small points born at random in the block's band", () => {
    const xs = lights.map((l) => l.x);
    expect(Math.min(...xs)).toBeLessThan(1440 * 0.1);
    expect(Math.max(...xs)).toBeGreaterThan(1440 * 0.9);
    for (const l of lights) {
      expect(l.y).toBeGreaterThanOrEqual(900 * 0.6);
      expect(l.y).toBeLessThanOrEqual(900 * 0.94);
      expect(l.size).toBeGreaterThanOrEqual(3);
      expect(l.size).toBeLessThanOrEqual(6);
    }
  });

  it("drift only a little, as in the block: up 28–60px by mid-life, at most ~120px in all", () => {
    for (const l of lights) {
      expect(-l.dy).toBeGreaterThanOrEqual(28);
      expect(-l.dy).toBeLessThanOrEqual(60);
      const end = lightAt(l, l.life * 0.999)!;
      expect(Math.hypot(end.x - l.x, end.y - l.y)).toBeLessThan(125); // 1.6·32 across, 1.8·60 up, ±3 meander
      expect(end.y).toBeLessThan(l.y);
    }
  });

  it("keep the block's firefly rhythm: glow, dim to a third, glow again, go out", () => {
    const l = lights[0]!;
    const at = (p: number) => lightAt(l, l.life * p)!.alpha;
    expect(at(0.001)).toBeLessThan(0.01);
    expect(at(0.15)).toBeCloseTo(1, 5);
    expect(at(0.5)).toBeCloseTo(0.35, 5);
    expect(at(0.85)).toBeCloseTo(0.95, 5);
    expect(at(0.999)).toBeLessThan(0.01);
    expect(lightAt(l, l.life + 0.01)).toBeNull();
    expect(lightAt(l, -0.01)).toBeNull();
  });

  it("change smoothly from frame to frame", () => {
    const l = lights[5]!;
    let prev = lightAt(l, 0)!;
    for (let t = 1 / 60; t < l.life; t += 1 / 60) {
      const now = lightAt(l, t);
      if (!now) break;
      expect(Math.abs(now.alpha - prev.alpha)).toBeLessThan(0.05);
      expect(Math.hypot(now.x - prev.x, now.y - prev.y)).toBeLessThan(1.5);
      prev = now;
    }
  });
});
