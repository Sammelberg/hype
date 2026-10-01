// The horizon under every page heading: one drawn ridge of soft Black Forest hills with a few of
// the hero's firs standing on it, and the copper arc over its highest crest. Seeded by the page's
// path, so each page keeps its own horizon and server and client draw the same one.

import { r1, random, sample, smooth } from "./curves";

export const HORIZON_W = 1600;
export const HORIZON_H = 180;

const BASE = 150;
const FOOT_SINK = 2;

function seedOf(key: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

type Hill = readonly [centre: number, width: number, height: number];

function hillsOf(key: string): readonly Hill[] {
  const rnd = random(seedOf(key));
  const count = 3 + Math.floor(rnd() * 2);
  // Spread the crests across the width, each nudged within its own stretch.
  return Array.from({ length: count }, (_, i) => {
    const stretch = HORIZON_W / count;
    return [stretch * (i + 0.2 + rnd() * 0.6), 240 + rnd() * 300, 36 + rnd() * 60] as const;
  });
}

/** The ridge's y at x (y grows downwards). */
export function ridgeY(key: string, x: number) {
  const lift = hillsOf(key).reduce(
    (sum, [c, w, h]) => sum + h * Math.exp(-0.5 * ((x - c) / (w / 2.5)) ** 2),
    0,
  );
  // Overlapping hills ease off before the upper third instead of being cut flat.
  const room = BASE - HORIZON_H / 3 - 6;
  return BASE - room * Math.tanh(lift / room);
}

export type Horizon = {
  /** The ridge line, left edge to right edge. */
  ridge: string;
  /** The land under it, closed along the bottom. */
  ground: string;
  /** Copper arc over the highest crest. */
  arc: string;
  /** y is the fir's foot. */
  firs: { x: number; y: number; h: number }[];
};

export function horizon(key: string): Horizon {
  const at = (x: number) => ridgeY(key, x);
  const ridge = smooth(sample(at, 0, HORIZON_W, 40));
  const ground = `${ridge} L ${HORIZON_W} ${HORIZON_H} L 0 ${HORIZON_H} Z`;

  // The highest crest (a real hilltop, not the edge of the range) within the part every screen
  // shows; without one, the highest point there.
  const range = sample(at, HORIZON_W * 0.2, HORIZON_W * 0.8, 10).map(([x]) => x);
  const tops = range.filter((x) => at(x - 10) >= at(x) && at(x) <= at(x + 10));
  const crest = (tops.length ? tops : range).reduce((best, x) => (at(x) < at(best) ? x : best));
  const arc = smooth(sample((x) => at(x) - 7, crest - 90, crest + 90, 18));

  // Three to five firs in the middle half, apart from each other and from the arc.
  const rnd = random(seedOf(key) ^ 0x9e3779b9);
  const firs: Horizon["firs"] = [];
  const count = 3 + Math.floor(rnd() * 3);
  for (let tries = 0; firs.length < count && tries < 80; tries++) {
    const x = Math.round(HORIZON_W * (0.25 + rnd() * 0.5));
    if (Math.abs(x - crest) < 110) continue;
    if (firs.some((f) => Math.abs(f.x - x) < 70)) continue;
    const y = r1(at(x) + FOOT_SINK);
    const h = Math.floor(Math.min(y, 88 + rnd() * 64));
    firs.push({ x, y, h });
  }
  return { ridge, ground, arc, firs: firs.sort((a, b) => a.x - b.x) };
}

export const SKY_W = 1600;
export const SKY_H = 640;

export type Star = { x: number; y: number; r: number; o: number; twinkle: boolean };

/**
 * A sparse sky over a page heading, seeded by the same key as its horizon: few, small stars,
 * fewer towards the ground, one in four of them twinkling.
 */
export function sky(key: string, count = 34): Star[] {
  const rnd = random(seedOf(key) ^ 0x51ed270b);
  return Array.from({ length: count }, (_, i) => {
    // Squared: most stars high up, thinning out towards the horizon.
    const y = r1(SKY_H * rnd() ** 1.6);
    return {
      x: r1(rnd() * SKY_W),
      y,
      r: r1(0.6 + rnd() * (rnd() < 0.12 ? 1.4 : 0.7)),
      o: Math.round((0.25 + rnd() * 0.55 * (1 - y / SKY_H / 2)) * 100) / 100,
      twinkle: i % 4 === 0,
    };
  });
}
