// The Black Forest drawn as with a pen (the owner's call, 2026-10-02): thin light lines, ridge
// behind ridge, and on every ridge our three firs (`fir-shapes.ts`) standing in groups, sized by
// their distance, with meadows between. Each page has a scene of its own — a broad ridge, a
// summit, a valley, layered ranges or a clearing, now and then one small pen motif (a path with
// waymarks, a farmhouse, a lookout tower, a road) — so no two pages open alike, and every line
// stays clean: no fill colour, no copper, no waves. Each ridge is closed in the ground colour so
// the nearer hides the farther, and nothing reaches out of the picture.

import { random, r1 } from "./curves";

export const PEN_W = 1600;
export const PEN_H = 220;

export type PenFirDesign = "dicht" | "schlank" | "konkav";
export type PenProfile = "kamm" | "gipfel" | "tal" | "stufen" | "lichtung";
export type PenMotif = "weg" | "huette" | "turm" | "strasse";
/** How a page's landscape is drawn: pen lines, paper ridges (landscape.tsx) or the forest's edge. */
export type PenStyle = "feder" | "kulissen" | "waldrand";
export type PenScene = { profile: PenProfile; motif?: PenMotif; stil?: PenStyle };

export type PenFir = {
  design: PenFirDesign;
  /** Centre of the fir's foot. */
  x: number;
  /** Its foot, on the ridge line. */
  y: number;
  /** Its height; the width follows the design's own proportions. */
  h: number;
};

export type PenRidge = {
  /** The land's contour, left edge to right edge. */
  line: string;
  /** The contour closed along the bottom, for hiding what lies behind it. */
  fill: string;
  /** The firs standing on this ridge, left to right. */
  firs: PenFir[];
  /** A motif standing on this ridge: its lines, and its outline to hide what lies behind. */
  motif?: { strokes: string; outline?: string };
  /** 0 is the farthest ridge, the last one the nearest. */
  depth: number;
};

// Each page's own scene and the style it is drawn in (pen, paper ridges, the forest's edge — the
// owner's picks of 2026-10-02, spread so neighbouring pages differ); any other key (a card's
// title, a page without an entry) gets a profile of its own from its seed, in pen, without a motif.
export const PAGE_SCENES: Readonly<Record<string, PenScene>> = {
  "/leistungen": { profile: "kamm", stil: "kulissen" },
  "/projekte": { profile: "kamm", stil: "waldrand" },
  "/e-rechnung": { profile: "stufen", stil: "feder" },
  "/online-shops": { profile: "tal", motif: "strasse", stil: "kulissen" },
  "/branchen": { profile: "lichtung", stil: "waldrand" },
  "/branchen/handwerk": { profile: "lichtung", motif: "huette", stil: "feder" },
  "/ueber-uns": { profile: "gipfel", motif: "turm", stil: "kulissen" },
  "/ueber-uns/arbeitsweise": { profile: "gipfel", motif: "weg", stil: "feder" },
  "/ueber-uns/datensouveraenitaet": { profile: "tal", stil: "waldrand" },
  "/ueber-uns/technologie": { profile: "stufen", motif: "turm", stil: "kulissen" },
  "/kontakt": { profile: "tal", motif: "huette", stil: "waldrand" },
  "/leistungen/web-anwendungen": { profile: "kamm", stil: "feder" },
  "/leistungen/geschaeftssysteme": { profile: "stufen", stil: "kulissen" },
  "/leistungen/schnittstellen": { profile: "tal", stil: "waldrand" },
  "/leistungen/modernisierung": { profile: "gipfel", stil: "feder" },
  "/leistungen/betrieb": { profile: "lichtung", stil: "kulissen" },
};

const PROFILES: readonly PenProfile[] = ["kamm", "gipfel", "tal", "stufen", "lichtung"];
const DESIGNS: readonly PenFirDesign[] = ["dicht", "schlank", "konkav"];

