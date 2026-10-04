import { getSiteNav } from "@/data/queries";

import { DesktopNav, KontaktButton } from "./desktop-nav";
import { MobileMenu } from "./mobile-menu";
import { Wortmarke } from "./wortmarke";

// Sticky bar across the full width: the logo, then every page of the site — as menus from lg up,
// behind the menu button below. Its height is the `header` spacing token, which scroll-margin in
// globals.css offsets against.
export async function SiteHeader({ siteName }: { siteName: string }) {
  const sections = await getSiteNav();

  return (
    <header
      className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur"
      data-cms-zone="kopfleiste"
    >
      <div className="flex h-header w-full items-center gap-6 px-gutter">
        <Wortmarke siteName={siteName} className="mr-auto lg:mr-0" />
        <DesktopNav sections={sections} />
        <KontaktButton className="max-sm:hidden lg:hidden" />
        <div className="-mr-2 lg:hidden">
          <MobileMenu sections={sections} siteName={siteName} />
        </div>
      </div>
    </header>
  );
}
