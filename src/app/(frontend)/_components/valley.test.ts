import { describe, expect, it } from "vitest";

import { ridgeAt, valley, VALLEY_H, VALLEY_W, type ValleySpec } from "./valley";

const spec: ValleySpec = {
  seed: 7,
  near: [
    [330, 380, 80],
    [900, 380, 80],
  ],
  arc: { bridge: [330, 900] },
  firs: [
    { design: "konkav", x: 250, h: 260 },
    { design: "schlank", x: 950, h: 280 },
  ],
};

const RIDGES = ["far", "mid", "near"] as const;

describe("valley", () => {
  it("draws the same valley for the same spec", () => {
    expect(valley(spec)).toEqual(valley(spec));
  });

  it("draws other far hills for another seed", () => {
    expect(valley({ ...spec, seed: 8 }).ridges.far.fill).not.toBe(valley(spec).ridges.far.fill);
  });

  it("stacks the three ridges back to front in the lower half, in every valley", () => {
    for (const seed of [1, 7, 23, 41, 99]) {
      const s = { ...spec, seed };
      const mean = { far: 0, mid: 0, near: 0 };
      for (let x = 0; x <= VALLEY_W; x += 20) {
        for (const r of RIDGES) {
          const y = ridgeAt(s, r, x);
          expect(y).toBeGreaterThan(VALLEY_H * 0.45);
          expect(y).toBeLessThan(VALLEY_H);
          mean[r] += y;
        }
      }
      expect(mean.far).toBeLessThan(mean.mid);
      expect(mean.mid).toBeLessThan(mean.near);
    }
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

  it("lets a bridge arc rise above both hills it joins", () => {
    const arc = valley(spec).arc;
    const [, sx, sy, , cy] = arc.match(/^M ([\d.]+) ([\d.]+) Q ([\d.]+) ([\d.]+)/)!.map(Number);
    expect(sx).toBe(330);
    expect(sy).toBeLessThan(ridgeAt(spec, "near", 330));
    expect(cy).toBeLessThan(sy!);
  });

  it("closes every ridge at the bottom of the frame", () => {
    const { ridges } = valley(spec);
    for (const r of RIDGES) expect(ridges[r].fill).toMatch(new RegExp(`L 0 ${VALLEY_H} Z$`));
  });
});
