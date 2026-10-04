"use client";

import { SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavSection } from "@/lib/site-nav";
import { cn } from "@/lib/utils";

import { KontaktButton } from "./desktop-nav";
import { Wortmarke } from "./wortmarke";

const inSection = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

// Every page of the site below lg, where the header has no room for them. A sheet over the whole
// screen whose top row is the header again — the logo where it was, „Schließen“ where „Menü“ was
// — then the sections, numbered, each with its pages beside one another, and the inquiry as the
// one button at the end. Radix traps focus, closes on Escape and returns focus to the button.
export function MobileMenu({ sections, siteName }: { sections: NavSection[]; siteName: string }) {
  const pathname = usePathname();
  const list = sections.filter((section) => section.href !== "/kontakt");
  const link = (href: string, label: string, className: string) => (
    <SheetClose asChild>
      <Link
        href={href as never}
        aria-current={pathname === href ? "page" : undefined}
        className={cn(
          "transition-colors hover:text-foreground aria-[current=page]:text-primary-soft",
          className,
        )}
      >
        {label}
      </Link>
    </SheetClose>
  );

  return (
    <Sheet>
      <SheetTrigger className="inline-flex min-h-11 items-center gap-3 rounded-full px-2 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        Menü
        <span aria-hidden="true" className="flex w-5 flex-col items-end gap-[5px]">
          <span className="h-px w-5 bg-current" />
          <span className="h-px w-3.5 bg-current" />
        </span>
      </SheetTrigger>
      <SheetContent
        side="top"
        showCloseButton={false}
        overlayClassName="bg-background/60"
        className="h-dvh max-h-dvh gap-0 overflow-y-auto overscroll-contain border-0 bg-background p-0 shadow-none"
      >
        <div className="sticky top-0 z-10 flex h-header shrink-0 items-center justify-between gap-6 border-b bg-background px-gutter">
          <SheetClose asChild>
            <Wortmarke siteName={siteName} />
          </SheetClose>
          <SheetClose className="-mr-2 inline-flex min-h-11 items-center gap-3 rounded-full px-2 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
            Schließen
            <XIcon aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </SheetClose>
        </div>
        <SheetTitle className="sr-only">Menü</SheetTitle>

        <nav aria-label="Seiten" className="px-gutter">
          <ol>
            {list.map((section, i) => {
              const current = inSection(pathname, section.href);
              return (
                <li key={section.href} className="border-b py-4 sm:py-5">
                  <div className="flex items-baseline gap-4">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "w-6 shrink-0 text-xs text-muted-foreground tabular-nums",
                        current && "text-primary-soft",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {link(
                      section.href,
                      section.label,
                      cn(
                        "py-1 text-2xl leading-tight font-semibold tracking-[-0.02em] sm:text-4xl",
                        current && "text-primary-soft",
                      ),
                    )}
                  </div>
                  {section.children.length > 0 ? (
                    <ul className="mt-1 grid gap-x-6 pl-10 sm:grid-cols-2">
                      {section.children.map((child) => (
                        <li key={child.href}>
                          {link(
                            child.href,
                            child.label,
                            "flex min-h-11 items-center text-base text-muted-foreground",
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="flex flex-col gap-4 px-gutter pt-8 pb-10">
          <SheetClose asChild>
            <KontaktButton className="h-12 w-full text-base" />
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/suche"
              aria-current={pathname === "/suche" ? "page" : undefined}
              className="inline-flex min-h-11 items-center gap-2 self-center text-sm text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-primary-soft"
            >
              <SearchIcon aria-hidden="true" className="size-4" />
              Suche
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
