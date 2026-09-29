import Link from "next/link";

import { cn } from "@/lib/utils";

import { FirMark } from "./fir-mark";
import { MENU_LINKS } from "./menu-links";
import { NavLink } from "./nav-link";

// Sticky bar across the full width (fluid side gutter, wider than the page column): fir mark and
// wordmark, the main navigation. Its height is the `header` spacing token, which scroll-margin in
// globals.css offsets against.
export function SiteHeader({ siteName }: { siteName: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="flex h-header w-full items-center justify-between gap-5 px-gutter">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight 3xl:text-lg"
        >
          <FirMark className="size-6 text-primary-soft 3xl:size-7" />
          <span className="truncate">{siteName}</span>
        </Link>
        <nav aria-label="Hauptnavigation">
          <ul className="flex items-center gap-6 text-sm 3xl:gap-8 3xl:text-base">
            {MENU_LINKS.map((link) => (
              <li key={link.href} className={cn(link.wide && "hidden sm:block")}>
                <NavLink href={link.href}>{link.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
