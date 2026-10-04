import "@fontsource-variable/shantell-sans/infm.css";
import "../../(frontend)/globals.css";

import type { Viewport } from "next";
import type { ReactNode } from "react";

import { BRAND_HEX } from "@/lib/brand";

import { SprachRahmen } from "../_components/rahmen";

// Root layout of /uk: its own <html lang="uk"> (a root layout per language, no i18n layer).
export const viewport: Viewport = { themeColor: BRAND_HEX.background, colorScheme: "light" };

export default function Layout({ children }: { children: ReactNode }) {
  return <SprachRahmen sprache="uk">{children}</SprachRahmen>;
}
