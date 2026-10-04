// The site's colours as hex for what cannot read CSS variables: next/og (icons, share images), the
// browser's UI colour (`themeColor`) and global-error.tsx. Neutral in the template; when a project
// gets its palette in globals.css, these follow by hand.
export const BRAND_HEX = {
  background: "#ffffff",
  foreground: "#0a0a0a",
  muted: "#636363",
  accent: "#171717",
  accentForeground: "#fafafa",
} as const;

// The placeholder mark: the site name's first letter, until a project has its own logo.
export const initialOf = (name: string) => (name.trim().charAt(0) || "W").toUpperCase();
