import { ImageResponse } from "next/og";

import { initials } from "@/lib/initials";
import { getSiteSettings } from "@/lib/queries";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Placeholder monogram from the owner's initials, rendered locally. Replace with a designed icon
// (app/(frontend)/icon.svg) once the visual identity exists.
export default async function Icon() {
  const settings = await getSiteSettings();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        background: "#171717",
        color: "#fafafa",
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: -0.5,
      }}
    >
      {initials(settings.ownerName || settings.siteName || "")}
    </div>,
    size,
  );
}
