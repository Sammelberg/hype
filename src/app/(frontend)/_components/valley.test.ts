import { describe, expect, it } from "vitest";

import { slopeAt, valley, VALLEY_H, VALLEY_W, type ValleySpec } from "./valley";

const spec: ValleySpec = {
  seed: 7,
  near: [
    [330, 380, 170],
    [900, 380, 170],
  ],
  arc: { bridge: [330, 900] },
  firs: [
    { design: "konkav", x: 250, h: 280 },
    { design: "schlank", x: 980, h: 300 },
  ],
};

describe("valley", () => {
  it("draws the same valley for the same spec", () => {
    expect(valley(spec)).toEqual(valley(spec));
  });

  it("draws other far hills for another seed", () => {
    expect(valley({ ...spec, seed: 8 }).far).not.toBe(valley(spec).far);
  });

  it("keeps the front slope inside the frame, in its lower half", () => {
    for (let x = 0; x <= VALLEY_W; x += 10) {
      const y = slopeAt(spec, x);
      expect(y).toBeGreaterThan(VALLEY_H / 2);
      expect(y).toBeLessThan(VALLEY_H);
    }
  });

  it("stands every fir on the slope, its foot a little into the ground", () => {
    for (const fir of valley(spec).firs) {
      const ground = slopeAt(spec, fir.x);
      expect(fir.y).toBeGreaterThan(ground);
      expect(fir.y - ground).toBeLessThan(10);
    }
  });

  it("lets a bridge arc rise above both hills it joins", () => {
    const arc = valley(spec).near.arc;
    const [, sx, sy, , cy] = arc.match(/^M ([\d.]+) ([\d.]+) Q ([\d.]+) ([\d.]+)/)!.map(Number);
    expect(sx).toBe(330);
    expect(sy).toBeLessThan(slopeAt(spec, 330));
    expect(cy).toBeLessThan(sy!);
  });

  it("closes every hill silhouette at the bottom of the frame", () => {
    const v = valley(spec);
    for (const path of [v.far, v.mid, v.near.fill]) {
      expect(path).toMatch(new RegExp(`L -?\\d+ ${VALLEY_H} Z$`));
    }
  });
});
