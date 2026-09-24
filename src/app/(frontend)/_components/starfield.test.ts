import { describe, expect, it } from "vitest";

import { AREA_PER_STAR, createStars, MAX_STARS, starAlpha } from "./starfield";

describe("createStars", () => {
  it("scales the count with the sky's area and caps it", () => {
    expect(createStars(900, 400)).toHaveLength(Math.round((900 * 400) / AREA_PER_STAR));
    expect(createStars(4000, 2000)).toHaveLength(MAX_STARS);
  });

  it("draws the same sky for the same size", () => {
    expect(createStars(1200, 600)).toEqual(createStars(1200, 600));
  });

  it("keeps every star inside the canvas and grouped by tint", () => {
    const stars = createStars(1440, 700);
    for (const star of stars) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThan(1440);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThan(700);
    }
    const tints = stars.map((s) => s.tint);
    expect(tints).toEqual([...tints].sort((a, b) => a - b));
  });

  it("is a restrained sky: mostly faint specks, few haloed stars, denser up high", () => {
    const stars = createStars(2560, 1200);
    const haloed = stars.filter((s) => s.halo).length / stars.length;
    expect(haloed).toBeLessThan(0.1);
    expect(stars.filter((s) => s.r < 0.8).length / stars.length).toBeGreaterThan(0.6);
    const upper = stars.filter((s) => s.y < 600).length;
    expect(upper).toBeGreaterThan(stars.length - upper);
  });
});

describe("starAlpha", () => {
  const star = createStars(1000, 500)[0]!;

  it("twinkles between the dimmed and the resting brightness", () => {
    for (let t = 0; t < 20; t += 0.37) {
      const a = starAlpha(star, t);
      expect(a).toBeLessThanOrEqual(star.alpha + 1e-9);
      expect(a).toBeGreaterThanOrEqual(star.alpha * (1 - star.amp) - 1e-9);
    }
  });

  it("holds the resting brightness for reduced motion", () => {
    expect(starAlpha(star, 3.2, true)).toBe(star.alpha);
  });
});
