import { describe, expect, it } from "vitest";

import {
  AREA_PER_STAR,
  createMeteor,
  createStars,
  MAX_STARS,
  meteorAt,
  nextGap,
  random,
  starAlpha,
} from "./starfield";

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

describe("shooting stars", () => {
  const meteors = Array.from({ length: 400 }, (_, i) => createMeteor(random(i + 1), 1440, 800, 10));
  const angle = (m: (typeof meteors)[number]) => (Math.atan2(m.dy, Math.abs(m.dx)) * 180) / Math.PI;

  it("always fall, at any angle from shallow to steep (15–65° below the horizon)", () => {
    for (const m of meteors) {
      expect(m.dy).toBeGreaterThan(0);
      expect(angle(m)).toBeGreaterThanOrEqual(15 - 1e-9);
      expect(angle(m)).toBeLessThanOrEqual(65 + 1e-9);
    }
  });

  it("are random: both directions, spread angles and places, varied sizes", () => {
    const left = meteors.filter((m) => m.dx < 0).length / meteors.length;
    expect(left).toBeGreaterThan(0.35);
    expect(left).toBeLessThan(0.65);
    const angles = meteors.map(angle);
    expect(Math.max(...angles) - Math.min(...angles)).toBeGreaterThan(40);
    const xs = meteors.map((m) => m.x);
    expect(Math.min(...xs)).toBeLessThan(1440 * 0.1);
    expect(Math.max(...xs)).toBeGreaterThan(1440 * 0.9);
    for (const m of meteors) expect(m.y).toBeLessThanOrEqual(800 * 0.45);
    expect(meteors.some((m) => m.bright)).toBe(true);
    expect(meteors.some((m) => m.alpha < 0.6)).toBe(true);
    expect(new Set(meteors.map((m) => m.tint)).size).toBe(3);
  });

  it("come in an uneven rhythm: bursts, pauses and lulls", () => {
    const rand = random(99);
    const gaps = Array.from({ length: 500 }, () => nextGap(rand));
    expect(gaps.some((g) => g < 0.35)).toBe(true);
    expect(gaps.some((g) => g > 1.8)).toBe(true);
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    expect(mean).toBeGreaterThan(0.6);
    expect(mean).toBeLessThan(1.6);
  });

  it("fade in fast, grow their tail, fade out and burn out after their life", () => {
    const m = meteors[0]!;
    expect(meteorAt(m, m.born - 0.01)).toBeNull();
    const early = meteorAt(m, m.born + m.life * 0.05)!;
    const mid = meteorAt(m, m.born + m.life * 0.3)!;
    const late = meteorAt(m, m.born + m.life * 0.95)!;
    expect(early.alpha).toBeLessThan(mid.alpha);
    expect(late.alpha).toBeLessThan(mid.alpha);
    expect(Math.hypot(mid.x - mid.tailX, mid.y - mid.tailY)).toBeCloseTo(m.length, 5);
    expect(Math.hypot(early.x - early.tailX, early.y - early.tailY)).toBeLessThan(m.length);
    expect(meteorAt(m, m.born + m.life + 0.01)).toBeNull();
  });

  it("move along their direction", () => {
    const m = meteors[1]!;
    const a = meteorAt(m, m.born + 0.1)!;
    const b = meteorAt(m, m.born + 0.2)!;
    expect(Math.sign(b.x - a.x)).toBe(Math.sign(m.dx));
    expect(b.y).toBeGreaterThan(a.y);
  });
});
