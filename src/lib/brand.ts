// The site's colours as hex for what cannot read CSS variables: next/og (icons, share images), the
// browser's UI colour (`themeColor`) and global-error.tsx. They follow the palette in globals.css
// by hand: Papier, Tinte, Tinte leise, Himbeere.
export const BRAND_HEX = {
  background: "#fbfaff",
  foreground: "#23194a",
  muted: "#554c7d",
  accent: "#c8235f",
  accentForeground: "#ffffff",
} as const;

// The placeholder mark: the site name's first letter, until a project has its own logo.
export const initialOf = (name: string) => (name.trim().charAt(0) || "W").toUpperCase();
