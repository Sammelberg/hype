// A constellation for a project, seeded by its path: a handful of stars joined by lines, the way
// a star chart draws a figure. Every project keeps its own figure; server and client draw the same.

import { r1, random } from "./curves";

export const SKY_CHART_W = 600;
export const SKY_CHART_H = 360;

function seedOf(key: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

export type Constellation = {
  stars: { x: number; y: number; r: number }[];
  /** Pairs of star indices, in drawing order. */
  links: [number, number][];
  /** Faint background stars. */
  dust: { x: number; y: number; r: number; o: number }[];
};

export function constellation(key: string): Constellation {
  const rnd = random(seedOf(key) ^ 0x7f4a7c15);
  const count = 6 + Math.floor(rnd() * 3);
  const pad = 40;
  // Stars spread from left to right, each in its own stretch, so the figure reads as one line
  // with a branch rather than a knot.
  const stretch = (SKY_CHART_W - 2 * pad) / count;
  const stars = Array.from({ length: count }, (_, i) => ({
    x: r1(pad + stretch * (i + 0.15 + rnd() * 0.7)),
    y: r1(pad + rnd() * (SKY_CHART_H - 2 * pad)),
    r: r1(2.4 + rnd() * 2.6),
  }));
  const links: [number, number][] = [];
  for (let i = 1; i < count; i++) links.push([i - 1, i]);
  // One branch from a middle star to the star after next, closing a small figure.
  const from = 1 + Math.floor(rnd() * (count - 3));
  links.push([from, from + 2]);
  const dust = Array.from({ length: 40 }, () => ({
    x: r1(rnd() * SKY_CHART_W),
    y: r1(rnd() * SKY_CHART_H),
    r: r1(0.5 + rnd() * 0.9),
    o: Math.round((0.15 + rnd() * 0.4) * 100) / 100,
  }));
  return { stars, links, dust };
}
