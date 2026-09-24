import { describe, expect, it } from "vitest";

import { createLight, lightAt, lightCount, MAX_LIGHTS } from "./lights";
import { random } from "./starfield";

describe("lights", () => {
  const lights = Array.from({ length: 300 }, (_, i) => createLight(random(i + 1), 1440, 900, 0));

  it("scale with the width and stay within bounds", () => {
    expect(lightCount(375)).toBe(6);
    expect(lightCount(1440)).toBe(21);
    expect(lightCount(4000)).toBe(MAX_LIGHTS);
  });

  it("are born at random across the forest band", () => {
    const xs = lights.map((l) => l.x);
    expect(Math.min(...xs)).toBeLessThan(1440 * 0.1);
    expect(Math.max(...xs)).toBeGreaterThan(1440 * 0.9);
    for (const l of lights) {
      expect(l.y).toBeGreaterThanOrEqual(900 * 0.65);
      expect(l.y).toBeLessThanOrEqual(900 * 0.95);
    }
    expect(new Set(lights.map((l) => l.tint)).size).toBe(3);
  });

  it("rise, sway, fade in and out, and are gone after their life", () => {
    const light = lights[0]!;
    expect(lightAt(light, -0.1)).toBeNull();
    const early = lightAt(light, light.life * 0.05)!;
    const mid = lightAt(light, light.life * 0.5)!;
    const late = lightAt(light, light.life * 0.97)!;
    expect(mid.y).toBeLessThan(early.y);
    expect(late.y).toBeLessThan(mid.y);
    expect(late.y).toBeGreaterThanOrEqual(light.y - light.rise - 1e-9);
    expect(early.alpha).toBeLessThan(mid.alpha);
    expect(late.alpha).toBeLessThan(mid.alpha);
    expect(Math.abs(mid.x - light.x)).toBeLessThanOrEqual(light.sway + 1e-9);
    expect(lightAt(light, light.life + 0.01)).toBeNull();
  });

  it("are calm: slow to rise and to sway, long-lived", () => {
    for (const l of lights) {
      expect(l.life).toBeGreaterThanOrEqual(9);
      expect(l.rise / l.life).toBeLessThan(35); // px per second, on average
      expect(l.swaySpeed).toBeLessThanOrEqual(0.8);
    }
  });

  it("each one differs: speed, rise, sway and size vary", () => {
    const spread = (pick: (l: (typeof lights)[number]) => number) => {
      const v = lights.map(pick);
      return Math.max(...v) - Math.min(...v);
    };
    expect(spread((l) => l.life)).toBeGreaterThan(4);
    expect(spread((l) => l.rise)).toBeGreaterThan(120);
    expect(spread((l) => l.sway)).toBeGreaterThan(15);
    expect(spread((l) => l.r)).toBeGreaterThan(1);
  });
});
