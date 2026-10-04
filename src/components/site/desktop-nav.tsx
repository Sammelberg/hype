"use client";

import { ArrowRightIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import { Verweis } from "@/components/site/verweis";
import { usePathname } from "next/navigation";
import { NavigationMenu as Nav } from "radix-ui";
import { type ComponentProps, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import type { NavSection } from "@/lib/site-nav";
import { cn } from "@/lib/utils";

const inSection = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

// A hairline under the label that opens from the middle on hover and when its menu is open, and
// stays under the section the page belongs to.
const ITEM =
  "group/item relative inline-flex h-11 items-center gap-1 rounded-full px-3 text-sm whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:text-foreground aria-[current=page]:text-foreground 3xl:text-base " +
  "after:absolute after:inset-x-3 after:bottom-1.5 after:h-px after:origin-center after:scale-x-0 after:bg-foreground/40 after:transition-transform after:duration-300 hover:after:scale-x-100 data-[state=open]:after:scale-x-100 motion-reduce:after:transition-none";
const CURRENT = "text-foreground after:scale-x-100 after:bg-primary";

/**
 * The header navigation from lg up: every section (Kontakt is the button at the end), the ones
 * with pages below them as a menu. A menu opens as a panel across the whole header: the section
 * with its first sentence and its overview on the left, its pages with one line each on the
 * right; the page behind it dims. Radix: hover or click opens it, arrow keys move through it,
 * Escape closes it; moving between sections slides the content across while the panel takes the
 * new height. (Radix puts a hidden focus proxy after an open trigger, which axe reports as
 * aria-hidden-focus: Tab lands on it and it hands focus on to the panel's first link at once.)
 */
export function DesktopNav({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState("");
  const kontakt = sections.find((section) => section.href === "/kontakt");

  return (
    <Nav.Root
      value={open}
      onValueChange={setOpen}
      aria-label="Hauptnavigation"
      // Static, so the panel hangs from the header (sticky) and spans it from edge to edge.
      className="static hidden min-w-0 flex-1 items-center gap-2 lg:flex"
    >
      {/* Equal room either side keeps the sections in the middle between the logo and the button. */}
      <div aria-hidden="true" className="flex-1" />
      <Nav.List className="flex items-center gap-0.5 3xl:gap-1.5">
        {sections
          .filter((section) => section !== kontakt)
          .map((section) => {
            const current = inSection(pathname, section.href);
            return (
              <Nav.Item key={section.href} value={section.href}>
                {section.children.length > 0 ? (
                  <>
                    <Nav.Trigger className={cn(ITEM, "pr-2.5", current && CURRENT)}>
                      {section.label}
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="size-3.5 opacity-60 transition-transform duration-300 group-data-[state=open]/item:rotate-180 motion-reduce:transition-none"
                      />
                    </Nav.Trigger>
                    <Nav.Content className="absolute inset-x-0 top-0 data-[motion=from-end]:animate-in data-[motion=from-end]:fade-in data-[motion=from-end]:slide-in-from-right-6 data-[motion=from-start]:animate-in data-[motion=from-start]:fade-in data-[motion=from-start]:slide-in-from-left-6 data-[motion=to-end]:animate-out data-[motion=to-end]:fade-out data-[motion=to-end]:slide-out-to-right-6 data-[motion=to-start]:animate-out data-[motion=to-start]:fade-out data-[motion=to-start]:slide-out-to-left-6 motion-reduce:animate-none">
                      <Panel section={section} pathname={pathname} />
                    </Nav.Content>
                  </>
                ) : (
                  <Nav.Link asChild active={current}>
                    <Verweis
                      href={section.href as never}
                      aria-current={pathname === section.href ? "page" : undefined}
                      className={cn(ITEM, current && CURRENT)}
                    >
                      {section.label}
                    </Verweis>
                  </Nav.Link>
                )}
              </Nav.Item>
            );
          })}
      </Nav.List>

      <div className="flex flex-1 shrink-0 items-center justify-end gap-1.5">
        <Verweis
          href="/suche"
          aria-label="Suche"
          aria-current={pathname === "/suche" ? "page" : undefined}
          className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:text-primary-soft"
        >
          <SearchIcon aria-hidden="true" className="size-4.5" />
        </Verweis>
        <KontaktButton />
      </div>

      {/* The page behind an open menu dims; it is no target, so a click there still closes it. */}
      <div
        aria-hidden="true"
        data-open={open !== "" || undefined}
        className="pointer-events-none absolute inset-x-0 top-full h-dvh bg-background/70 opacity-0 transition-opacity duration-300 motion-reduce:transition-none data-open:opacity-100"
      />
      <div className="absolute inset-x-0 top-full">
        <Nav.Viewport className="relative h-(--radix-navigation-menu-viewport-height) w-full overflow-hidden border-b bg-background shadow-lg transition-[height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none motion-reduce:transition-none" />
      </div>
    </Nav.Root>
  );
}

function Panel({ section, pathname }: { section: NavSection; pathname: string }) {
  return (
    <div className="page-container grid grid-cols-12 gap-x-10 pt-9 pb-11 3xl:pt-12 3xl:pb-14">
      <div className="col-span-4 flex flex-col items-start border-r pr-10">
        <p className="text-2xl font-semibold tracking-[-0.02em] 3xl:text-3xl">{section.label}</p>
        {section.description ? (
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground 3xl:text-base">
            {section.description}
          </p>
        ) : null}
        <Nav.Link asChild active={pathname === section.href}>
          <Verweis
            href={section.href as never}
            aria-current={pathname === section.href ? "page" : undefined}
            className="group/over mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary-soft outline-none focus-visible:underline"
          >
            Übersicht<span className="sr-only"> {section.label}</span>
            <ArrowRightIcon
              aria-hidden="true"
              className="size-4 transition-transform duration-300 group-hover/over:translate-x-1 motion-reduce:transition-none"
            />
          </Verweis>
        </Nav.Link>
      </div>
      <ul className="col-span-8 grid content-start gap-x-4 gap-y-1 xl:grid-cols-2">
        {section.children.map((link) => {
          const current = pathname === link.href;
          return (
            <li key={link.href}>
              <Nav.Link asChild active={current}>
                <Verweis
                  href={link.href as never}
                  aria-current={current ? "page" : undefined}
                  className="group/link block rounded-2xl px-4 py-3.5 transition-colors outline-none hover:bg-card focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="flex items-center gap-2 font-medium group-aria-[current=page]/link:text-primary-soft 3xl:text-lg">
                    {link.label}
                    <ArrowRightIcon
                      aria-hidden="true"
                      className="size-3.5 -translate-x-1 text-primary-soft opacity-0 transition duration-300 group-hover/link:translate-x-0 group-hover/link:opacity-100 motion-reduce:transition-none"
                    />
                  </span>
                  {link.description ? (
                    <span className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground 3xl:text-base">
                      {link.description}
                    </span>
                  ) : null}
                </Verweis>
              </Nav.Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Kontakt as the header's one filled button: what the site is for. */
export function KontaktButton({
  className,
  ...props
}: Omit<ComponentProps<typeof Verweis>, "href">) {
  const current = usePathname() === "/kontakt";
  return (
    <Verweis
      href="/kontakt"
      aria-current={current ? "page" : undefined}
      className={cn(
        buttonVariants(),
        "group/cta h-10 gap-2 rounded-full px-5 text-sm 3xl:h-11 3xl:px-6 3xl:text-base",
        className,
      )}
      {...props}
    >
      Kontakt
      <ArrowRightIcon
        aria-hidden="true"
        className="size-4 transition-transform duration-300 group-hover/cta:translate-x-0.5 motion-reduce:transition-none"
      />
    </Verweis>
  );
}
