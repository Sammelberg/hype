import { describe, expect, it } from "vitest";

import { assertComposited, nonComposited, stepAt } from "./composited";

describe("nonComposited", () => {
  it("passes transforms, opacity and the transform origin", () => {
    expect(
      nonComposited({
        x: 10,
        yPercent: -5,
        scale: 1.2,
        rotation: 3,
        opacity: 0,
        transformOrigin: "left center",
      }),
    ).toEqual([]);
  });

  it("names what is laid out or painted on every frame", () => {
    expect(
      nonComposited({ clipPath: "inset(0)", filter: "blur(4px)", width: 100, opacity: 1 }),
    ).toEqual(["clipPath", "filter", "width"]);
  });

  it("refuses a callback that would run on every frame", () => {
    expect(nonComposited({ onUpdate: () => {} })).toEqual(["onUpdate"]);
  });
});

describe("assertComposited", () => {
  it("throws with the property's name", () => {
    expect(() => assertComposited({ color: "red" })).toThrow(/color/);
  });
});

describe("stepAt", () => {
  it("splits progress into equal steps and stays inside them", () => {
    expect(stepAt(0, 4)).toBe(0);
    expect(stepAt(0.249, 4)).toBe(0);
    expect(stepAt(0.25, 4)).toBe(1);
    expect(stepAt(1, 4)).toBe(3);
    expect(stepAt(-0.1, 4)).toBe(0);
  });
});
