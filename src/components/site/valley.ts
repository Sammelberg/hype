// A Black Forest valley for the services cards, in the hero's language: three ridges of straight
// lines and sharp peaks back to front (high far mountains, a middle range, the near skyline), each
// with a thin outline, and the three drawn firs of fir-shapes.ts standing on them, small on the far
// ridge, larger in the middle, large in front. Every valley shares the same height bands, so the
// five cards read as one series; the near skyline carries each service's shape.
// Deterministic per seed, so server and client draw the same valley.

import type { FirDesign } from "@/components/site/fir-shapes";
import { r1, random } from "@/lib/curves";

export const VALLEY_W = 1200;
export const VALLEY_H = 800;

/** A knee of a ridge: x and y in valley units (y grows downwards). */
export type Knee = readonly [x: number, y: number];

export type Ridge = "far" | "mid" | "near";

export type ValleySpec = {
  seed: number;
  /** The near skyline, left to right: the valley's own shape. */
  near: readonly Knee[];
  /** The large firs on the near ridge: x and height in valley units. */
  firs: readonly { design: FirDesign; x: number; h: number }[];
};

export type Valley = {
  stars: { x: number; y: number; r: number; o: number }[];
  ridges: Record<Ridge, { fill: string; edge: string }>;
  /** y is the fir's foot. */
  firs: { ridge: Ridge; design: FirDesign; x: number; y: number; h: number }[];
};

/**
 * Height bands of the generated ridges: where their peaks and their notches lie. The far one is
 * the high mountains, the middle one a lower range in front of them.
 */
const BANDS: Record<"far" | "mid", { peak: [number, number]; notch: [number, number] }> = {
  far: { peak: [190, 330], notch: [390, 470] },
  mid: { peak: [390, 480], notch: [530, 590] },
};
const DESIGNS: readonly FirDesign[] = ["dicht", "schlank", "konkav"];
/** Where firs may stand: the part of the valley every window shows. */
const SHOWN: readonly [number, number] = [270, 930];
const SINK = 0.02;
/** Ridges run a little past the frame, so the ends never show. */
const BLEED = 60;

const between = (rnd: () => number, min: number, max: number) => min + rnd() * (max - min);

/**
 * A generated ridge: a few main peaks of uneven height and spacing with notches between them,
 * every slope broken into short straight pieces that jut out a little, the way a mountain line is
 * rugged without ever being round. Each ridge draws from its own stream, so one ridge never shifts
 * another.
 */
function kneesOf(spec: ValleySpec, ridge: Ridge): readonly Knee[] {
  if (ridge === "near")
    return [[-BLEED, spec.near[0]![1]], ...spec.near, [VALLEY_W + BLEED, spec.near.at(-1)![1]]];
  const rnd = random(spec.seed * 101 + (ridge === "far" ? 1 : 2));
  const band = BANDS[ridge];
  const [gapMin, gapMax] = ridge === "far" ? [230, 380] : [170, 290];
  const jag = ridge === "far" ? 14 : 10;
  // Main knees: peak, notch, peak … from a notch left of the frame to beyond its right edge.
  const main: Knee[] = [[-BLEED, between(rnd, ...band.notch)]];
  for (let x = -BLEED, peak = true; x < VALLEY_W + BLEED; peak = !peak) {
    x += between(rnd, gapMin, gapMax) / 2;
    main.push([x, between(rnd, ...(peak ? band.peak : band.notch))]);
  }
  // Each slope in pieces of 25 to 60 units, every inner point pushed off the straight line.
  const knees: Knee[] = [main[0]!];
  for (let k = 1; k < main.length; k++) {
    const [x0, y0] = main[k - 1]!;
    const [x1, y1] = main[k]!;
    for (let x = x0 + between(rnd, 25, 60); x < x1 - 20; x += between(rnd, 25, 60)) {
      const y = y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
      knees.push([r1(x), r1(y + between(rnd, -jag, jag))]);
    }
    knees.push([r1(x1), r1(y1)]);
  }
  return knees;
}

/** The height of a ridge at x: straight lines between its knees. */
export function ridgeAt(spec: ValleySpec, ridge: Ridge, x: number) {
  const knees = kneesOf(spec, ridge);
  const i = knees.findIndex(([kx]) => kx >= x);
  if (i <= 0) return knees[Math.max(0, i)]![1];
  const [x0, y0] = knees[i - 1]!;
  const [x1, y1] = knees[i]!;
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

/**
 * Groups of firs on a ridge behind: each group a few trees side by side, kept only where at least
 * half of the tree clears the ridge in front of it.
 */
function groves(
  spec: ValleySpec,
  rnd: () => number,
  ridge: "far" | "mid",
  size: [number, number],
  spacing: [number, number],
) {
  const front = ridge === "far" ? "mid" : "near";
  const firs: Valley["firs"] = [];
  for (let g = 0; g < 2; g++) {
    const centre = between(rnd, SHOWN[0] + 60, SHOWN[1] - 60);
    const count = 2 + Math.floor(rnd() * 3);
    const gap = between(rnd, ...spacing);
    for (let k = 0; k < count; k++) {
      const x = Math.round(centre + (k - (count - 1) / 2) * gap + between(rnd, -6, 6));
      const h = Math.round(between(rnd, ...size));
      const design = DESIGNS[Math.floor(rnd() * DESIGNS.length)]!;
      const y = r1(ridgeAt(spec, ridge, x) + h * SINK);
      if (x < SHOWN[0] || x > SHOWN[1]) continue;
      if (y - h / 2 >= ridgeAt(spec, front, x)) continue;
      firs.push({ ridge, design, x, y, h });
    }
  }
  return firs;
}

export function valley(spec: ValleySpec): Valley {
  const rnd = random(spec.seed);
  const line = (ridge: Ridge) => {
    const knees = kneesOf(spec, ridge);
    const edge = knees.map(([x, y], i) => `${i ? "L" : "M"} ${r1(x)} ${r1(y)}`).join(" ");
    const [lastX] = knees.at(-1)!;
    const [firstX] = knees[0]!;
    return {
      edge,
      fill: `${edge} L ${r1(lastX)} ${VALLEY_H} L ${r1(firstX)} ${VALLEY_H} Z`,
    };
  };
  const near = (x: number) => ridgeAt(spec, "near", x);

  return {
    stars: Array.from({ length: 22 }, () => ({
      x: Math.round(between(rnd, 0, VALLEY_W)),
      y: Math.round(between(rnd, 20, 300)),
      r: r1(between(rnd, 0.9, 1.8)),
      o: r1(between(rnd, 0.35, 0.85)),
    })),
    ridges: { far: line("far"), mid: line("mid"), near: line("near") },
    firs: [
      ...groves(spec, rnd, "far", [30, 44], [18, 26]),
      ...groves(spec, rnd, "mid", [70, 100], [34, 50]),
      ...spec.firs.map((fir) => ({
        ridge: "near" as const,
        ...fir,
        y: r1(near(fir.x) + fir.h * SINK),
      })),
    ],
  };
}
