import type { GlyphName } from "./service-glyphs";
import type { ValleySpec } from "./valley";

// Each valley hints at its service in its near skyline: web a wide open valley between two
// heights, mobile two peaks side by side, integration two peaks with a saddle between them,
// modernisation one young steep peak beside an old worn one, operations a long steady ridge.
// Behind it stand the generated middle range and the high mountains (valley.ts).
export const VALLEYS: Record<GlyphName, ValleySpec> = {
  web: {
    seed: 11,
    near: [
      [0, 610],
      [150, 560],
      [280, 640],
      [430, 700],
      [790, 705],
      [950, 630],
      [1080, 565],
      [1200, 610],
    ],
    firs: [
      { design: "dicht", x: 300, h: 250 },
      { design: "schlank", x: 372, h: 170 },
      { design: "konkav", x: 880, h: 260 },
    ],
  },
  mobile: {
    seed: 23,
    near: [
      [0, 700],
      [330, 690],
      [500, 560],
      [590, 640],
      [700, 572],
      [860, 690],
      [1200, 705],
    ],
    firs: [
      { design: "schlank", x: 300, h: 230 },
      { design: "dicht", x: 870, h: 260 },
      { design: "schlank", x: 930, h: 180 },
    ],
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
      { design: "konkav", x: 305, h: 240 },
      { design: "schlank", x: 915, h: 260 },
    ],
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
      { design: "dicht", x: 310, h: 290 },
      { design: "schlank", x: 380, h: 150 },
      { design: "schlank", x: 425, h: 115 },
      { design: "konkav", x: 895, h: 240 },
    ],
  },
  operations: {
    seed: 53,
    near: [
      [0, 690],
      [170, 652],
      [400, 628],
      [640, 612],
      [900, 628],
      [1070, 650],
      [1200, 682],
    ],
    firs: [
      { design: "dicht", x: 300, h: 250 },
      { design: "konkav", x: 890, h: 250 },
    ],
  },
};
