import { ImageResponse } from "next/og";

import { BRAND_HEX, FirMark } from "@/components/site/fir-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS adds its own rounded mask, so the square stays unrounded.
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_HEX.background,
      }}
    >
      <div style={{ width: 112, height: 112, display: "flex" }}>
        <FirMark color={BRAND_HEX.accent} />
      </div>
    </div>,
    size,
  );
}
