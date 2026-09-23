import { ImageResponse } from "next/og";

import { getSiteSettings } from "@/data/queries";

export const alt = "Vorschaubild";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Rendered on our own server with next/og's bundled font — no external font or image service.
export default async function OpengraphImage() {
  const settings = await getSiteSettings();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: 80,
        background: "#0a0a0a",
        color: "#fafafa",
      }}
    >
      <div style={{ fontSize: 72, fontWeight: 600, letterSpacing: -2 }}>
        {settings.ownerName || settings.siteName || "Portfolio"}
      </div>
      {settings.tagline ? (
        <div style={{ marginTop: 20, fontSize: 32, color: "#a3a3a3" }}>{settings.tagline}</div>
      ) : null}
    </div>,
    size,
  );
}