function seedOf(key: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/** A key's scene: its page's own, or a profile from its seed. */
export function sceneFor(key: string): PenScene {
  return PAGE_SCENES[key] ?? { profile: PROFILES[seedOf(key) % PROFILES.length]! };
}

const between = (rnd: () => number, [lo, hi]: readonly [number, number]) => lo + rnd() * (hi - lo);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A few broad, flat-topped Black Forest crests with steeper flanks: lift 0…1 at x. */
function crests(rnd: () => number, w: number) {
  const ks = Array.from({ length: 2 + Math.floor(rnd() * 3) }, () => ({
    c: rnd() * w,
    width: w * (0.14 + rnd() * 0.2),
    height: 0.45 + rnd() * 0.55,
    sharp: 1.8 + rnd() * 1.4,
  }));
  return (x: number) =>
    Math.tanh(
      1.2 *
        ks.reduce(
          (s, k) => s + k.height * Math.exp(-(Math.abs((x - k.c) / k.width) ** k.sharp)),
          0,
        ),
    );
}

/** The ground of ridge `i` of `n` (0 the farthest) for a profile, as y at x. */
function groundOf(
  profile: PenProfile,
  i: number,
  n: number,
  rnd: () => number,
  w: number,
  h: number,
  centre: number,
) {
  const t = n > 1 ? i / (n - 1) : 1;
  const base = h * lerp(0.5, 0.97, t);
  const roll = crests(rnd, w);
  switch (profile) {
    case "gipfel": {
      // One summit stands out on the second-nearest ridge; the others roll low around it.
      const summit = i === Math.max(0, n - 2);
      const rise = h * (summit ? 0.46 : 0.16);
      const peak = (x: number) => Math.exp(-((Math.abs(x - centre) / (w * 0.2)) ** 1.5));
      return (x: number) => base - rise * (summit ? peak(x) : roll(x));
    }
    case "tal": {
      // A valley: the nearer ridges climb towards the edges, the farthest closes its end.
      if (i === 0) return (x: number) => base - h * 0.14 * roll(x);
      const rise = h * lerp(0.2, 0.44, t);
      return (x: number) =>
        base - rise * Math.min(1, (Math.abs(x - centre) / (w * 0.55)) ** 1.4) - h * 0.04 * roll(x);
    }
    case "stufen":
      // Range behind range, each one gentle: layers.
      return (x: number) => base - h * 0.13 * roll(x);
    default:
      return (x: number) => base - h * lerp(0.3, 0.36, t) * roll(x);
  }
}

/** The ridges of a pen-drawn Black Forest horizon for a key (usually a page's path), far to near. */
export function penHorizon(
  key: string,
  { w = PEN_W, h = PEN_H, ridges }: { w?: number; h?: number; ridges?: number } = {},
): PenRidge[] {
  const rnd = random(seedOf(key));
  const scene = sceneFor(key);
  const n = ridges ?? (scene.profile === "stufen" ? 4 : 3);
  const centre = w * (0.45 + rnd() * 0.25);
  const out: PenRidge[] = [];

  const grounds = Array.from({ length: n }, (_, i) =>
    groundOf(scene.profile, i, n, rnd, w, h, centre),
  );

  const motifs = grounds.map((_, i) => motifOn(scene, i, n, grounds, w, h, centre));

  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 1;
    const ground = grounds[i]!;
    const pts: [number, number][] = [];
    for (let x = 0; x < w; x += 24) pts.push([x, ground(x)]);
    pts.push([w, ground(w)]);
    const line = pts.map(([x, y], j) => `${j ? "L" : "M"}${r1(x)} ${r1(y)}`).join(" ");

    // Where this ridge keeps free of firs: a clearing, the motif's place.
    const free: [number, number][] = [];
    if (scene.profile === "lichtung" && i === n - 1)
      free.push([centre - w * 0.14, centre + w * 0.14]);
    const motif = motifs[i];
    if (motif) free.push(motif.free);
    // A road comes in through the ridge in front: no fir stands on it there either.
    const behind = motifs[i - 1];
    if (scene.motif === "strasse" && behind) free.push(behind.free);

    // Firs: tall near, small far, in groups with meadows between.
    const tall: [number, number] = [lerp(13, 40, t), lerp(19, 62, t)];
    const spacing = lerp(0.8, 0.5, t);
    const group: [number, number] = [lerp(30, 50, t), lerp(90, 150, t)];
    // Four ranges share the forest of three: wider meadows keep the picture as light.
    const open = n > 3 ? 1.5 : 1;
    const meadow: [number, number] = [lerp(160, 90, t) * open, lerp(340, 260, t) * open];
    const firs: PenFir[] = [];
    let x = rnd() < 0.5 ? 0 : between(rnd, meadow) / 2;
    while (x < w) {
      const end = Math.min(w, x + between(rnd, group));
      while (x < end) {
        const size = between(rnd, tall) * (rnd() < 0.12 ? 1.2 : 1);
        if (!free.some(([a, b]) => x > a && x < b)) {
          const foot = ground(x) + 1.5;
          // Never above the picture: a fir that would reach out of it is drawn smaller.
          const fit = Math.min(size, foot - 2);
          const design = DESIGNS[Math.floor(rnd() * 3)]!;
          firs.push({ design, x: r1(x), y: r1(foot), h: r1(fit) });
        }
        x += size * spacing * (0.8 + rnd() * 0.4);
      }
      x += between(rnd, meadow);
    }
    out.push({
      line,
      fill: `${line} L${w} ${h} L0 ${h} Z`,
      firs,
      ...(motif ? { motif: motif.drawing } : {}),
      depth: i,
    });
  }
  return out;
}

type Placed = { free: [number, number]; drawing: NonNullable<PenRidge["motif"]> };

