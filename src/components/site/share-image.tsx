import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { BRAND_HEX, initialOf } from "@/lib/brand";

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
 * Share image of a page, rendered on our own server with Geist from its local package: the site's
 * mark and name, the page's section above its title, the title large.
 */
export async function shareImage({
  siteName,
  title,
  kicker,
}: {
  siteName: string;
  title: string;
  kicker?: string | null;
}) {
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
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: BRAND_HEX.accent,
            color: BRAND_HEX.accentForeground,
            fontSize: 28,
            fontWeight: 600,
          }}
        >
          {initialOf(siteName)}
        </div>
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
          padding: "0 80px 64px",
        }}
      >
        {kicker ? (
          <div style={{ fontSize: 32, color: BRAND_HEX.muted, marginBottom: 12 }}>{kicker}</div>
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
    </div>,
    { ...SHARE_SIZE, fonts: fontList },
  );
}
