"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavSection } from "@/lib/site-nav";
import { cn } from "@/lib/utils";

import { pauseSmoothScroll } from "./smooth-scroll";

// Every page of the site on phones, where the header has no room for them. A sheet from the top:
// Radix traps focus, closes on Escape and returns focus to the button; Lenis pauses so the page
// behind it holds still.
export function MobileMenu({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const link = (href: string, label: string, className: string) => {
    const current = pathname === href;
    return (
      <SheetClose asChild>
        <Link
          href={href as never}
          aria-current={current ? "page" : undefined}
          className={cn(
            "block transition-colors hover:text-primary-soft",
            className,
            current && "text-primary-soft underline decoration-2 underline-offset-8",
          )}
        >
          {label}
        </Link>
      </SheetClose>
    );
  };

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
        <nav aria-label="Seiten" className="mt-2">
          <ul className="grid gap-6">
            {sections.map((section) => (
              <li key={section.href}>
                {link(section.href, section.label, "py-1 text-3xl font-semibold tracking-tight")}
                {section.children.length > 0 ? (
                  <ul className="mt-1 border-l border-primary-soft/40 pl-4">
                    {section.children.map((child) => (
                      <li key={child.href}>
                        {link(child.href, child.label, "py-2 text-lg text-muted-foreground")}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
            <li>{link("/suche", "Suche", "py-1 text-lg text-muted-foreground")}</li>
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