/** The scene's motif, if it stands on ridge `i`. */
function motifOn(
  scene: PenScene,
  i: number,
  n: number,
  grounds: ((x: number) => number)[],
  w: number,
  h: number,
  centre: number,
): Placed | null {
  const p = (x: number, y: number) => `${r1(x)} ${r1(y)}`;
  const ground = grounds[i]!;
  // The ridge in front of this one, whose contour hides the foot of anything climbing this one.
  const front = grounds[i + 1];
  switch (scene.motif) {
    case "turm": {
      // A lookout tower on the highest point of the second-nearest ridge.
      if (i !== Math.max(0, n - 2)) return null;
      let x = centre;
      for (let s = w * 0.25; s <= w * 0.75; s += 8) if (ground(s) < ground(x)) x = s;
      const y = ground(x) + 1;
      const top = Math.max(4, y - 64);
      const leg = 13;
      const strokes = [
        `M${p(x - leg, y)} L${p(x - 4, top + 8)} M${p(x + leg, y)} L${p(x + 4, top + 8)}`,
        `M${p(x - 11, y - 18)} L${p(x + 11, y - 18)} M${p(x - 8, y - 38)} L${p(x + 8, y - 38)}`,
        `M${p(x - 11, y - 18)} L${p(x + 8, y - 38)} M${p(x + 11, y - 18)} L${p(x - 8, y - 38)}`,
        `M${p(x - 8, top + 8)} L${p(x + 8, top + 8)} L${p(x + 6, top)} L${p(x - 6, top)} Z`,
      ].join(" ");
      const outline = `M${p(x - leg, y)} L${p(x - 8, top + 8)} L${p(x - 6, top)} L${p(x + 6, top)} L${p(x + 8, top + 8)} L${p(x + leg, y)} Z`;
      return { free: [x - 40, x + 40], drawing: { strokes, outline } };
    }
    case "huette": {
      // A Black Forest farmhouse on the nearest ridge: low walls under a deep hipped roof.
      if (i !== n - 1) return null;
      const x = centre + w * 0.08;
      const y = ground(x) + 1;
      const s = 1.1;
      const strokes = [
        `M${p(x - 34 * s, y - 16 * s)} L${p(x - 18 * s, y - 40 * s)} L${p(x + 18 * s, y - 40 * s)} L${p(x + 34 * s, y - 16 * s)} Z`,
        `M${p(x - 26 * s, y - 16 * s)} L${p(x - 26 * s, y)} L${p(x + 26 * s, y)} L${p(x + 26 * s, y - 16 * s)}`,
        `M${p(x - 5 * s, y)} L${p(x - 5 * s, y - 10 * s)} L${p(x + 5 * s, y - 10 * s)} L${p(x + 5 * s, y)}`,
        `M${p(x + 10 * s, y - 40 * s)} L${p(x + 10 * s, y - 47 * s)} L${p(x + 15 * s, y - 47 * s)} L${p(x + 15 * s, y - 40 * s)}`,
      ].join(" ");
      const outline = `M${p(x - 34 * s, y - 16 * s)} L${p(x - 18 * s, y - 40 * s)} L${p(x + 18 * s, y - 40 * s)} L${p(x + 34 * s, y - 16 * s)} L${p(x + 26 * s, y - 16 * s)} L${p(x + 26 * s, y)} L${p(x - 26 * s, y)} L${p(x - 26 * s, y - 16 * s)} Z`;
      return { free: [x - 60, x + 60], drawing: { strokes, outline } };
    }
    case "weg": {
      // A path in bends up the flank of the second-nearest ridge, waymarks along it, ending
      // short of the crest; its foot starts behind the nearest ridge.
      if (i !== Math.max(0, n - 2) || !front) return null;
      const from = Math.max(w * 0.06, centre - w * 0.34);
      const bends = [0, 0.32, 0.12, 0.55, 0.38, 0.8, 0.66, 1];
      const pts = bends.map((k, j) => {
        const x = from + (centre - w * 0.04 - from) * k;
        const rise = j / (bends.length - 1);
        const below = Math.min(front(x) - 4, ground(x) + 70 * (1 - rise) + 6);
        return [x, Math.max(ground(x) + 4, below)] as const;
      });
      const path = pts.map(([x, y], k) => `${k ? "L" : "M"}${p(x, y)}`).join(" ");
      const marks = [pts[1]!, pts[3]!, pts[5]!, pts[7]!]
        .map(([x, y]) => `M${p(x, y)} L${p(x, y - 12)} L${p(x + 6, y - 9)} L${p(x, y - 6)}`)
        .join(" ");
      return { free: [from - 10, centre], drawing: { strokes: `${path} ${marks}` } };
    }
    case "strasse": {
      // A road winding from the gap in the nearest ridge into the valley: two lines a few units
      // apart, closer together with distance.
      if (i !== Math.max(0, n - 2) || !front) return null;
      const far = ground(centre) + 3;
      const near = Math.min(h - 2, front(centre) - 2);
      const lane = (side: number, k: number) => {
        const y = lerp(near, far, k);
        const x = centre + Math.sin(k * Math.PI * 1.4) * 46 * (1 - k) + side * lerp(9, 1.5, k);
        return `${k ? "L" : "M"}${p(x, y)}`;
      };
      const steps = Array.from({ length: 13 }, (_, j) => j / 12);
      const strokes = [-1, 1].map((side) => steps.map((k) => lane(side, k)).join(" ")).join(" ");
      return { free: [centre - 90, centre + 90], drawing: { strokes } };
    }
    default:
      return null;
  }
}
