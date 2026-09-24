import { ImageResponse } from "next/og";

import { BRAND_HEX, FirMark } from "@/components/site/fir-mark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// The fir mark in resin amber on the night background, rendered locally.
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        background: BRAND_HEX.background,
      }}
    >
      <FirMark color={BRAND_HEX.accent} />
    </div>,
    size,
  );
}
