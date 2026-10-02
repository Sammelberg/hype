import Link from "next/link";

import { getSiteNav } from "@/data/queries";

import { DesktopNav } from "./desktop-nav";
import { FirMark } from "./fir-mark";
import { MobileMenu } from "./mobile-menu";

// Sticky bar across the full width (fluid side gutter, wider than the page column): fir mark and
// wordmark, then every page of the site — as menus from lg up, behind the menu button below. Between
// lg and xl the navigation needs the room, so the wordmark steps back to the fir alone (still read
// out as the link's name).
// Its height is the `header` spacing token, which scroll-margin in globals.css offsets against.
export async function SiteHeader({ siteName }: { siteName: string }) {
  const sections = await getSiteNav();

  return (
    <header
      className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md"
      data-cms-zone="kopfleiste"
    >
      <div className="flex h-header w-full items-center justify-between gap-5 px-gutter">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight 3xl:text-lg"
        >
          <FirMark className="size-6 text-primary-soft 3xl:size-7" />
          <span className="truncate lg:max-xl:sr-only">{siteName}</span>
        </Link>
        <DesktopNav sections={sections} />
        <div className="lg:hidden">
          <MobileMenu sections={sections} />
        </div>
      </div>
    </header>
  );
}
