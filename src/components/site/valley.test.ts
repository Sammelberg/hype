import { describe, expect, it } from "vitest";

import { ridgeAt, valley, VALLEY_H, VALLEY_W, type ValleySpec } from "./valley";

const spec: ValleySpec = {
  seed: 7,
  near: [
    [0, 690],
    [340, 575],
    [470, 655],
    [880, 575],
    [1200, 690],
  ],
  firs: [
    { design: "konkav", x: 305, h: 240 },
    { design: "schlank", x: 915, h: 260 },
  ],
  moon: { x: 600, y: 150, r: 30, lit: 0.3, side: "right" },
  motif: { name: "viadukt", deck: 600 },
};

const RIDGES = ["far", "mid", "near"] as const;

describe("valley", () => {
  it("draws the same valley for the same spec", () => {
    expect(valley(spec)).toEqual(valley(spec));
  });

  it("draws other mountains for another seed", () => {
    expect(valley({ ...spec, seed: 8 }).ridges.far.fill).not.toBe(valley(spec).ridges.far.fill);
  });

  it("draws every ridge in straight lines, peak to notch, no curves", () => {
    for (const r of RIDGES)
      expect(valley(spec).ridges[r].edge).toMatch(/^M [\d.-]+ [\d.-]+( L [\d.-]+ [\d.-]+)+$/);
  });

  it("stacks high mountains, a middle range and the near skyline back to front", () => {
    for (const seed of [1, 7, 23, 41, 99]) {
      const s = { ...spec, seed };
      const mean = { far: 0, mid: 0, near: 0 };
      let highest = VALLEY_H;
      for (let x = 0; x <= VALLEY_W; x += 20) {
        for (const r of RIDGES) {
          const y = ridgeAt(s, r, x);
          expect(y).toBeGreaterThan(VALLEY_H * 0.2);
          expect(y).toBeLessThan(VALLEY_H);
          mean[r] += y;
        }
        highest = Math.min(highest, ridgeAt(s, "far", x));
      }
      expect(mean.far).toBeLessThan(mean.mid);
      expect(mean.mid).toBeLessThan(mean.near);
      // The far peaks rise high: above the upper half of the frame.
      expect(highest).toBeLessThan(VALLEY_H * 0.45);
    }
  });

  it("follows the near skyline it is given", () => {
    expect(ridgeAt(spec, "near", 340)).toBe(575);
    expect(ridgeAt(spec, "near", 405)).toBe(615);
  });

  it("stands every fir on its own ridge, its foot a little into the ground", () => {
    for (const seed of [7, 23, 41]) {
      const s = { ...spec, seed };
      for (const fir of valley(s).firs) {
        const ground = ridgeAt(s, fir.ridge, fir.x);
        expect(fir.y).toBeGreaterThanOrEqual(ground);
        expect(fir.y - ground).toBeLessThan(fir.h * 0.04);
      }
    }
  });

  it("sizes firs by depth: far ones small, near ones large", () => {
    const firs = valley(spec).firs;
    const tallest = (ridge: (typeof RIDGES)[number]) =>
      Math.max(0, ...firs.filter((f) => f.ridge === ridge).map((f) => f.h));
    const shortest = (ridge: (typeof RIDGES)[number]) =>
      Math.min(...firs.filter((f) => f.ridge === ridge).map((f) => f.h));
    expect(tallest("far")).toBeLessThan(shortest("mid"));
    expect(tallest("mid")).toBeLessThan(shortest("near"));
  });

  it("shows far and middle firs above the ridge in front of them", () => {
    for (const fir of valley(spec).firs) {
      if (fir.ridge === "near") continue;
      const front = fir.ridge === "far" ? "mid" : "near";
      // At least half of the fir clears the ridge in front.
      expect(fir.y - fir.h / 2).toBeLessThan(ridgeAt(spec, front, fir.x));
    }
  });

  it("closes every ridge at the bottom of the frame", () => {
    const { ridges } = valley(spec);
    for (const r of RIDGES)
      expect(ridges[r].fill).toMatch(new RegExp(`L -?[\\d.]+ ${VALLEY_H} Z$`));
  });
});
