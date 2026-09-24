import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { getSiteSettings } from "@/data/queries";

export const alt = "Vorschaubild";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Rendered on our own server with next/og's bundled font — no external font or image service.
export default async function OpengraphImage() {
  const [settings, mark] = await Promise.all([
    getSiteSettings(),
    readFile(join(process.cwd(), "public/brand/logo-mark.png"), "base64"),
  ]);
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
      <img
        src={`data:image/png;base64,${mark}`}
        width={160}
        height={160}
        alt=""
        style={{ marginBottom: 48 }}
      />
      <div style={{ fontSize: 72, fontWeight: 600, letterSpacing: -2 }}>
        {settings.ownerName || settings.siteName || "Portfolio"}
      </div>
      {settings.tagline ? (
        <div style={{ marginTop: 20, fontSize: 32, color: "#01ccff" }}>{settings.tagline}</div>
      ) : null}
    </div>,
    size,
  );
}
