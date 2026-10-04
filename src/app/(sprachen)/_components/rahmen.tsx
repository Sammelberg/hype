import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { ReactNode } from "react";

import { Verweis } from "@/components/site/verweis";
import { Wortmarke } from "@/components/site/wortmarke";
import { getSiteSettings } from "@/data/queries";
import { cn } from "@/lib/utils";

import { TEXTE, type Fremdsprache } from "../_lib/texte";

// The frame of a landing page in another language: its own <html lang>, the site's tokens and
// fonts, a small head with the way to the other languages, and a foot with the legal pages (which
// are German). The German site's navigation stays out: its pages are German.

const SPRACHEN = [
  { href: "/", lang: "de", name: "Deutsch" },
  { href: "/uk", lang: "uk", name: "Українська" },
  { href: "/ru", lang: "ru", name: "Русский" },
] as const;

const ZUM_INHALT: Record<Fremdsprache, string> = { uk: "До змісту", ru: "К содержанию" };

export async function SprachRahmen({
  sprache,
  children,
}: {
  sprache: Fremdsprache;
  children: ReactNode;
}) {
  const t = TEXTE[sprache];
  const settings = await getSiteSettings();
  const siteName = settings.siteName || "Hype Agency";
  return (
    <html
      lang={t.lang}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-dvh flex-col bg-background text-foreground antialiased">
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2"
        >
          {ZUM_INHALT[sprache]}
        </a>
        <header className="border-b">
          <div className="page-container flex min-h-header flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
            <Wortmarke siteName={siteName} />
            <nav aria-label={t.sprachwahl}>
              <ul className="flex gap-1">
                {SPRACHEN.map((s) => (
                  <li key={s.lang}>
                    <Verweis
                      href={s.href as never}
                      lang={s.lang}
                      hrefLang={s.lang}
                      aria-current={s.lang === sprache ? "page" : undefined}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-full px-3 text-sm",
                        s.lang === sprache
                          ? "bg-secondary font-medium"
                          : "underline-offset-4 hover:underline",
                      )}
                    >
                      {s.name}
                    </Verweis>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>
        <div id="inhalt" className="flex-1">
          {children}
        </div>
        <footer className="border-t bg-muted/30">
          <div className="page-container flex flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
            <p>© {siteName}</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              <li>
                <Verweis
                  href={"/impressum" as never}
                  lang="de"
                  className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                >
                  Impressum ({t.rechtliches})
                </Verweis>
              </li>
              <li>
                <Verweis
                  href={"/datenschutz" as never}
                  lang="de"
                  className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                >
                  Datenschutz ({t.rechtliches})
                </Verweis>
              </li>
            </ul>
          </div>
        </footer>
      </body>
    </html>
  );
}
