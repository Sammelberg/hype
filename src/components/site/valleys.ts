import type { GlyphName } from "./service-glyphs";
import type { ValleySpec } from "./valley";

// Each valley hints at its service in its near skyline and its landmark (valley-motifs.ts): web a
// wide valley holding a mountain lake that mirrors it all, system two peaks with a Schwarzwaldhof
// on the meadow between them, integration two peaks joined by a viaduct across the saddle,
// modernisation a castle ruin on an old worn hill beside a young steep peak with a new tower,
// operations a long steady ridge with a waterfall falling steadily down its face. Each has its own
// moon. Behind it stand the generated middle range and the high mountains (valley.ts).
export const VALLEYS: Record<GlyphName, ValleySpec> = {
  web: {
    seed: 11,
    near: [
      [0, 590],
      [130, 548],
      [235, 604],
      [330, 640],
      [860, 640],
      [965, 598],
      [1080, 546],
      [1200, 596],
    ],
    firs: [
      { design: "dicht", x: 250, h: 230 },
      { design: "schlank", x: 312, h: 150 },
      { design: "konkav", x: 940, h: 250 },
    ],
    moon: { x: 640, y: 150, r: 34, lit: 1, side: "right" },
    motif: { name: "see", axis: 640 },
  },
  system: {
    seed: 23,
    near: [
      [0, 700],
      [290, 690],
      [440, 556],
      [520, 616],
      [552, 652],
      [712, 652],
      [748, 612],
      [820, 560],
      [960, 690],
      [1200, 705],
    ],
    firs: [
      { design: "schlank", x: 300, h: 230 },
      { design: "dicht", x: 905, h: 250 },
      { design: "schlank", x: 965, h: 170 },
    ],
    moon: { x: 300, y: 140, r: 30, lit: 0.3, side: "right" },
    motif: { name: "hof", x: 632 },
  },
  integration: {
    seed: 37,
    near: [
      [0, 690],
      [250, 650],
      [340, 572],
      [470, 655],
      [610, 668],
      [750, 652],
      [880, 572],
      [990, 660],
      [1200, 690],
    ],
    firs: [
      { design: "konkav", x: 290, h: 220 },
      { design: "schlank", x: 950, h: 240 },
    ],
    moon: { x: 900, y: 130, r: 28, lit: 0.62, side: "left" },
    motif: { name: "viadukt", deck: 598 },
  },
  modernisation: {
    seed: 41,
    near: [
      [0, 700],
      [180, 668],
      [320, 626],
      [450, 690],
      [560, 694],
      [640, 520],
      [735, 690],
      [1200, 708],
    ],
    firs: [
      { design: "schlank", x: 210, h: 170 },
      { design: "dicht", x: 455, h: 230 },
      { design: "schlank", x: 505, h: 130 },
      { design: "konkav", x: 895, h: 240 },
    ],
    moon: { x: 820, y: 160, r: 32, lit: 0.18, side: "left" },
    motif: { name: "ruine", old: 320, peak: 640 },
  },
  operations: {
    seed: 53,
    near: [
      [0, 690],
      [170, 652],
      [400, 628],
      [598, 614],
      [620, 634],
      [660, 634],
      [682, 613],
      [900, 628],
      [1070, 650],
      [1200, 682],
    ],
    firs: [
      { design: "dicht", x: 300, h: 250 },
      { design: "konkav", x: 890, h: 250 },
    ],
    moon: { x: 380, y: 150, r: 30, lit: 0.85, side: "right" },
    motif: { name: "wasserfall", x: 640 },
  },
};
