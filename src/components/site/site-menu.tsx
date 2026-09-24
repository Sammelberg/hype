"use client";

import { ArrowUpRightIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { pauseSmoothScroll } from "@/lib/smooth-scroll";

import { MENU_LINKS } from "./menu-links";

type Social = { label: string; url: string; id?: string | null };

// The main navigation as a sheet from the right, over a blurred page. Radix Dialog underneath:
// focus trap, Esc, focus returns to the button, scroll lock (plus Lenis paused while open).
export function SiteMenu({
  contactEmail,
  socialLinks,
}: {
  contactEmail?: string | null;
  socialLinks?: Social[] | null;
}) {
  const pathname = usePathname();

  return (
    <Sheet onOpenChange={pauseSmoothScroll}>
      <SheetTrigger className="group/menu inline-flex h-11 items-center gap-3 rounded-full border border-border pr-4 pl-5 text-sm font-medium outline-offset-2 transition-[border-color,color,scale] duration-150 ease-(--ease-out) hover:border-primary hover:text-primary active:scale-[0.97] sm:text-base">
        Menü
        <span aria-hidden className="flex w-5 flex-col items-end gap-1.5">
          <span className="h-0.5 w-5 rounded-full bg-current" />
          <span className="h-0.5 w-5 origin-right scale-x-60 rounded-full bg-current transition-transform duration-200 ease-(--ease-out) pointer-fine:group-hover/menu:scale-x-100" />
        </span>
      </SheetTrigger>

      <SheetContent
        side="right"
        showCloseButton={false}
        aria-describedby={undefined}
        overlayClassName="bg-background/50 duration-500 data-closed:duration-300 supports-backdrop-filter:backdrop-blur-md"
        className="gap-0 border-border/60 bg-background/90 p-0 duration-500 ease-(--ease-drawer) data-[side=right]:w-full supports-backdrop-filter:backdrop-blur-xl data-[side=right]:sm:max-w-xl data-[side=right]:data-open:slide-in-from-right data-closed:duration-300 data-[side=right]:data-closed:slide-out-to-right"
      >
        <div className="flex h-header shrink-0 items-center justify-between gap-fib-md px-fib-md sm:px-fib-lg">
          <SheetTitle className="text-sm font-medium text-muted-foreground">Menü</SheetTitle>
          <SheetClose className="inline-flex h-11 items-center gap-2 rounded-full border border-border pr-3 pl-5 text-sm font-medium outline-offset-2 transition-[border-color,color,scale] duration-150 ease-(--ease-out) hover:border-primary hover:text-primary active:scale-[0.97] sm:text-base">
            Schließen
            <XIcon aria-hidden className="size-5" />
          </SheetClose>
        </div>

        <nav
          aria-label="Hauptnavigation"
          className="flex-1 overflow-y-auto px-fib-md py-fib-xl sm:px-fib-lg"
        >
          <ul className="grid gap-fib-xs">
            {MENU_LINKS.map((link, i) => {
              const current = link.href === pathname;
              return (
                <li
                  key={link.href}
                  className="animate-in duration-500 ease-(--ease-out) fill-mode-both fade-in slide-in-from-bottom-4 motion-reduce:[--tw-enter-translate-y:0]"
                  style={{ animationDelay: `${150 + i * 50}ms` }}
                >
                  <SheetClose asChild>
                    <Link
                      href={link.href as never}
                      aria-current={current ? "page" : undefined}
                      className="group/link flex items-center justify-between gap-fib-md rounded-lg py-2 text-5xl font-semibold tracking-tighter outline-offset-4 transition-colors duration-200 hover:text-primary aria-[current=page]:text-primary sm:text-6xl"
                    >
                      {link.label}
                      <ArrowUpRightIcon
                        aria-hidden
                        className="size-8 shrink-0 -translate-x-2 translate-y-2 opacity-0 transition-[opacity,translate] duration-200 ease-(--ease-out) group-focus-visible/link:translate-0 group-focus-visible/link:opacity-100 sm:size-10 pointer-fine:group-hover/link:translate-0 pointer-fine:group-hover/link:opacity-100"
                      />
                    </Link>
                  </SheetClose>
                </li>
              );
            })}
          </ul>
        </nav>

        {contactEmail || socialLinks?.length ? (
          <div className="grid shrink-0 animate-in gap-fib-sm border-t border-border/60 px-fib-md py-fib-lg delay-400 duration-500 ease-(--ease-out) fill-mode-both fade-in sm:px-fib-lg">
            <p className="text-sm text-muted-foreground">Kontakt</p>
            {contactEmail ? (
              <a
                href={`mailto:${contactEmail}`}
                className="w-fit text-xl font-medium underline decoration-border underline-offset-8 transition-[text-decoration-color,color] duration-200 hover:text-primary hover:decoration-primary"
              >
                {contactEmail}
              </a>
            ) : null}
            {socialLinks?.length ? (
              <ul className="flex flex-wrap gap-x-fib-md gap-y-2 text-sm text-muted-foreground">
                {socialLinks.map((s) => (
                  <li key={s.id ?? s.url}>
                    <a
                      href={s.url}
                      rel="me noopener"
                      className="transition-colors hover:text-primary"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
