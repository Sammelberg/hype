import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { draftMode } from "next/headers";
import type { ReactNode } from "react";

import { ReticleDev } from "@/components/dev/reticle-dev";
import { RefreshOnSave } from "@/components/site/refresh-on-save";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { env } from "@/env";
import { getSiteSettings } from "@/data/queries";

import "./globals.css";

// Browser UI colour matches --background; the site is dark-only (globals.css).
export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.siteName || "Website";
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SERVER_URL),
    title: { default: siteName, template: `%s — ${siteName}` },
    description: settings.description ?? undefined,
    openGraph: { siteName, locale: "de_DE", type: "website" },
  };
}

export default async function FrontendLayout({ children }: { children: ReactNode }) {
  const [settings, draft] = await Promise.all([getSiteSettings(), draftMode()]);
  return (
    <html
      lang="de"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      // Route changes jump instantly; globals.css smooth scrolling is for in-page anchors only.
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-dvh flex-col bg-background text-foreground antialiased">
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2"
        >
          Zum Inhalt springen
        </a>
        <SiteHeader
          siteName={settings.siteName || "Website"}
          contactEmail={settings.contactEmail}
          socialLinks={settings.socialLinks}
        />
        <div id="inhalt" className="flex-1">
          {children}
        </div>
        <SiteFooter
          ownerName={settings.ownerName || settings.siteName || "Website"}
          contactEmail={settings.contactEmail}
          socialLinks={settings.socialLinks}
        />
        {draft.isEnabled ? (
          <>
            <RefreshOnSave serverURL={env.NEXT_PUBLIC_SERVER_URL} />
            {/* Route handler that clears the draft-mode cookie: needs a full navigation, not <Link>. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/next/exit-preview"
              className="fixed right-4 bottom-4 rounded-md bg-foreground px-3 py-2 text-sm text-background"
            >
              Vorschau beenden
            </a>
          </>
        ) : null}
        {process.env.NODE_ENV === "development" ? <ReticleDev /> : null}
      </body>
    </html>
  );
}
