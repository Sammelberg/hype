import type { ReactNode } from "react";

// One part of a page below its header: the heading on the left, staying in view, the content on the
// right. Service sections and the h2 parts of content pages share it, so every page below its header
// reads as one calm dossier, not a stack of boxes.
const heading =
  "text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:sticky lg:top-[calc(var(--spacing-header)+2rem)] lg:self-start 3xl:text-5xl";

export function Part({
  id,
  title,
  zone,
  children,
}: {
  id: string;
  title: string;
  zone?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-t" data-cms-zone={zone}>
      <div className="page-container grid gap-10 py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
        <h2 id={id} className={heading}>
          {title}
        </h2>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
