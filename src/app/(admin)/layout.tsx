import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { ReticleDev } from "@/components/dev/reticle-dev";
import { Toaster } from "@/components/ui/sonner";

import "./admin.css";

// The admin's own root layout: its tokens (admin.css) never meet the site's, and the site's
// header, footer and smooth scrolling stay out of the editor.
export const metadata: Metadata = {
  title: { default: "Verwaltung", template: "%s · Verwaltung" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbf9" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1e1d" },
  ],
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="de"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" closeButton />
          {process.env.NODE_ENV === "development" ? <ReticleDev /> : null}
        </ThemeProvider>
      </body>
    </html>
  );
}
