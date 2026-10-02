import { describe, expect, it } from "vitest";

import { forestEdge, PAPER_H, PAPER_W, paperRidges } from "./paper-ridges";

const KEYS = ["/leistungen", "/ueber-uns", "/kontakt", "fuss", "x"];

describe("paperRidges", () => {
  it("draws the same ridges for the same key and others for another", () => {
    expect(paperRidges("/leistungen")).toEqual(paperRidges("/leistungen"));
    expect(paperRidges("/leistungen")[3]!.firs).not.toEqual(paperRidges("/kontakt")[3]!.firs);
  });

  it("lays four layers far to near, the near firs taller", () => {
    for (const key of KEYS) {
      const layers = paperRidges(key);
      expect(layers.map((l) => l.depth)).toEqual([0, 1, 2, 3]);
      const mean = (i: number) =>
        layers[i]!.firs.reduce((s, f) => s + f.h, 0) / Math.max(1, layers[i]!.firs.length);
      expect(mean(3)).toBeGreaterThan(mean(0));
    }
  });

  it("keeps every fir inside the picture and closes every ground along the bottom", () => {
    for (const key of KEYS) {
      for (const l of paperRidges(key)) {
        expect(l.ground.endsWith(`L${PAPER_W + 20} ${PAPER_H + 2} Z`)).toBe(true);
        for (const f of l.firs) {
          expect(f.y - f.h).toBeGreaterThanOrEqual(0);
          expect(f.y).toBeLessThanOrEqual(PAPER_H + 3);
        }
      }
    }
  });

  it("cuts each layer as one path: its ground and one closed outline per fir", () => {
    for (const l of paperRidges("/leistungen")) {
      expect(l.cut.startsWith(l.ground)).toBe(true);
      expect(l.cut.match(/Z/g)!.length).toBe(l.firs.length + 1);
    }
  });

  it("stays light: under three hundred firs for all four layers", () => {
    for (const key of KEYS) {
      expect(paperRidges(key).reduce((n, l) => n + l.firs.length, 0)).toBeLessThan(300);
    }
  });
});

describe("forestEdge", () => {
  it("stands three to five tall firs at one edge, inside the picture, none on the low ridge there", () => {
    const sides = new Set<string>();
    for (const key of [...KEYS, "a", "b", "c", "d"]) {
      const { tall, ridge, side } = forestEdge(key);
      sides.add(side);
      expect(tall.length).toBeGreaterThanOrEqual(3);
      expect(tall.length).toBeLessThanOrEqual(5);
      for (const f of tall) {
        expect(f.y - f.h).toBeGreaterThanOrEqual(0);
        expect(side === "right" ? f.x > PAPER_W / 2 : f.x < PAPER_W / 2).toBe(true);
      }
      const reach = tall.length * 130;
      for (const f of ridge.firs) {
        expect(side === "right" ? f.x <= PAPER_W - reach : f.x >= reach).toBe(true);
      }
    }
    expect(sides.size).toBe(2);
  });
});
