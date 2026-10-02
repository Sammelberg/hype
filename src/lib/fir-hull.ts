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
