"use client";

import { LocateFixedIcon } from "lucide-react";
import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PreviewHandle } from "./preview-pane";

// A document editor is a column of section cards, one per part of the page, in the order the
// page shows them. Working in a card (focus or click) scrolls the preview beside it to that part
// and outlines it there; the index above the cards jumps between them.

export type SectionInfo = {
  /** Anchor of the card (`#abschnitt-…`). */
  id: string;
  title: string;
  /** The part of the page (`data-cms-zone`); none for what the page does not show (SEO). */
  zone?: string;
};

type Focus = {
  active: string | null;
  activate: (section: SectionInfo, again?: boolean) => void;
};
const SectionFocus = createContext<Focus>({ active: null, activate: () => {} });

export function SectionFocusProvider({
  preview,
  children,
}: {
  preview: RefObject<PreviewHandle | null>;
  children: ReactNode;
}) {
  const [active, setActive] = useState<string | null>(null);
  const activate = useCallback(
    (section: SectionInfo, again = false) => {
      setActive(section.id);
      preview.current?.focus(section.zone ?? null, section.title, again);
    },
    [preview],
  );
  const value = useMemo(() => ({ active, activate }), [active, activate]);
  return <SectionFocus.Provider value={value}>{children}</SectionFocus.Provider>;
}

const anchor = (id: string) => `abschnitt-${id}`;

export function SectionCard({
  section,
  description,
  action,
  children,
  className,
}: {
  section: SectionInfo;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const { active, activate } = useContext(SectionFocus);
  const isActive = active === section.id;
  const titleId = `${anchor(section.id)}-titel`;
  return (
    <Card
      id={anchor(section.id)}
      role="region"
      aria-labelledby={titleId}
      data-active={isActive || undefined}
      onFocusCapture={() => !isActive && activate(section)}
      onPointerDown={() => !isActive && activate(section)}
      className={cn(
        "scroll-mt-32 transition-[box-shadow] duration-200 data-active:ring-2 data-active:ring-primary/60",
        className,
      )}
    >
      <CardHeader>
        <CardTitle id={titleId} className="text-base font-semibold">
          {section.title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-pretty">{description}</CardDescription>
        ) : null}
        <CardAction className="flex items-center gap-1">
          {action}
          {section.zone ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`${section.title} in der Vorschau zeigen`}
              onClick={() => activate(section, true)}
              className="hidden xl:inline-flex"
            >
              <LocateFixedIcon />
            </Button>
          ) : null}
        </CardAction>
      </CardHeader>
      {children ? <CardContent className="flex flex-col gap-5">{children}</CardContent> : null}
    </Card>
  );
}

// The sections of the document as a row of jump links; the one being edited is marked.
export function SectionIndex({
  sections,
  invalid = [],
}: {
  sections: SectionInfo[];
  /** Ids of sections with a field that needs attention. */
  invalid?: string[];
}) {
  const { active, activate } = useContext(SectionFocus);
  return (
    <nav aria-label="Abschnitte" className="-mx-1 -mb-1 overflow-x-auto px-1 pb-1">
      <ul role="list" className="flex w-max gap-1.5">
        {sections.map((section) => {
          const current = active === section.id;
          const hasError = invalid.includes(section.id);
          return (
            <li key={section.id}>
              <a
                href={`#${anchor(section.id)}`}
                aria-current={current ? "true" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  const card = document.getElementById(anchor(section.id));
                  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                  card?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
                  activate(section, true);
                  card?.querySelector<HTMLElement>("input, textarea, [contenteditable]")?.focus({
                    preventScroll: true,
                  });
                }}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                  current && "border-primary bg-accent text-accent-foreground hover:bg-accent",
                )}
              >
                {section.title}
                {hasError ? (
                  <>
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-destructive" />
                    <span className="sr-only">(bitte prüfen)</span>
                  </>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
