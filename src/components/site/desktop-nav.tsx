"use client";

import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import type { NavSection } from "@/lib/site-nav";
import { cn } from "@/lib/utils";

const inSection = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

// The header navigation from md up: every section, the ones with pages below them as a menu that
// opens on hover or click (Radix: arrow keys move through it, Escape closes it). A section's own
// overview is the first entry of its menu; the current page and section are marked.
export function DesktopNav({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();

  return (
    <NavigationMenu viewport={false} aria-label="Hauptnavigation" className="hidden md:flex">
      <NavigationMenuList className="gap-1 3xl:gap-2">
        {sections.map((section) => {
          const current = inSection(pathname, section.href);
          const mark =
            current &&
            "text-foreground after:absolute after:inset-x-2.5 after:bottom-1 after:h-px after:bg-primary-soft";
          return (
            <NavigationMenuItem key={section.href}>
              {section.children.length > 0 ? (
                <>
                  <NavigationMenuTrigger
                    className={cn(
                      "relative h-11 bg-transparent font-normal text-muted-foreground hover:text-foreground 3xl:text-base data-open:text-foreground",
                      mark,
                    )}
                  >
                    {section.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="min-w-64 p-2">
                    <ul>
                      {[{ label: "Übersicht", href: section.href }, ...section.children].map(
                        (link) => (
                          <li key={link.href}>
                            <NavigationMenuLink asChild active={pathname === link.href}>
                              <Link
                                href={link.href as never}
                                aria-current={pathname === link.href ? "page" : undefined}
                                className="block px-3 py-2 text-sm whitespace-nowrap data-active:text-primary-soft"
                              >
                                {link.label}
                                {link.href === section.href ? (
                                  <span className="sr-only"> {section.label}</span>
                                ) : null}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ),
                      )}
                    </ul>
                  </NavigationMenuContent>
                </>
              ) : (
                <NavigationMenuLink asChild active={current}>
                  <Link
                    href={section.href as never}
                    aria-current={pathname === section.href ? "page" : undefined}
                    className={cn(
                      "relative inline-flex h-11 items-center rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground 3xl:text-base",
                      mark,
                    )}
                  >
                    {section.label}
                  </Link>
                </NavigationMenuLink>
              )}
            </NavigationMenuItem>
          );
        })}
        <NavigationMenuItem>
          <NavigationMenuLink asChild active={pathname === "/suche"}>
            <Link
              href="/suche"
              aria-label="Suche"
              aria-current={pathname === "/suche" ? "page" : undefined}
              className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
            >
              <SearchIcon aria-hidden="true" className="size-4.5" />
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
