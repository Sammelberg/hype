// Embedded fonts of the invoice PDF. PDF/A-3b (ISO 19005-3, 6.2.11.4.1) requires every font to be
// embedded; react-pdf's built-in Helvetica never is, and it resolves the standard-14 names before
// anything registered — so the template names "LiberationSans" explicitly. Liberation Sans is
// metrically compatible with Helvetica, SIL OFL 1.1 (schriften/OFL.txt). From port.
//
// Registered as a side effect: importing this module installs the faces.
import { join } from "node:path";

import { Font } from "@react-pdf/renderer";

export const FONT_FAMILY = "LiberationSans";

// Resolved from the project root (Next, Vitest and scripts all run there); next.config.ts traces
// the folder into the standalone build.
export const FONT_DIR = join(process.cwd(), "src", "buero", "pdf", "schriften");

Font.register({
  family: FONT_FAMILY,
  fonts: [
    { src: join(FONT_DIR, "LiberationSans-Regular.ttf") },
    { src: join(FONT_DIR, "LiberationSans-Bold.ttf"), fontWeight: "bold" },
    { src: join(FONT_DIR, "LiberationSans-Italic.ttf"), fontStyle: "italic" },
  ],
});

// react-pdf's hyphenator does not know German and breaks compounds at wrong points.
Font.registerHyphenationCallback((word) => [word]);
