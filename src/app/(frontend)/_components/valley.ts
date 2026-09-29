// A Black Forest valley for the services cards, drawn from a small spec: rounded hills under a
// dense fir treeline (far and middle), mist in the hollows between them, a smooth front slope
// whose crest carries the hero's ice line and copper arc, and the hero's own drawn firs standing
// on that slope. Deterministic per seed, so server and client draw the same valley.

import type { FirDesign } from "./fir-shapes";

export const VALLEY_W = 1200;
export const VALLEY_H = 800;

/** A rounded hill: centre x, width and height, in valley units. */
export type Hump = readonly [centre: number, width: number, height: number];

export type ValleySpec = {
  seed: number;
  /** Hills of the front slope: the valley's own shape. */
  near: readonly Hump[];
  /** The copper arc: along the crest at x, or as a bridge between two x. */
  arc: { crest: number } | { bridge: readonly [number, number] };
  /** The hero's drawn firs on the front slope: x and height in valley units. */
  firs: readonly { design: FirDesign; x: number; h: number }[];
};

export type Valley = {
  stars: { x: number; y: number; r: number; o: number }[];
  far: string;
  mid: string;
  /** Mist bands in the hollows: top and height. */
  mist: { y: number; h: number }[];
  near: { fill: string; edge: string; arc: string };
  /** y is the fir's foot. */
  firs: { design: FirDesign; x: number; y: number; h: number }[];
};

const BASE = { far: 480, mid: 610, near: 760 };
const ARC_LIFT = 14;
const FOOT_SINK = 5;

function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

function hills(humps: readonly Hump[], base: number, wobble: (x: number) => number, amp: number) {
  return (x: number) =>
    base -
    humps.reduce((sum, [c, w, h]) => sum + h * Math.exp(-0.5 * ((x - c) / (w / 2.5)) ** 2), 0) +
    wobble(x) * amp;
}

function randomHumps(
  rnd: () => number,
  count: number,
  width: [number, number],
  height: [number, number],
) {
  return Array.from({ length: count }, (): Hump => [
    between(rnd, -100, VALLEY_W + 100),
    between(rnd, ...width),
    between(rnd, ...height),
  ]);
}

/** A hill under firs: one silhouette of two-tier fir tips following the ridge. */
function treeline(
  ridge: (x: number) => number,
  rnd: () => number,
  spacing: [number, number],
  height: [number, number],
) {
  const pts: string[] = [`M -20 ${VALLEY_H}`];
  for (let x = -20; x < VALLEY_W + 20; x += between(rnd, ...spacing)) {
    const h = between(rnd, ...height);
    const g = ridge(x) + 3;
    const w = h * 0.3;
    for (const [dx, dy] of [
      [-w, 0],
      [-w * 0.4, 0.5],
      [-w * 0.62, 0.5],
      [0, 1],
      [w * 0.62, 0.5],
      [w * 0.4, 0.5],
      [w, 0],
    ] as const) {
      pts.push(`L ${Math.round(x + dx)} ${Math.round(g - h * dy)}`);
    }
  }
  pts.push(`L ${VALLEY_W + 20} ${VALLEY_H} Z`);
  return pts.join(" ");
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** A smooth curve through the points (Catmull-Rom as cubic Béziers). */
function smooth(pts: readonly (readonly [number, number])[]) {
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

const sample = (f: (x: number) => number, from: number, to: number, step: number) => {
  const pts: [number, number][] = [];
  for (let x = from; x < to; x += step) pts.push([x, f(x)]);
  pts.push([to, f(to)]);
  return pts;
};

/** The front slope, the one the firs stand on. */
export function slopeAt(spec: ValleySpec, x: number) {
  return hills(spec.near, BASE.near, noise(random(spec.seed * 31 + 7), 90), 5)(x);
}

export function valley(spec: ValleySpec): Valley {
  const rnd = random(spec.seed);
  const far = hills(randomHumps(rnd, 4, [320, 620], [60, 130]), BASE.far, noise(rnd, 70), 8);
  const mid = hills(randomHumps(rnd, 3, [360, 700], [70, 150]), BASE.mid, noise(rnd, 80), 7);
  const near = (x: number) => slopeAt(spec, x);

  const edgePts = sample(near, 0, VALLEY_W, 40);
  const edge = smooth(edgePts);

  let arc: string;
  if ("bridge" in spec.arc) {
    const [a, b] = spec.arc.bridge;
    const ya = near(a) - ARC_LIFT;
    const yb = near(b) - ARC_LIFT;
    arc = `M ${a} ${r1(ya)} Q ${(a + b) / 2} ${r1(Math.min(ya, yb) - 70)} ${b} ${r1(yb)}`;
  } else {
    const c = spec.arc.crest;
    arc = smooth(sample((x) => near(x) - ARC_LIFT, c - 110, c + 110, 22));
  }

  return {
    stars: Array.from({ length: 18 }, () => ({
      x: Math.round(between(rnd, 0, VALLEY_W)),
      y: Math.round(between(rnd, 24, 320)),
      r: r1(between(rnd, 0.9, 1.8)),
      o: r1(between(rnd, 0.35, 0.85)),
    })),
    far: treeline(far, rnd, [11, 17], [16, 26]),
    mid: treeline(mid, rnd, [17, 27], [28, 46]),
    mist: [
      { y: BASE.far - 70, h: 150 },
      { y: BASE.mid - 60, h: 140 },
    ],
    near: { fill: `${edge} L ${VALLEY_W} ${VALLEY_H} L 0 ${VALLEY_H} Z`, edge, arc },
    firs: spec.firs.map((fir) => ({ ...fir, y: r1(near(fir.x) + FOOT_SINK) })),
  };
}
