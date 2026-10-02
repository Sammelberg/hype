// The one landmark of each service's valley (valley.ts): a piece of the fairy-tale Black Forest
// that tells its service. A mountain lake mirroring the valley (web: one surface, every device), a
// Schwarzwaldhof with lit windows (system: the house that runs the business), a viaduct with a
// lit train across the saddle (integration), a castle ruin on the old hill beside a new lookout
// tower on the young peak (modernisation), and a waterfall falling steadily in steps
// (operations). Drawn like the ridges: straight lines, the ridge's ground as body, an ice line,
// windows as the only light. Pure and deterministic.

import { r1 } from "@/lib/curves";

export type MotifName = "see" | "hof" | "viadukt" | "ruine" | "wasserfall";

/**
 * body: filled in the ground colour; line: the ice line; light: a lit window; sheet: falling
 * water's faint width; water: its strands, which flow.
 */
export type Piece = { kind: "body" | "line" | "light" | "sheet" | "water"; d: string };

export type MotifDrawing = {
  /** On the middle ridge, behind the near one. */
  mid: Piece[];
  /** On the near ridge, over its ground. */
  near: Piece[];
  /** A lake on the valley floor: its surface, its shore, the mirror's axis and moonlight on it. */
  lake?: { shape: string; shore: string; axis: number; glitter: string[] };
};

type Height = (x: number) => number;

const rect = (x: number, y: number, w: number, h: number) =>
  `M ${r1(x)} ${r1(y)} h ${r1(w)} v ${r1(h)} h ${r1(-w)} Z`;
const poly = (pts: readonly (readonly [number, number])[], close = true) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"} ${r1(x)} ${r1(y)}`).join(" ") + (close ? " Z" : "");

/** The first x from `from` towards `to` where the ground lies at or below y. */
function crossing(at: Height, y: number, from: number, to: number) {
  const step = from < to ? 1 : -1;
  for (let x = from; step > 0 ? x <= to : x >= to; x += step) if (at(x) >= y) return x;
  return to;
}

/**
 * A Schwarzwaldhof from its gable side: the great roof reaching almost to the ground with its
 * small hip at the top (Krüppelwalm), the wooden gable under it with a gallery, lit windows on
 * every floor.
 */
function hof(x: number, at: Height): MotifDrawing {
  const y = at(x);
  const walls = rect(x - 64, y - 26, 128, 26);
  const roof = poly([
    [x - 94, y - 20],
    [x - 20, y - 120],
    [x, y - 130],
    [x + 20, y - 120],
    [x + 94, y - 20],
  ]);
  const gable = poly([
    [x - 66, y - 26],
    [x - 16, y - 104],
    [x + 16, y - 104],
    [x + 66, y - 26],
  ]);
  const lines = [
    // The gallery across the gable, and the door.
    poly(
      [
        [x - 52, y - 48],
        [x + 52, y - 48],
      ],
      false,
    ),
    poly(
      [
        [x - 37, y - 72],
        [x + 37, y - 72],
      ],
      false,
    ),
    rect(x - 6, y - 16, 12, 16),
  ];
  const windows = [
    ...[-50, -32, 20, 38].map((dx) => rect(x + dx, y - 17, 10, 9)),
    ...[-34, -5, 24].map((dx) => rect(x + dx, y - 42, 10, 9)),
    ...[-19, 9].map((dx) => rect(x + dx, y - 66, 10, 9)),
    rect(x - 4, y - 92, 8, 8),
  ];
  return {
    mid: [],
    near: [
      { kind: "body", d: `${walls} ${roof}` },
      { kind: "line", d: [walls, roof, gable, ...lines].join(" ") },
      { kind: "light", d: windows.join(" ") },
    ],
  };
}

/** The first x from `from` towards `to` where the ground rises to y or above it. */
function rise(at: Height, y: number, from: number, to: number) {
  const step = from < to ? 1 : -1;
  for (let x = from; step > 0 ? x <= to : x >= to; x += step) if (at(x) <= y) return x;
  return to;
}

