import Link from "next/link";

import { MENU_LINKS } from "./menu-links";

// Sticky bar with the site name and the main navigation. Deliberately plain: each project designs
// its own header (and a menu, if it needs one). Its height is the `header` spacing token, which
// scroll-margin in globals.css offsets against.
export function SiteHeader({ siteName }: { siteName: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="page-container flex h-header items-center justify-between gap-5">
        {/* Wordmark placeholder: add the project's logo here (public/, next/image with preload). */}
        <Link href="/" className="truncate font-semibold">
          {siteName}
        </Link>
        <nav aria-label="Hauptnavigation">
          <ul className="flex gap-5 text-sm">
            {MENU_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href as never}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
