import { ImageResponse } from "next/og";

import { getSiteSettings } from "@/data/queries";
import { initials } from "@/lib/initials";

export const alt = "Vorschaubild";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Neutral placeholder colours (next/og cannot read CSS variables): set them with the project's design.
const BACKGROUND = "#ffffff";
const FOREGROUND = "#171717";
const MUTED = "#737373";

// Rendered on our own server with next/og's bundled font — no external font or image service.
export default async function OpengraphImage() {
  const settings = await getSiteSettings();
  const name = settings.ownerName || settings.siteName || "Website";
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: 80,
        background: BACKGROUND,
        color: FOREGROUND,
      }}
    >
      {/* Placeholder monogram, like icon.tsx. Swap for the project's logo once it exists. */}
      <div
        style={{
          width: 160,
          height: 160,
          marginBottom: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 32,
          background: FOREGROUND,
          color: BACKGROUND,
          fontSize: 72,
          fontWeight: 600,
        }}
      >
        {initials(settings.siteName || name)}
      </div>
      <div style={{ fontSize: 72, fontWeight: 600, letterSpacing: -2 }}>{name}</div>
      {settings.tagline ? (
        <div style={{ marginTop: 20, fontSize: 32, color: MUTED }}>{settings.tagline}</div>
      ) : null}
    </div>,
    size,
  );
}
