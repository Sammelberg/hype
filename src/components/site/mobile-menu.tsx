"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { SITE_GROUPS } from "./menu-links";
import { pauseSmoothScroll } from "./smooth-scroll";

// The site's pages on phones, where the header only has room for the contact link. A sheet from
// the top: Radix traps focus, closes on Escape and returns focus to the button; Lenis pauses so
// the page behind it holds still.
export function MobileMenu() {
  const pathname = usePathname();

  return (
    <Sheet onOpenChange={pauseSmoothScroll}>
      <SheetTrigger className="-mr-2 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <MenuIcon aria-hidden="true" className="size-5" />
        Menü
      </SheetTrigger>
      <SheetContent
        side="top"
        className="max-h-dvh overflow-y-auto overscroll-contain border-b bg-background px-gutter pt-5 pb-10"
      >
        <SheetTitle className="text-sm font-medium text-muted-foreground">Menü</SheetTitle>
        <nav aria-label="Seiten" className="mt-4 grid gap-8">
          {SITE_GROUPS.map((group) => (
            <div key={group.label}>
              <h2 className="text-sm text-primary-soft">{group.label}</h2>
              <ul className="mt-2">
                {group.links.map((link) => {
                  const current = pathname === link.href;
                  return (
                    <li key={link.href}>
                      <SheetClose asChild>
                        <Link
                          href={link.href as never}
                          aria-current={current ? "page" : undefined}
                          className={cn(
                            "block py-2 text-3xl font-semibold tracking-tight transition-colors hover:text-primary-soft",
                            current &&
                              "text-primary-soft underline decoration-2 underline-offset-8",
                          )}
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <SheetClose asChild>
            <Link
              href="/suche"
              className="inline-flex min-h-11 items-center text-lg text-muted-foreground underline decoration-primary-soft underline-offset-4 hover:text-foreground"
            >
              Suche
            </Link>
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
