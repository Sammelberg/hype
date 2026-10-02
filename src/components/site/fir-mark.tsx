import { cn } from "@/lib/utils";

import { FIR_DESIGNS } from "./fir-shapes";

// Brand mark of Schwarzwald Systems: a fir built from three tiers. One path for the header, the
// icons and the share image (next/og renders inline SVG). The mark stands in for initials on
// purpose: the company's initials must never be shown as a monogram.
export const FIR_PATH =
  "M12 1 17.5 8.5H14.8L19.5 15H16.6L21.5 21.5H13.4V23H10.6V21.5H2.5L7.4 15H4.5L9.2 8.5H6.5Z";

export function FirMark({
  className,
  color,
  size,
}: {
  className?: string;
  color?: string;
  /** Pixel size, for next/og, which sizes by attributes rather than classes. */
  size?: number;
}) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} width={size} height={size}>
      <path d={FIR_PATH} fill={color ?? "currentColor"} />
    </svg>
  );
}

/**
 * The logo: our fir „Dicht“ exactly as drawn for the hero forest (fir-shapes.ts), its brush
 * strokes thickened by an outline of their own colour so the drawing still reads at header size.
 * Sized by height; the width follows the drawing (about 0.56 of the height). Below 24px the strokes
 * close up, so the admin and the favicon keep the tiered `FirMark`.
 */
export function FirLogo({ className, weight = 6 }: { className?: string; weight?: number }) {
  return (
    <svg
      viewBox={LOGO.viewBox}
      aria-hidden="true"
      className={cn("aspect-[155/276] h-9 w-auto overflow-visible", className)}
    >
      <path
        d={LOGO.d}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={weight}
        strokeLinejoin="round"
      />
    </svg>
  );
}

const LOGO = FIR_DESIGNS.dicht;

// Brand colours as hex for next/og, which cannot read CSS variables (globals.css holds the tokens).
export const BRAND_HEX = {
  background: "#020510",
  card: "#070f1e",
  foreground: "#f0f4f9",
  muted: "#a2afc1",
  accent: "#93bff0",
} as const;
