import type { ReactNode, SVGProps } from "react";

import { cn } from "@/lib/utils";

// Line drawings of the five services (services-strata.tsx), in the style of the hero's ridge
// outline: thin strokes in ice blue, no fills but a faint light in closed shapes. Every stroke
// carries data-draw so GSAP DrawSVG can draw it in the order it appears; shapes that hold light
// carry data-fill (their fill-opacity rises after the draw). All five share one 400 × 400 box.

export type GlyphName = "web" | "system" | "integration" | "modernisation" | "operations";

const STROKE: SVGProps<SVGSVGElement> = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const GLYPHS: Record<GlyphName, ReactNode> = {
  // A browser window: sidebar, two panels and a line of measurements.
  web: (
    <>
      <rect data-draw data-fill x="40" y="70" width="320" height="260" rx="14" />
      <path data-draw d="M40 110H360" />
      <circle data-draw cx="66" cy="90" r="5" />
      <circle data-draw cx="86" cy="90" r="5" />
      <path data-draw d="M110 110V330" />
      <path data-draw d="M60 150h30M60 180h30M60 210h30" />
      <rect data-draw data-fill x="140" y="140" width="90" height="60" rx="6" />
      <rect data-draw data-fill x="250" y="140" width="80" height="60" rx="6" />
      <path data-draw d="M140 290 190 240 230 262 280 190 330 214" />
    </>
  ),
  // One system of three parts: the figures of a dashboard, an invoice, a calendar.
  system: (
    <>
      <rect data-draw data-fill x="150" y="40" width="210" height="180" rx="12" />
      <path data-draw d="M150 76H360" />
      <path data-draw d="M190 190v-40M230 190v-70M270 190v-50M310 190v-84" />
      <rect data-draw data-fill x="40" y="170" width="140" height="190" rx="10" />
      <path data-draw d="M64 206h68M64 234h92M64 262h52" />
      <path data-draw d="M108 322h48" />
      <rect data-draw data-fill x="220" y="250" width="140" height="110" rx="10" />
      <path data-draw d="M220 282H360M250 238v24M330 238v24" />
      <circle data-draw cx="252" cy="310" r="5" />
      <circle data-draw cx="290" cy="310" r="5" />
      <circle data-draw data-fill cx="328" cy="310" r="5" />
      <circle data-draw cx="252" cy="338" r="5" />
    </>
  ),
  // Four systems joined through one hub.
  integration: (
    <>
      <rect data-draw data-fill x="40" y="40" width="90" height="60" rx="8" />
      <rect data-draw data-fill x="270" y="40" width="90" height="60" rx="8" />
      <rect data-draw data-fill x="270" y="300" width="90" height="60" rx="8" />
      <rect data-draw data-fill x="40" y="300" width="90" height="60" rx="8" />
      <path
        data-draw
        d="M58 62h40M58 78h26M288 62h40M288 78h26M288 322h40M288 338h26M58 322h40M58 338h26"
      />
      <path data-draw d="M130 70C190 70 150 120 150 200" />
      <path data-draw d="M270 70C210 70 200 100 200 150" />
      <path data-draw d="M270 330C210 330 250 280 250 200" />
      <path data-draw d="M130 330C190 330 200 300 200 250" />
      <path data-draw data-fill d="M200 150 250 200 200 250 150 200Z" />
    </>
  ),
  // Layers of a system: the lower ones fading, the upper ones new, one more being set on top.
  modernisation: (
    <>
      <path data-draw opacity="0.35" d="M80 300 200 245 320 300 200 355Z" />
      <path data-draw opacity="0.55" d="M80 245 200 190 320 245 200 300Z" />
      <path data-draw data-fill d="M80 190 200 135 320 190 200 245Z" />
      <path data-draw data-fill d="M80 135 200 80 320 135 200 190Z" />
      <path data-draw data-fill d="M200 30 216 46 200 62 184 46Z" />
    </>
  ),
  // A pulse line through a ring: the system running, watched.
  operations: (
    <>
      <circle data-draw opacity="0.35" cx="200" cy="200" r="152" />
      <circle data-draw data-fill cx="200" cy="200" r="124" />
      <path data-draw d="M40 200h84l22-40 24 96 26-72 16 16h44l20-30 20 30h64" />
      <circle data-draw data-fill cx="360" cy="200" r="7" />
    </>
  ),
};

export function ServiceGlyph({ name, className }: { name: GlyphName; className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden="true"
      // Outside the services ride (whose stylesheet draws them) the strokes keep their 1.5px at
      // any size, and closed shapes hold a faint light of the line colour.
      className={cn(
        "overflow-visible [&_*]:[vector-effect:non-scaling-stroke] [&_[data-fill]]:fill-current [&_[data-fill]]:[fill-opacity:0.14]",
        className,
      )}
      {...STROKE}
    >
      {GLYPHS[name]}
    </svg>
  );
}
