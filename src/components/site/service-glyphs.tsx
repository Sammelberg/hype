import type { ReactNode, SVGProps } from "react";

// Line drawings of the five services (services-strata.tsx), in the style of the hero's ridge
// outline: thin strokes in ice blue, no fills but a faint light in closed shapes. Every stroke
// carries data-draw so GSAP DrawSVG can draw it in the order it appears; shapes that hold light
// carry data-fill (their fill-opacity rises after the draw). All five share one 400 × 400 box.

export type GlyphName = "web" | "mobile" | "integration" | "modernisation" | "operations";

const STROKE: SVGProps<SVGSVGElement> = {
  fill: "none",
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
  // Two phones, one for each platform.
  mobile: (
    <>
      <rect data-draw data-fill x="210" y="40" width="140" height="290" rx="22" />
      <path data-draw d="M250 68h60" />
      <path data-draw d="M240 120h80M240 150h56M240 180h80" />
      <rect data-draw data-fill x="60" y="80" width="140" height="290" rx="22" />
      <path data-draw d="M108 104h44" />
      <path data-draw d="M90 160h80M90 190h56M90 220h80" />
      <rect data-draw data-fill x="90" y="300" width="80" height="28" rx="14" />
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
    <svg viewBox="0 0 400 400" aria-hidden="true" className={className} {...STROKE}>
      {GLYPHS[name]}
    </svg>
  );
}
