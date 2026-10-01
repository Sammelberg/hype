import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// One part of a page below its header: the heading on the left, staying in view, the content on the
// right. Service sections and the h2 parts of content pages share it, so every page below its header
// reads as one calm dossier, not a stack of boxes. From lg up a hairline between the two fills with
// ice while the part is read (motion.css, sd-read): where one is in a long page, at a glance.
export function Part({
  id,
  title,
  zone,
  aside,
  line = true,
  className,
  children,
}: {
  id: string;
  title: string;
  zone?: string;
  /** Under the sticky heading, travelling with it (a count, a short note). */
  aside?: ReactNode;
  /** The reading line; off where the content draws a line of its own (a trail). */
  line?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn("border-t sd-part", className)}
      data-cms-zone={zone}
    >
      <div className="page-container grid gap-10 py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
        <div className="lg:sticky lg:top-[calc(var(--spacing-header)+2rem)] lg:self-start">
          <h2
            id={id}
            className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl 3xl:text-5xl"
          >
            {title}
          </h2>
          {aside}
        </div>
        <div className="relative min-w-0">
          {line ? (
            <span
              aria-hidden="true"
              className="absolute inset-y-0 -left-8 hidden w-px bg-border lg:block"
            >
              <span className="block size-full sd-read origin-top bg-primary-soft/70" />
            </span>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  );
}
