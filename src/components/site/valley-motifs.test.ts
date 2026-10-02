import { describe, expect, it } from "vitest";

import { moonPath, valley, type ValleySpec } from "./valley";
import { VALLEYS } from "./valleys";

const numbers = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe("moon", () => {
  it("draws a full moon as the whole disc and a half moon to its centre line", () => {
    const moon = { x: 100, y: 100, r: 20, side: "right" } as const;
    expect(moonPath({ ...moon, lit: 1 })).toContain("A 20 20");
    // At half the terminator is a straight line: an ellipse of no width.
    expect(moonPath({ ...moon, lit: 0.5 })).toContain("A 0 20");
  });

  it("lights a crescent from the side it is asked for", () => {
    const moon = { x: 100, y: 100, r: 20, lit: 0.2 } as const;
    expect(moonPath({ ...moon, side: "right" })).not.toBe(moonPath({ ...moon, side: "left" }));
  });
});

describe("landmarks", () => {
  it("gives every service's valley its own landmark", () => {
    const names = Object.values(VALLEYS).map((spec) => spec.motif.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("draws every landmark inside the valley", () => {
    for (const spec of Object.values(VALLEYS)) {
      const m = valley(spec).motif;
      const pieces = [...m.mid, ...m.near].map((p) => p.d);
      if (m.lake) pieces.push(m.lake.shape);
      expect(pieces.length, spec.motif.name).toBeGreaterThan(0);
      for (const d of pieces) for (const n of numbers(d)) expect(Number.isFinite(n)).toBe(true);
    }
  });

  it("lays the lake's waterline at the foot of the near hills", () => {
    const m = valley(VALLEYS.web).motif;
    expect(m.lake?.axis).toBe(640);
    expect(m.lake?.glitter.length).toBeGreaterThan(0);
  });

  it("spans the viaduct from slope to slope across the saddle", () => {
    const spec: ValleySpec = VALLEYS.integration;
    const deck = spec.motif.name === "viadukt" ? spec.motif.deck : 0;
    // The body opens with the deck: M x y h width …
    const [x, y, width] = numbers(valley(spec).motif.near.find((p) => p.kind === "body")!.d);
    expect(y).toBe(deck);
    // It reaches both slopes of the two peaks (at x 340 and 880 in the spec).
    expect(x!).toBeGreaterThan(340);
    expect(x!).toBeLessThan(420);
    expect(x! + width!).toBeGreaterThan(800);
    expect(x! + width!).toBeLessThan(880);
  });
});
