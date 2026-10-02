import type { ReactNode } from "react";

import { MIST, type Valley } from "./valley";
import type { Piece } from "./valley-motifs";

// The parts of a valley (valley.ts) both of its renderers share: the home services' sapphire
// windows (services-strata.tsx) and the navy views of /leistungen (valley-view.tsx). They mark
// each element with `data-v` and leave the colours to the renderer's own styles. `prefix` keeps
// the gradients and clip paths of several valleys on one page apart.

/** The mist's gradients and soft edge, the moon's halo and the lake's clip, once per valley. */
export function SceneDefs({ v, prefix }: { v: Valley; prefix: string }) {
  return (
    <defs>
      <filter id={`${prefix}-hauch`} x="-5%" y="-20%" width="110%" height="140%">
        <feGaussianBlur stdDeviation="16" />
      </filter>
      <radialGradient id={`${prefix}-hof`}>
        <stop offset="0" data-v="halo-in" />
        <stop offset="1" data-v="halo-out" />
      </radialGradient>
      {(["far", "mid"] as const).map((ridge) => (
        <linearGradient
          key={ridge}
          id={`${prefix}-nebel-${ridge}`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={MIST[ridge].from}
          x2="0"
          y2={MIST[ridge].to}
        >
          <stop offset="0" data-v="mist-clear" />
          <stop offset="1" data-v="mist-dense" />
        </linearGradient>
      ))}
      {v.motif.lake ? (
        <clipPath id={`${prefix}-see`}>
          <path d={v.motif.lake.shape} />
        </clipPath>
      ) : null}
    </defs>
  );
}

/** The moon: a soft halo, the unlit rest of its disc, the lit part. */
export function Moon({ v, prefix }: { v: Valley; prefix: string }) {
  const { x, y, r } = v.moon;
  return (
    <g>
      <circle data-v="halo" fill={`url(#${prefix}-hof)`} cx={x} cy={y} r={r * 4} />
      <circle data-v="moon-rest" cx={x} cy={y} r={r} />
      <path data-v="moon" d={v.moon.lit} />
    </g>
  );
}

export function Mist({ v, ridge, prefix }: { v: Valley; ridge: "far" | "mid"; prefix: string }) {
  return (
    <path
      data-v="mist"
      fill={`url(#${prefix}-nebel-${ridge})`}
      filter={`url(#${prefix}-hauch)`}
      d={v.mist[ridge]}
    />
  );
}

export function Pieces({ pieces }: { pieces: readonly Piece[] }) {
  return pieces.map((piece, i) => <path key={i} data-v={piece.kind} d={piece.d} />);
}

/**
 * The lake: dark water, the valley mirrored in it upside down and flattened (children: the
 * ridges and firs to mirror), moonlight on it, its shore as the ice line.
 */
export function Lake({ v, prefix, children }: { v: Valley; prefix: string; children: ReactNode }) {
  const lake = v.motif.lake;
  if (!lake) return null;
  const squash = 0.55;
  return (
    <g>
      <path data-v="lake" d={lake.shape} />
      <g clipPath={`url(#${prefix}-see)`}>
        <g data-v="mirror" transform={`matrix(1 0 0 ${-squash} 0 ${lake.axis * (1 + squash)})`}>
          {children}
        </g>
      </g>
      {lake.glitter.map((d, i) => (
        <path key={i} data-v="glitter" d={d} />
      ))}
      <path data-v="shore" d={lake.shore} />
    </g>
  );
}
