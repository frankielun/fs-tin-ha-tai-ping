import type { Glyph } from "./projection";

export type Stroke = readonly [x: number, y: number, width: number, height: number, angle?: number];

/** Ideograms drawn with boxes, avoiding font, texture, and external-asset dependencies. */
export const GLYPH_STROKES: Readonly<Record<Glyph, readonly Stroke[]>> = {
  天: [
    [-0.02, 0.34, 0.62, 0.09],
    [0, 0.12, 0.86, 0.09],
    [-0.2, -0.2, 0.1, 0.65, -0.55],
    [0.2, -0.2, 0.1, 0.65, 0.55],
  ],
  下: [
    [0, 0.32, 0.86, 0.09],
    [0, -0.04, 0.09, 0.78],
    [0.19, -0.03, 0.09, 0.4, -0.75],
  ],
  太: [
    [0, 0.18, 0.88, 0.09],
    [-0.18, -0.15, 0.1, 0.75, -0.5],
    [0.2, -0.12, 0.1, 0.72, 0.55],
    [0.13, -0.31, 0.22, 0.08, -0.55],
  ],
  平: [
    [0, 0.34, 0.8, 0.09],
    [-0.25, 0.08, 0.09, 0.35, -0.55],
    [0.25, 0.08, 0.09, 0.35, 0.55],
    [0, -0.08, 0.92, 0.09],
    [0, -0.12, 0.09, 0.85],
  ],
};
