import { describe, expect, it } from "vitest";

import { constellation, SKY_CHART_H, SKY_CHART_W } from "./constellation";

const KEYS = ["/projekte/meistrum-krone-parkett", "/projekte/a", "/projekte/b", "x"];

describe("constellation", () => {
  it("is the same for the same project and another for another", () => {
    expect(constellation("/projekte/a")).toEqual(constellation("/projekte/a"));
    expect(constellation("/projekte/a").stars).not.toEqual(constellation("/projekte/b").stars);
  });

  it("keeps every star on the chart and joins every star", () => {
    for (const key of KEYS) {
      const { stars, links } = constellation(key);
      expect(stars.length).toBeGreaterThanOrEqual(6);
      for (const s of stars) {
        expect(s.x).toBeGreaterThan(0);
        expect(s.x).toBeLessThan(SKY_CHART_W);
        expect(s.y).toBeGreaterThan(0);
        expect(s.y).toBeLessThan(SKY_CHART_H);
      }
      const joined = new Set(links.flat());
      expect(joined.size).toBe(stars.length);
      for (const [a, b] of links) {
        expect(a).not.toBe(b);
        expect(stars[a]).toBeDefined();
        expect(stars[b]).toBeDefined();
      }
    }
  });
});
