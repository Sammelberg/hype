// Contour lines of one summit, like a hiking map: rings around a peak that never cross, each a
// little more irregular than the one inside it. Seeded by a page's path, so every content page
// draws its own mountain and server and client draw the same one.

import { r1, random } from "./curves";

export const CONTOUR_SIZE = 600;

/** A closed smooth curve through the points (Catmull-Rom as cubic Béziers, wrapping around). */
function closedSmooth(pts: readonly (readonly [number, number])[]) {
  const n = pts.length;
  const at = (i: number) => pts[(i + n) % n]!;
  let d = `M ${r1(at(0)[0])} ${r1(at(0)[1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d += ` C ${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return `${d} Z`;
}

function seedOf(key: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

export type Contours = {
  /** Innermost first. */
  rings: string[];
  /** The summit. */
  peak: { x: number; y: number };
  /** Radius of ring k at angle t, for tests. */
  radius: (k: number, t: number) => number;
};

export function contours(key: string, count = 9): Contours {
  const rnd = random(seedOf(key) ^ 0x2c1b3c6d);
  const peak = {
    x: r1(CONTOUR_SIZE * (0.4 + rnd() * 0.2)),
    y: r1(CONTOUR_SIZE * (0.4 + rnd() * 0.2)),
  };
  // The mountain's shape: a few waves around it. Inner rings carry less of it, outer ones more,
  // and every ring grows by at least half a step, so no two rings ever touch.
  const waves = Array.from({ length: 4 }, (_, j) => ({
    k: j + 1,
    a: (0.16 / (j + 1)) * (0.5 + rnd()),
    phase: rnd() * Math.PI * 2,
  }));
  const step = 30 + rnd() * 8;
  const shape = (t: number) => waves.reduce((s, w) => s + w.a * Math.sin(w.k * t + w.phase), 0);
  const radius = (k: number, t: number) => {
    const base = step * (k + 0.6);
    const share = Math.min(1, 0.35 + k / count);
    return base * (1 + shape(t) * share);
  };
  const POINTS = 40;
  const rings = Array.from({ length: count }, (_, k) =>
    closedSmooth(
      Array.from({ length: POINTS }, (_, i) => {
        const t = (i / POINTS) * Math.PI * 2;
        const r = radius(k, t);
        return [peak.x + r * Math.cos(t), peak.y + r * Math.sin(t)] as const;
      }),
    ),
  );
  return { rings, peak, radius };
}
