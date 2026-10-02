import { getSiteNav } from "@/data/queries";

import { DesktopNav, KontaktButton } from "./desktop-nav";
import { MobileMenu } from "./mobile-menu";
import styles from "./site-header.module.css";
import { Wortmarke } from "./wortmarke";

// Sticky bar across the full width (fluid side gutter, wider than the page column): the logo —
// our drawn fir and the name — then every page of the site, as menus from lg up, behind the menu
// button below. Between lg and xl the navigation needs the room, so the name steps back to the fir
// alone (still read out as the link's name). Its bottom edge fills with ice as the page is read.
// Its height is the `header` spacing token, which scroll-margin in globals.css offsets against.
export async function SiteHeader({ siteName }: { siteName: string }) {
  const sections = await getSiteNav();

  return (
    <header
      className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md"
      data-cms-zone="kopfleiste"
    >
      <div className="flex h-header w-full items-center gap-6 px-gutter xl:gap-10">
        <Wortmarke siteName={siteName} short className="mr-auto lg:mr-0" />
        <DesktopNav sections={sections} />
        <KontaktButton className="max-sm:hidden lg:hidden" />
        <div className="-mr-2 lg:hidden">
          <MobileMenu sections={sections} siteName={siteName} />
        </div>
      </div>
      <span aria-hidden="true" className={styles.progress} />
    </header>
  );
}
