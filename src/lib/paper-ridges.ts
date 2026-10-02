// The Black Forest as a paper cut, from our three firs (the owner's picks of 2026-10-02:
// "Kulissen" and "Waldrand"): ridges of broad domes whose skyline is our firs standing shoulder to
// shoulder, now and then a clearing, laid behind one another from far to near — and the forest's
// edge, a few of our firs tall at one side on a low ridge. Pure, seeded by a key, so server and
// tests draw the same picture; the components (landscape.tsx) colour and move it.

import { FIR_DESIGNS } from "@/components/site/fir-shapes";

import { random, r1 } from "./curves";
import { silhouetteOf } from "./fir-hull";

export const PAPER_W = 1600;
export const PAPER_H = 260;

export type PaperFirDesign = "dicht" | "schlank" | "konkav";
export type PaperFir = { design: PaperFirDesign; x: number; y: number; h: number };
export type PaperLayer = {
  /** The ground, closed along the bottom of the picture. */
  ground: string;
  /** Ground and every fir's stepped outline as one path: the layer as a single paper cut. */
  cut: string;
  firs: PaperFir[];
  /** 0 is the farthest layer. */
  depth: number;
};

const DESIGNS: readonly PaperFirDesign[] = ["dicht", "schlank", "konkav"];

function seedOf(key: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

function layer(
  rnd: () => number,
  depth: number,
  { base, domes, tree, gap }: { base: number; domes: number; tree: number; gap: number },
  free: [number, number][] = [],
): PaperLayer {
  const ds = Array.from({ length: domes }, (_, i) => ({
    x: ((i + 0.25 + rnd() * 0.5) / domes) * PAPER_W,
    h: 22 + rnd() * 46,
    b: 150 + rnd() * 190,
  }));
  const at = (x: number) =>
    base - ds.reduce((s, d) => s + d.h * Math.exp(-(((x - d.x) / d.b) ** 2)), 0);
  const pts: string[] = [];
  for (let x = -20; x <= PAPER_W + 20; x += 20) pts.push(`${x} ${r1(at(x))}`);
  const ground = `M-20 ${PAPER_H + 2} L${pts.join(" L")} L${PAPER_W + 20} ${PAPER_H + 2} Z`;
  const firs: PaperFir[] = [];
  let clearing = 0;
  for (let x = -8; x < PAPER_W + 8;) {
    // Never above the picture: a fir that would reach out of it is drawn smaller.
    const h = Math.min(tree * (0.7 + rnd() * 0.55), at(x) - 3);
    if (clearing > 0) clearing -= 1;
    else if (rnd() < 0.045) clearing = 3 + Math.floor(rnd() * 5);
    else if (!free.some(([a, b]) => x > a && x < b)) {
      firs.push({ design: DESIGNS[Math.floor(rnd() * 3)]!, x: r1(x), y: r1(at(x) + 3), h: r1(h) });
    }
    x += h * gap * (0.85 + rnd() * 0.3);
  }
  return { ground, cut: ground + firs.map(outline).join(""), firs, depth };
}

// Each design's stepped outline, scaled to a height of 1 from its own viewBox.
const OUTLINES = Object.fromEntries(
  Object.entries(FIR_DESIGNS).map(([name, fir]) => {
    const [vx, vy, vw, vh] = fir.viewBox.split(" ").map(Number) as [number, number, number, number];
    const pts = silhouetteOf(fir.d).map(([x, y]) => [(x - vx) / vh, (y - vy) / vh] as const);
    return [name, { pts, w: vw / vh }];
  }),
) as Record<PaperFirDesign, { pts: (readonly [number, number])[]; w: number }>;

/** A fir's outline as a closed path at its place and height. */
export function outline(fir: PaperFir): string {
  const o = OUTLINES[fir.design];
  const left = fir.x - (o.w * fir.h) / 2;
  const top = fir.y - fir.h;
  return (
    o.pts
      .map(([x, y], i) => `${i ? "L" : "M"}${r1(left + x * fir.h)} ${r1(top + y * fir.h)}`)
      .join(" ") + "Z"
  );
}

/** „Kulissen“: four paper ridges behind one another, far (thin, high) to near (tall firs). */
export function paperRidges(key: string, { layers = 4 }: { layers?: number } = {}): PaperLayer[] {
  const rnd = random(seedOf(key));
  const specs = [
    { base: 118, domes: 5, tree: 15, gap: 1.1 },
    { base: 158, domes: 4, tree: 21, gap: 0.9 },
    { base: 203, domes: 4, tree: 29, gap: 0.66 },
    { base: 250, domes: 3, tree: 41, gap: 0.56 },
  ].slice(4 - layers);
  return specs.map((spec, i) => layer(rnd, i, spec));
}

export type ForestEdge = {
  /** A low ridge along the foot of the picture. */
  ridge: PaperLayer;
  /** The tall firs at the edge, nearest last. */
  tall: PaperFir[];
  side: "left" | "right";
};

/** „Waldrand“: a few of our firs tall at one side, close, a low forested ridge beside them. */
export function forestEdge(key: string): ForestEdge {
  const rnd = random(seedOf(key) ^ 0x5bd1e995);
  const side = rnd() < 0.5 ? "left" : "right";
  const edge = side === "right" ? PAPER_W : 0;
  const inward = side === "right" ? -1 : 1;
  const count = 3 + Math.floor(rnd() * 3);
  const tall: PaperFir[] = Array.from({ length: count }, (_, i) => {
    const h = r1(PAPER_H * (0.55 + rnd() * 0.42));
    return {
      design: DESIGNS[Math.floor(rnd() * 3)]!,
      x: r1(edge + inward * (40 + i * (70 + rnd() * 50))),
      y: PAPER_H,
      h: Math.min(h, PAPER_H - 2),
    };
  }).sort((a, b) => a.h - b.h);
  const reach: [number, number] =
    side === "right" ? [PAPER_W - count * 130, PAPER_W + 20] : [-20, count * 130];
  const ridge = layer(rnd, 0, { base: 236, domes: 3, tree: 26, gap: 0.5 }, [reach]);
  return { ridge, tall, side };
}
