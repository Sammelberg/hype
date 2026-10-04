import { ImageResponse } from "next/og";

import { BRAND_HEX, initialOf } from "@/lib/brand";
import { getSiteSettings } from "@/data/queries";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Placeholder: the site name's first letter, rendered locally. A project replaces it with its
// designed `apple-icon.png`.
export default async function AppleIcon() {
  const { siteName } = await getSiteSettings();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 0,
        background: BRAND_HEX.accent,
        color: BRAND_HEX.accentForeground,
        fontSize: 110,
        fontWeight: 600,
      }}
    >
      {initialOf(siteName || "Website")}
    </div>,
    size,
  );
}
