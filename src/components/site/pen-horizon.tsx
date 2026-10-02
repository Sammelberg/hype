import type { CSSProperties } from "react";

import { PEN_H, PEN_W, penHorizon } from "@/lib/pen-horizon";
import { cn } from "@/lib/utils";

import { FIR_DESIGNS } from "./fir-shapes";
import styles from "./pen-horizon.module.css";

// Width per height of each fir drawing, from its own viewBox.
const ASPECT = Object.fromEntries(
  Object.entries(FIR_DESIGNS).map(([name, fir]) => {
    const [, , w, h] = fir.viewBox.split(" ").map(Number) as [number, number, number, number];
    return [name, w / h];
  }),
);

/**
 * A Black Forest horizon drawn as with a pen (lib/pen-horizon): thin contour lines, ridge behind
 * ridge, our three firs in groups (from the cached sprite /tannen.svg, each over its outline in
 * the ground colour, so no farther line runs through it) and the page's motif, if it has one.
 * The box keeps the picture's proportions, so nothing is cut at the top; narrow screens lose
 * a little at the sides. It comes in far to near — once on load (`draw="load"`, page heads) or as
 * it crosses the screen (`draw="scroll"`) — and the ridges part a little as the page scrolls on.
 */
export function PenHorizon({
  seed,
  ridges,
  draw = "load",
  className,
}: {
  seed: string;
  ridges?: number;
  draw?: "load" | "scroll";
  className?: string;
}) {
  const layers = penHorizon(seed, { ridges });
  return (
    <svg
      viewBox={`0 0 ${PEN_W} ${PEN_H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      className={cn(styles.pen, draw === "scroll" ? styles.onScroll : styles.onLoad, className)}
    >
      {layers.map((ridge) => (
        <g
          key={ridge.depth}
          className={styles.ridge}
          style={
            {
              "--depth": ridge.depth,
              "--ink": 0.38 + (0.57 * ridge.depth) / Math.max(1, layers.length - 1),
            } as CSSProperties
          }
        >
          <path className={styles.fill} d={ridge.fill} />
          <path className={styles.line} d={ridge.line} pathLength={1} />
          {ridge.motif ? (
            <g className={styles.motif}>
              {ridge.motif.outline ? (
                <path className={styles.fill} d={ridge.motif.outline} />
              ) : null}
              <path className={styles.motifLine} d={ridge.motif.strokes} />
            </g>
          ) : null}
          <g className={styles.firs}>
            {ridge.firs.map((fir) => {
              const w = fir.h * (ASPECT[fir.design] ?? 0.5);
              const box = { x: fir.x - w / 2, y: fir.y - fir.h, width: w, height: fir.h };
              return (
                <g key={`${fir.x}-${fir.h}`}>
                  <use
                    href={`/tannen.svg#${fir.design}-grund`}
                    className={styles.ground}
                    {...box}
                  />
                  <use href={`/tannen.svg#${fir.design}`} className={styles.fir} {...box} />
                </g>
              );
            })}
          </g>
        </g>
      ))}
    </svg>
  );
}
