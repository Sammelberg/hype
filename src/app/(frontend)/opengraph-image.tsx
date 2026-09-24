import { ImageResponse } from "next/og";

import { BRAND_HEX, FirMark } from "@/components/site/fir-mark";
import { getSiteSettings } from "@/data/queries";

export const alt = "Schwarzwald Systems – Individuelle Software für den Mittelstand";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Rendered on our own server with next/og's bundled font — no external font or image service.
export default async function OpengraphImage() {
  const settings = await getSiteSettings();
  const name = settings.siteName || "Schwarzwald Systems";
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: 80,
        background: BRAND_HEX.background,
        color: BRAND_HEX.foreground,
      }}
    >
      <div style={{ width: 120, height: 120, marginBottom: 48, display: "flex" }}>
        <FirMark color={BRAND_HEX.accent} />
      </div>
      <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: -2 }}>{name}</div>
      {settings.tagline ? (
        <div style={{ marginTop: 20, fontSize: 34, color: BRAND_HEX.muted }}>
          {settings.tagline}
        </div>
      ) : null}
    </div>,
    size,
  );
}