/** A stone viaduct across the saddle on round arches, a short train with lit windows on it. */
function viadukt(deck: number, at: Height): MotifDrawing {
  // From the middle of the saddle out to where each slope meets the deck.
  const left = rise(at, deck + 4, 600, 0);
  const right = rise(at, deck + 4, 600, 1200);
  const spans = Math.max(3, Math.round((right - left) / 72));
  const w = (right - left) / spans;
  const pier = 12;
  const bottom = deck + 10;
  const body: string[] = [rect(left - 14, deck, right - left + 28, 10)];
  const line: string[] = [
    poly(
      [
        [left - 14, deck],
        [right + 14, deck],
      ],
      false,
    ),
    poly(
      [
        [left - 14, deck - 8],
        [right + 14, deck - 8],
      ],
      false,
    ),
  ];
  for (let i = 0; i < spans; i++) {
    const a = left + i * w + (i === 0 ? 0 : pier / 2);
    const b = left + (i + 1) * w - (i === spans - 1 ? 0 : pier / 2);
    const r = (b - a) / 2;
    const spring = bottom + 6 + r;
    // The spandrel between the deck and the arch, and the pier down to the ground.
    body.push(
      `M ${r1(a)} ${r1(bottom)} L ${r1(b)} ${r1(bottom)} L ${r1(b)} ${r1(spring)} A ${r1(r)} ${r1(r)} 0 0 0 ${r1(a)} ${r1(spring)} Z`,
    );
    line.push(`M ${r1(a)} ${r1(spring)} A ${r1(r)} ${r1(r)} 0 0 1 ${r1(b)} ${r1(spring)}`);
    if (i < spans - 1) {
      const px = left + (i + 1) * w;
      const foot = at(px) + 6;
      body.push(rect(px - pier / 2, bottom, pier, foot - bottom));
      line.push(
        poly(
          [
            [px - pier / 2, spring],
            [px - pier / 2, foot],
          ],
          false,
        ),
        poly(
          [
            [px + pier / 2, spring],
            [px + pier / 2, foot],
          ],
          false,
        ),
      );
    }
  }
  // The train: a locomotive with a sloped nose and three coaches.
  const start = left + w * 0.6;
  const cars: string[] = [];
  const windows: string[] = [];
  for (let c = 0; c < 3; c++) {
    const x = start + c * 50;
    cars.push(rect(x, deck - 22, 46, 14));
    for (let k = 0; k < 4; k++) windows.push(rect(x + 5 + k * 10, deck - 19, 6, 5));
  }
  const loco = poly([
    [start + 150, deck - 8],
    [start + 150, deck - 26],
    [start + 176, deck - 26],
    [start + 192, deck - 14],
    [start + 192, deck - 8],
  ]);
  windows.push(rect(start + 160, deck - 23, 9, 6));
  return {
    mid: [],
    near: [
      { kind: "body", d: [...body, ...cars, loco].join(" ") },
      { kind: "line", d: [...line, ...cars, loco].join(" ") },
      { kind: "light", d: windows.join(" ") },
    ],
  };
}

/** A broken keep and its wall on the old hill; a slim lattice tower with a light on the young peak. */
function ruine(oldX: number, peakX: number, at: Height): MotifDrawing {
  const y = at(oldX);
  const keep = poly([
    [oldX - 20, y + 4],
    [oldX - 20, y - 96],
    [oldX - 9, y - 96],
    [oldX - 9, y - 88],
    [oldX + 1, y - 88],
    [oldX + 1, y - 78],
    [oldX + 9, y - 84],
    [oldX + 20, y - 62],
    [oldX + 20, y + 4],
  ]);
  const wallEnd = oldX + 78;
  const wall = poly([
    [oldX + 20, y - 40],
    [oldX + 30, y - 40],
    [oldX + 30, y - 33],
    [oldX + 39, y - 33],
    [oldX + 39, y - 40],
    [oldX + 49, y - 40],
    [oldX + 56, y - 30],
    [oldX + 64, y - 28],
    [wallEnd, at(wallEnd) - 10],
    [wallEnd, at(wallEnd) + 4],
    [oldX + 20, at(oldX + 20) + 4],
  ]);
  // Dark windows: nobody lives in the old keep any more.
  const slits = [
    `M ${r1(oldX - 4)} ${r1(y - 30)} v -14 a 4 4 0 0 1 8 0 v 14 Z`,
    `M ${r1(oldX - 3)} ${r1(y - 66)} v -10 a 3 3 0 0 1 6 0 v 10 Z`,
  ];

  const top = at(peakX);
  const legs = 15;
  const crown = top - 118;
  const lattice: string[] = [];
  const levels = [0, 0.25, 0.5, 0.75, 1];
  const half = (t: number) => legs - (legs - 5) * t;
  for (let k = 0; k < levels.length - 1; k++) {
    const t0 = levels[k]!;
    const t1 = levels[k + 1]!;
    const y0 = top - (top - crown) * t0;
    const y1 = top - (top - crown) * t1;
    lattice.push(
      poly(
        [
          [peakX - half(t0), y0],
          [peakX + half(t1), y1],
        ],
        false,
      ),
      poly(
        [
          [peakX + half(t0), y0],
          [peakX - half(t1), y1],
        ],
        false,
      ),
      poly(
        [
          [peakX - half(t1), y1],
          [peakX + half(t1), y1],
        ],
        false,
      ),
    );
  }
  const legLines = poly(
    [
      [peakX - legs, at(peakX - legs) + 4],
      [peakX - legs, top],
      [peakX - 5, crown],
      [peakX + 5, crown],
      [peakX + legs, top],
      [peakX + legs, at(peakX + legs) + 4],
    ],
    false,
  );
  const platform = rect(peakX - 15, crown - 10, 30, 10);
  const cap = poly([
    [peakX - 18, crown - 10],
    [peakX, crown - 26],
    [peakX + 18, crown - 10],
  ]);
  return {
    mid: [],
    near: [
      { kind: "body", d: `${keep} ${wall} ${platform} ${cap}` },
      {
        kind: "line",
        d: [keep, wall, ...slits, legLines, ...lattice, platform, cap].join(" "),
      },
      { kind: "light", d: rect(peakX - 10, crown - 8, 20, 6) },
    ],
  };
}

