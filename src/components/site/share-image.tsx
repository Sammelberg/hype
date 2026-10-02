import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { PEN_H, PEN_W, penHorizon } from "@/lib/pen-horizon";

import { BRAND_HEX, FirMark } from "./fir-mark";
import { FIR_DESIGNS } from "./fir-shapes";

export const SHARE_SIZE = { width: 1200, height: 630 };

// Geist, the site's typeface, from its local package (next/og reads TrueType, not woff2); loaded
// once per server process.
const GEIST = join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans");
let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 600 }[]> | null = null;
const loadFonts = () =>
  (fonts ??= Promise.all([
    readFile(join(GEIST, "Geist-Regular.ttf")).then((data) => ({
      name: "Geist",
      data,
      weight: 400 as const,
    })),
    readFile(join(GEIST, "Geist-SemiBold.ttf")).then((data) => ({
      name: "Geist",
      data,
      weight: 600 as const,
    })),
  ]));

/**
 * Share image of a page, rendered on our own server with next/og's bundled font: the site's name
 * with the fir, the page title large, and the page's own pen-drawn horizon along the bottom (the
 * same ridges of fir tops its PageHeader draws).
 */
export async function shareImage({
  siteName,
  title,
  kicker,
  horizonKey,
}: {
  siteName: string;
  title: string;
  kicker?: string | null;
  horizonKey: string;
}) {
  const ridges = penHorizon(horizonKey);
  const fontList = await loadFonts();
  const long = title.length > 28;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: BRAND_HEX.background,
        color: BRAND_HEX.foreground,
        fontFamily: "Geist",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", padding: "64px 80px 0" }}>
        <FirMark color={BRAND_HEX.accent} size={48} />
        <div style={{ marginLeft: 16, fontSize: 34, fontWeight: 600, letterSpacing: -0.6 }}>
          {siteName}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "center",
          padding: "0 80px",
        }}
      >
        {kicker ? (
          <div style={{ fontSize: 32, color: BRAND_HEX.accent, marginBottom: 12 }}>{kicker}</div>
        ) : null}
        <div
          style={{
            fontSize: long ? 68 : 92,
            fontWeight: 600,
            letterSpacing: long ? -2 : -3,
            lineHeight: 1.02,
            maxWidth: 1040,
          }}
        >
          {title}
        </div>
      </div>
      <svg
        width={SHARE_SIZE.width}
        height={150}
        // The middle of the horizon at its own scale, as a wide screen sees it.
        viewBox={`${(PEN_W - SHARE_SIZE.width) / 2} ${PEN_H - 150} ${SHARE_SIZE.width} 150`}
        style={{ display: "flex" }}
      >
        {ridges.map((ridge) => {
          const ink = 0.38 + (0.57 * ridge.depth) / (ridges.length - 1);
          return (
            <g key={ridge.depth}>
              <path d={ridge.fill} fill={BRAND_HEX.background} />
              <path
                d={ridge.line}
                fill="none"
                stroke={BRAND_HEX.accent}
                strokeOpacity={ink}
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
              {ridge.firs.map((fir) => {
                const shape = FIR_DESIGNS[fir.design];
                const [vx, vy, vw, vh] = shape.viewBox.split(" ").map(Number) as [
                  number,
                  number,
                  number,
                  number,
                ];
                const k = fir.h / vh;
                return (
                  <path
                    key={`${fir.x}-${fir.h}`}
                    d={shape.d}
                    fill={BRAND_HEX.accent}
                    fillOpacity={ink}
                    transform={`translate(${fir.x - (vw * k) / 2 - vx * k} ${fir.y - fir.h - vy * k}) scale(${k})`}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>,
    { ...SHARE_SIZE, fonts: fontList },
  );
}
