import { describe, expect, it } from "vitest";

import { HORIZON_H, HORIZON_W, horizon, ridgeY, SKY_H, SKY_W, sky } from "./horizon";

const KEYS = ["/leistungen", "/projekte", "/kontakt", "/suche", "/ueber-uns/team", "404", "x"];

describe("horizon", () => {
  it("draws the same horizon for the same page and another one for another page", () => {
    expect(horizon("/leistungen")).toEqual(horizon("/leistungen"));
    expect(horizon("/leistungen").ridge).not.toBe(horizon("/projekte").ridge);
  });

  it("keeps the ridge inside the picture, below its upper third", () => {
    for (const key of KEYS) {
      for (let x = 0; x <= HORIZON_W; x += 10) {
        const y = ridgeY(key, x);
        expect(y).toBeGreaterThan(HORIZON_H / 3);
        expect(y).toBeLessThan(HORIZON_H);
      }
    }
  });

  it("lays the copper arc over a hilltop, not on a slope", () => {
    for (const key of KEYS) {
      const [, x0, y0] = horizon(key)
        .arc.match(/^M ([\d.]+) ([\d.]+)/)!
        .map(Number);
      const crest = x0! + 90;
      expect(ridgeY(key, crest)).toBeLessThanOrEqual(ridgeY(key, crest - 10) + 0.01);
      expect(ridgeY(key, crest)).toBeLessThanOrEqual(ridgeY(key, crest + 10) + 0.01);
      expect(y0).toBeLessThan(ridgeY(key, x0!));
    }
  });

  it("stands every fir on the ridge, whole and apart from the others, where phones still see it", () => {
    for (const key of KEYS) {
      const { firs } = horizon(key);
      expect(firs.length).toBeGreaterThanOrEqual(3);
      for (const fir of firs) {
        expect(Math.abs(fir.y - ridgeY(key, fir.x))).toBeLessThan(4);
        expect(fir.y - fir.h).toBeGreaterThanOrEqual(0);
        expect(fir.x).toBeGreaterThanOrEqual(HORIZON_W * 0.25);
        expect(fir.x).toBeLessThanOrEqual(HORIZON_W * 0.75);
      }
      const xs = firs.map((f) => f.x).sort((a, b) => a - b);
      xs.slice(1).forEach((x, i) => expect(x - xs[i]!).toBeGreaterThanOrEqual(70));
    }
  });
});

describe("sky", () => {
  it("is the same for the same page and inside its picture", () => {
    expect(sky("/kontakt")).toEqual(sky("/kontakt"));
    expect(sky("/kontakt")).not.toEqual(sky("/suche"));
    for (const key of KEYS) {
      for (const star of sky(key)) {
        expect(star.x).toBeGreaterThanOrEqual(0);
        expect(star.x).toBeLessThanOrEqual(SKY_W);
        expect(star.y).toBeGreaterThanOrEqual(0);
        expect(star.y).toBeLessThanOrEqual(SKY_H);
        expect(star.o).toBeGreaterThan(0);
        expect(star.o).toBeLessThanOrEqual(0.8);
      }
    }
  });

  it("keeps most stars in the upper half", () => {
    const stars = KEYS.flatMap((key) => sky(key));
    const high = stars.filter((s) => s.y < SKY_H / 2).length;
    expect(high / stars.length).toBeGreaterThan(0.6);
  });
});
