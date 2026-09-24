// Brand mark of Schwarzwald Systems: a fir built from three tiers. One path for the header, the
// icons and the share image (next/og renders inline SVG). The mark stands in for initials on
// purpose: the company's initials must never be shown as a monogram.
export const FIR_PATH =
  "M12 1 17.5 8.5H14.8L19.5 15H16.6L21.5 21.5H13.4V23H10.6V21.5H2.5L7.4 15H4.5L9.2 8.5H6.5Z";

export function FirMark({ className, color }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d={FIR_PATH} fill={color ?? "currentColor"} />
    </svg>
  );
}

// Brand colours as hex for next/og, which cannot read CSS variables (globals.css holds the tokens).
export const BRAND_HEX = {
  background: "#040813",
  card: "#070f1e",
  foreground: "#f0f4f9",
  muted: "#a2afc1",
  accent: "#81b4f6",
} as const;
