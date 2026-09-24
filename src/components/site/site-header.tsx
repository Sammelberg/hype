import Link from "next/link";

import { cn } from "@/lib/utils";

import { FirMark } from "./fir-mark";
import { MENU_LINKS } from "./menu-links";

// Sticky bar: fir mark and wordmark, the main navigation. Its height is the `header` spacing
// token, which scroll-margin in globals.css offsets against.
export function SiteHeader({ siteName }: { siteName: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="page-container flex h-header items-center justify-between gap-5">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <FirMark className="size-6 text-primary-soft" />
          <span className="truncate">{siteName}</span>
        </Link>
        <nav aria-label="Hauptnavigation">
          <ul className="flex items-center gap-6 text-sm">
            {MENU_LINKS.map((link) => (
              <li key={link.href} className={cn(link.wide && "hidden sm:block")}>
                <Link
                  href={link.href as never}
                  className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
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
