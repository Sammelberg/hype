// A Black Forest valley for the services cards, in the hero's language: three smooth ridges back
// to front (far, middle, near), each with a thin outline, and the hero's own drawn firs standing on
// them, small on the far ridge, larger in the middle, large in front. Every valley shares the same
// height bands, so the five cards read as one series; the near hills carry each service's shape.
// Deterministic per seed, so server and client draw the same valley.

import type { FirDesign } from "@/components/site/fir-shapes";
import { r1, random, sample, smooth } from "@/lib/curves";

export const VALLEY_W = 1200;
export const VALLEY_H = 800;

/** A rounded hill: centre x, width and height, in valley units. */
export type Hump = readonly [centre: number, width: number, height: number];

export type Ridge = "far" | "mid" | "near";

export type ValleySpec = {
  seed: number;
  /** Hills of the near ridge: the valley's own shape. */
  near: readonly Hump[];
  /** The copper arc: along the crest at x, or as a bridge between two x. */
  arc: { crest: number } | { bridge: readonly [number, number] };
  /** The large firs on the near ridge: x and height in valley units. */
  firs: readonly { design: FirDesign; x: number; h: number }[];
};

export type Valley = {
  stars: { x: number; y: number; r: number; o: number }[];
  ridges: Record<Ridge, { fill: string; edge: string }>;
  arc: string;
  /** y is the fir's foot. */
  firs: { ridge: Ridge; design: FirDesign; x: number; y: number; h: number }[];
};

const BASE: Record<Ridge, number> = { far: 560, mid: 655, near: 745 };
const WOBBLE: Record<Ridge, number> = { far: 6, mid: 5, near: 4 };
const DESIGNS: readonly FirDesign[] = ["dicht", "schlank", "konkav"];
/** Where firs may stand: the part of the valley every window shows. */
const SHOWN: readonly [number, number] = [270, 930];
const ARC_LIFT = 14;
const SINK = 0.02;

const between = (rnd: () => number, min: number, max: number) => min + rnd() * (max - min);

/** Smooth value noise in [-1, 1] with knots every `step` units. */
function noise(rnd: () => number, step: number) {
  const knots = Array.from({ length: Math.ceil(VALLEY_W / step) + 3 }, () => rnd() * 2 - 1);
  return (x: number) => {
    const i = Math.floor((x + step) / step);
    const t = (x + step) / step - i;
    const k = (1 - Math.cos(t * Math.PI)) / 2;
    return knots[i]! * (1 - k) + knots[i + 1]! * k;
  };
}

/** Each ridge draws from its own stream, so one ridge never shifts another. */
function humpsOf(spec: ValleySpec, ridge: Ridge): readonly Hump[] {
  if (ridge === "near") return spec.near;
  const rnd = random(spec.seed * 101 + (ridge === "far" ? 1 : 2));
  const [width, height]: [[number, number], [number, number]] =
    ridge === "far"
      ? [
          [380, 700],
          [40, 90],
        ]
      : [
          [360, 640],
          [35, 80],
        ];
  return Array.from({ length: 3 }, (): Hump => [
    between(rnd, -100, VALLEY_W + 100),
    between(rnd, ...width),
    between(rnd, ...height),
  ]);
}

/** The height of a ridge at x (y grows downwards). */
export function ridgeAt(spec: ValleySpec, ridge: Ridge, x: number) {
  const wobble = noise(random(spec.seed * 31 + ridge.length), 90);
  return (
    BASE[ridge] -
    humpsOf(spec, ridge).reduce(
      (sum, [c, w, h]) => sum + h * Math.exp(-0.5 * ((x - c) / (w / 2.5)) ** 2),
      0,
    ) +
    wobble(x) * WOBBLE[ridge]
  );
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
    const edge = smooth(sample((x) => ridgeAt(spec, ridge, x), 0, VALLEY_W, 40));
    return { edge, fill: `${edge} L ${VALLEY_W} ${VALLEY_H} L 0 ${VALLEY_H} Z` };
  };
  const near = (x: number) => ridgeAt(spec, "near", x);

  let arc: string;
  if ("bridge" in spec.arc) {
    const [a, b] = spec.arc.bridge;
    const ya = near(a) - ARC_LIFT;
    const yb = near(b) - ARC_LIFT;
    arc = `M ${a} ${r1(ya)} Q ${(a + b) / 2} ${r1(Math.min(ya, yb) - 60)} ${b} ${r1(yb)}`;
  } else {
    const c = spec.arc.crest;
    arc = smooth(sample((x) => near(x) - ARC_LIFT, c - 110, c + 110, 22));
  }

  return {
    stars: Array.from({ length: 18 }, () => ({
      x: Math.round(between(rnd, 0, VALLEY_W)),
      y: Math.round(between(rnd, 24, 330)),
      r: r1(between(rnd, 0.9, 1.8)),
      o: r1(between(rnd, 0.35, 0.85)),
    })),
    ridges: { far: line("far"), mid: line("mid"), near: line("near") },
    arc,
    firs: [
      ...groves(spec, rnd, "far", [36, 52], [20, 30]),
      ...groves(spec, rnd, "mid", [80, 112], [36, 54]),
      ...spec.firs.map((fir) => ({
        ridge: "near" as const,
        ...fir,
        y: r1(near(fir.x) + fir.h * SINK),
      })),
    ],
  };
}
