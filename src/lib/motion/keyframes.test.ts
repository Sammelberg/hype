import { describe, expect, it } from "vitest";

import { buildKeyframes, interpolate, type Segment } from "./keyframes";

const linear = (p: number) => p;
const seg = (s: Partial<Segment> & Pick<Segment, "channel" | "to">): Segment => ({
  t0: 0,
  t1: 1,
  ease: linear,
  linear: true,
  ...s,
});

describe("interpolate", () => {
  it("blends numbers and same-shaped strings", () => {
    expect(interpolate(0, 10, 0.25)).toBe(2.5);
    expect(interpolate("-40%", "0%", 0.25)).toBe("-30%");
  });

  it("switches halfway between strings of different shape", () => {
    expect(interpolate("none", "blur(4px)", 0.4)).toBe("none");
    expect(interpolate("none", "blur(4px)", 0.6)).toBe("blur(4px)");
  });
});

describe("buildKeyframes", () => {
  it("maps the scene onto its part of the page's scroll range", () => {
    const frames = buildKeyframes([seg({ channel: "opacity", from: 1, to: 0 })], 1, {
      start: 250,
      end: 750,
      max: 1000,
    });
    expect(frames).toEqual([
      { opacity: 1, offset: 0 },
      { opacity: 1, offset: 0.25 },
      { opacity: 0, offset: 0.75 },
      { opacity: 0, offset: 1 },
    ]);
  });

  it("composes translate, rotate and scale", () => {
    const [first] = buildKeyframes(
      [
        seg({ channel: "xPercent", from: -8, to: 8 }),
        seg({ channel: "y", from: 96, to: 0 }),
        seg({ channel: "scale", from: 0.5, to: 1 }),
        seg({ channel: "rotateX", from: 24, to: 0 }),
      ],
      1,
      { start: 0, end: 100, max: 100 },
    );
    expect(first).toMatchObject({
      translate: "-8% 96px",
      scale: "0.5 0.5",
      rotate: "x 24deg",
    });
  });

  it("samples eased segments and keeps linear ones to their ends", () => {
    const eased = buildKeyframes(
      [seg({ channel: "x", from: 0, to: 100, ease: (p) => p * p, linear: false })],
      1,
      { start: 0, end: 100, max: 100 },
    );
    expect(eased.length).toBeGreaterThan(10);
    expect(eased.find((f) => f.offset === 0.5)?.translate).toBe("25px 0px");
  });

  it("chains a to() from where the channel was and holds between segments", () => {
    const frames = buildKeyframes(
      [
        seg({ channel: "scale", t0: 0, t1: 1, from: 1, to: 0.9 }),
        seg({ channel: "scale", t0: 2, t1: 3, to: 0.8 }),
      ],
      4,
      { start: 0, end: 400, max: 400 },
    );
    expect(frames.map((f) => [f.offset, f.scale])).toEqual([
      [0, "1 1"],
      [0.25, "0.9 0.9"],
      [0.5, "0.9 0.9"],
      [0.75, "0.8 0.8"],
      [1, "0.8 0.8"],
    ]);
  });

  it("jumps at a set with two keyframes at the same offset", () => {
    const frames = buildKeyframes(
      [
        seg({ channel: "opacity", t0: 0, t1: 0, to: 0.4 }),
        seg({ channel: "opacity", t0: 1, t1: 1, to: 1 }),
      ],
      2,
      { start: 0, end: 200, max: 200 },
    );
    expect(frames.filter((f) => f.offset === 0.5).map((f) => f.opacity)).toEqual([0.4, 1]);
  });

  it("clips the scene where the page cannot scroll that far", () => {
    const frames = buildKeyframes([seg({ channel: "x", from: 0, to: 100 })], 1, {
      start: 50,
      end: 150,
      max: 100,
    });
    expect(frames.at(-1)).toEqual({ translate: "50px 0px", offset: 1 });
  });
});
