import Image from "next/image";
import Link from "next/link";

import logoMark from "../../../public/brand/logo-mark.png";
import { MENU_LINKS } from "./menu-links";
import { SiteMenu } from "./site-menu";

type Social = { label: string; url: string; id?: string | null };

// Sticky bar that stays on top while scrolling. Bar and contents run edge to edge (no page column).
// Its height is the `header` spacing token, which sticky sections and html's scroll-padding-top
// offset against (globals.css).
export function SiteHeader({
  siteName,
  contactEmail,
  socialLinks,
}: {
  siteName: string;
  contactEmail?: string | null;
  socialLinks?: Social[] | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="flex h-header w-full items-center justify-between gap-fib-md px-fib-md sm:px-fib-lg">
        <Link href="/" className="flex items-center gap-3 text-lg font-medium tracking-tight">
          <Image src={logoMark} alt="" className="size-9 sm:size-11" preload />
          {siteName}
        </Link>
        <SiteMenu contactEmail={contactEmail} socialLinks={socialLinks} />
        {/* Without JavaScript the menu button cannot open: plain links instead. */}
        <noscript>
          <nav aria-label="Hauptnavigation">
            <ul className="flex gap-fib-md text-sm">
              {MENU_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href as never}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </noscript>
      </div>
    </header>
  );
}
