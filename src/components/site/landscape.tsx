import type { CSSProperties } from "react";

import { sceneFor } from "@/lib/pen-horizon";
import {
  forestEdge,
  PAPER_H,
  PAPER_W,
  type PaperFir,
  type PaperLayer,
  paperRidges,
} from "@/lib/paper-ridges";
import { cn } from "@/lib/utils";

import { FIR_DESIGNS } from "./fir-shapes";
import styles from "./landscape.module.css";
import { PenHorizon } from "./pen-horizon";

// Width per height of each fir drawing, from its own viewBox.
const ASPECT = Object.fromEntries(
  Object.entries(FIR_DESIGNS).map(([name, fir]) => {
    const [, , w, h] = fir.viewBox.split(" ").map(Number) as [number, number, number, number];
    return [name, w / h];
  }),
);

/** One of our firs: its outline in the paper's colour, its drawing on top as a faint rim. */
function Fir({ fir, rim }: { fir: PaperFir; rim: number }) {
  const w = fir.h * (ASPECT[fir.design] ?? 0.5);
  const box = { x: fir.x - w / 2, y: fir.y - fir.h, width: w, height: fir.h };
  return (
    <g>
      <use href={`/tannen.svg#${fir.design}-grund`} {...box} />
      {rim > 0 ? (
        <use href={`/tannen.svg#${fir.design}`} {...box} className={styles.rim} opacity={rim} />
      ) : null}
    </g>
  );
}

/** One paper layer: its ground and all its firs as a single cut. */
function Layer({ layer }: { layer: PaperLayer }) {
  return (
    <path
      d={layer.cut}
      className={styles.layer}
      fill="currentColor"
      style={{ "--i": layer.depth } as CSSProperties}
    />
  );
}

type Place = "kopf" | "fuss";

/**
 * „Kulissen“: four paper ridges of our firs, far (light) to near (dark). In a page head they come
 * up one after another and part as the head scrolls away; in the foot they part as the page
 * reaches its end. Reduced motion: still.
 */
export function Kulissen({
  seed,
  place = "kopf",
  className,
}: {
  seed: string;
  place?: Place;
  className?: string;
}) {
  const layers = paperRidges(seed);
  return (
    <svg
      viewBox={`0 0 ${PAPER_W} ${PAPER_H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      className={cn(styles.paper, place === "fuss" ? styles.imFuss : styles.imKopf, className)}
    >
      {layers.map((layer) => (
        <Layer key={layer.depth} layer={layer} />
      ))}
    </svg>
  );
}

/**
 * „Waldrand“: a few of our firs tall at one edge, close, on a low ridge of their kind; they
 * rise into place when the page opens and drift up a little as the head scrolls away.
 */
export function Waldrand({ seed, className }: { seed: string; className?: string }) {
  const { ridge, tall, side } = forestEdge(seed);
  return (
    <svg
      viewBox={`0 0 ${PAPER_W} ${PAPER_H}`}
      preserveAspectRatio={side === "right" ? "xMaxYMax slice" : "xMinYMax slice"}
      aria-hidden="true"
      className={cn(styles.paper, styles.imKopf, styles.edge, className)}
    >
      <Layer layer={{ ...ridge, depth: 2 }} />
      <g className={styles.tall} style={{ "--i": 3 } as CSSProperties}>
        {tall.map((fir) => (
          <Fir key={fir.x} fir={fir} rim={0.45} />
        ))}
      </g>
    </svg>
  );
}

/** A page's own landscape in the style its scene names (lib/pen-horizon: PAGE_SCENES). */
export function Landschaft({ seed, className }: { seed: string; className?: string }) {
  const stil = sceneFor(seed).stil ?? "feder";
  if (stil === "kulissen") return <Kulissen seed={seed} className={className} />;
  if (stil === "waldrand") return <Waldrand seed={seed} className={className} />;
  return <PenHorizon seed={seed} className={className} />;
}
