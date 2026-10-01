import { describe, expect, it } from "vitest";

import { CONTOUR_SIZE, contours } from "./contours";

const KEYS = ["/ueber-uns", "/ueber-uns/arbeitsweise", "/branchen", "/branchen/handwerk", "x"];

describe("contours", () => {
  it("draws the same mountain for the same page and another for another page", () => {
    expect(contours("/ueber-uns").rings).toEqual(contours("/ueber-uns").rings);
    expect(contours("/ueber-uns").rings[0]).not.toBe(contours("/branchen").rings[0]);
  });

  it("nests the rings: every ring lies outside the one inside it, all the way round", () => {
    for (const key of KEYS) {
      const { radius, rings } = contours(key);
      for (let k = 1; k < rings.length; k++) {
        for (let t = 0; t < Math.PI * 2; t += 0.05) {
          expect(radius(k, t)).toBeGreaterThan(radius(k - 1, t) + 5);
        }
      }
    }
  });

  it("keeps the summit inside the middle of the map", () => {
    for (const key of KEYS) {
      const { peak } = contours(key);
      expect(peak.x).toBeGreaterThan(CONTOUR_SIZE * 0.35);
      expect(peak.x).toBeLessThan(CONTOUR_SIZE * 0.65);
      expect(peak.y).toBeGreaterThan(CONTOUR_SIZE * 0.35);
      expect(peak.y).toBeLessThan(CONTOUR_SIZE * 0.65);
    }
  });
});
