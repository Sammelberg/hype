// The outline of a drawn fir: the convex hull of all its brush strokes (fir-shapes.ts paths use
// only absolute M, L and Z). Filled in the ground colour behind the drawing, it hides whatever
// lies behind the fir — a farther ridge's line never runs through it (pen-horizon.tsx).

import { r1 } from "./curves";

type Pt = readonly [number, number];

const cross = (o: Pt, a: Pt, b: Pt) =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** The hull of a path of absolute M/L/Z commands, as a closed path. */
export function hullOf(d: string): string {
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const pts: Pt[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i]!, nums[i + 1]!]);
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  // Andrew's monotone chain.
  const lower: Pt[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower.at(-2)!, lower.at(-1)!, p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (const p of [...pts].reverse()) {
    while (upper.length >= 2 && cross(upper.at(-2)!, upper.at(-1)!, p) <= 0) upper.pop();
    upper.push(p);
  }
  const hull = [...lower.slice(0, -1), ...upper.slice(0, -1)];
  return hull.map(([x, y], i) => `${i ? "L" : "M"}${r1(x)} ${r1(y)}`).join(" ") + " Z";
}

/**
 * The stepped outline of a drawn fir, row by row: for each of `rows` horizontal bands the
 * outermost stroke on either side, down the right and back up the left — so a paper cut keeps the
 * tiers of the drawing, which the convex hull smooths away. Points in the drawing's own units.
 */
export function silhouetteOf(d: string, rows = 26): [number, number][] {
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const pts: Pt[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i]!, nums[i + 1]!]);
  const ys = pts.map((p) => p[1]);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const step = (bottom - top) / rows;
  const right: [number, number][] = [];
  const left: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    const y0 = top + r * step;
    const y1 = y0 + step;
    const band = pts.filter(([, y]) => y >= y0 && y <= y1);
    if (band.length === 0) continue;
    const xs = band.map(([x]) => x);
    right.push([r1(Math.max(...xs)), r1(y0)], [r1(Math.max(...xs)), r1(y1)]);
    left.push([r1(Math.min(...xs)), r1(y0)], [r1(Math.min(...xs)), r1(y1)]);
  }
  return [...right, ...left.reverse()];
}