/**
 * A waterfall out of a notch in the near ridge, down its dark face in three steps into a pool:
 * four strands that flow (water) over a soft sheet, the pool's ripples as short lines.
 */
function wasserfall(x: number, at: Height): MotifDrawing {
  const y0 = at(x) + 2;
  const pool = 772;
  const step = (pool - y0) / 3;
  const course = (dx: number) =>
    poly(
      [
        [x + dx, y0],
        [x + dx, y0 + step - 8],
        [x + dx + 24, y0 + step + 6],
        [x + dx + 24, y0 + 2 * step - 8],
        [x + dx + 6, y0 + 2 * step + 6],
        [x + dx + 6, pool],
      ],
      false,
    );
  const ripples = [
    [44, 0],
    [70, 9],
    [96, 18],
  ].map(([w, dy]) =>
    poly(
      [
        [x + 6 - w!, pool + dy!],
        [x + 6 + w!, pool + dy!],
      ],
      false,
    ),
  );
  return {
    mid: [],
    near: [
      { kind: "sheet", d: course(0) },
      { kind: "water", d: [-12, -4, 4, 12].map(course).join(" ") },
      { kind: "line", d: ripples.join(" ") },
    ],
  };
}

/**
 * A mountain lake on the flat valley floor between the near hills: its waterline at the foot of
 * the hills, its shores running out towards the viewer, moonlight lying on it below the moon.
 */
function see(axis: number, at: Height, moonX: number): MotifDrawing {
  const left = crossing(at, axis, 0, 600);
  const right = crossing(at, axis, 1200, 600);
  const shape = poly([
    [left, axis],
    [right, axis],
    [right + 150, 800],
    [left - 150, 800],
  ]);
  const glitter: string[] = [];
  for (let k = 0; k < 7; k++) {
    const y = axis + 14 + k * 21;
    const w = 18 + k * 9;
    const dx = k % 2 ? 7 : -5;
    glitter.push(
      poly(
        [
          [moonX + dx - w / 2, y],
          [moonX + dx + w / 2, y],
        ],
        false,
      ),
    );
  }
  return {
    mid: [],
    near: [],
    lake: {
      shape,
      shore: poly(
        [
          [left - 150, 800],
          [left, axis],
          [right, axis],
          [right + 150, 800],
        ],
        false,
      ),
      axis,
      glitter,
    },
  };
}

export type MotifSpec =
  | { name: "see"; axis: number }
  | { name: "hof"; x: number }
  | { name: "viadukt"; deck: number }
  | { name: "ruine"; old: number; peak: number }
  | { name: "wasserfall"; x: number };

export function motif(spec: MotifSpec, at: Height, moonX: number): MotifDrawing {
  switch (spec.name) {
    case "see":
      return see(spec.axis, at, moonX);
    case "hof":
      return hof(spec.x, at);
    case "viadukt":
      return viadukt(spec.deck, at);
    case "ruine":
      return ruine(spec.old, spec.peak, at);
    case "wasserfall":
      return wasserfall(spec.x, at);
  }
}
