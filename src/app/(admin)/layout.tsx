import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { ReactNode } from "react";

import { ReticleDev } from "@/components/dev/reticle-dev";
import { Toaster } from "@/components/ui/sonner";
import { THEME_SCRIPT, ThemeProvider } from "./_theme/theme";

import "./admin.css";

// The admin's own root layout: its tokens (admin.css) never meet the site's, and the site's
// header, footer and smooth scrolling stay out of the editor.
export const metadata: Metadata = {
  title: { default: "Verwaltung", template: "%s · Verwaltung" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  // Deep Space background (admin.css .dark), the default whatever the device prefers.
  themeColor: "#040915",
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="de"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the remembered theme before the first paint (the CSP allows inline scripts). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" closeButton />
          {process.env.NODE_ENV === "development" ? <ReticleDev /> : null}
        </ThemeProvider>
      </body>
    </html>
  );
}
