// Small drawing helpers shared by the hand-drawn landscapes (services valleys, page horizons).

/** Seeded pseudo-random numbers in [0, 1) (mulberry32): the same seed draws the same landscape. */
export function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rounded to one decimal, which keeps SVG paths short. */
export const r1 = (n: number) => Math.round(n * 10) / 10;

/** A smooth curve through the points (Catmull-Rom as cubic Béziers). */
export function smooth(pts: readonly (readonly [number, number])[]) {
  let d = `M ${r1(pts[0]![0])} ${r1(pts[0]![1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    d += ` C ${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d;
}

/** Points of f from `from` to `to` every `step` units, the end included. */
export const sample = (f: (x: number) => number, from: number, to: number, step: number) => {
  const pts: [number, number][] = [];
  for (let x = from; x < to; x += step) pts.push([x, f(x)]);
  pts.push([to, f(to)]);
  return pts;
};
