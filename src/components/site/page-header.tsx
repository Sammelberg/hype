import type { ReactNode } from "react";

/**
 * Head of every page besides the home page: breadcrumbs, a short line above the heading (what the
 * page belongs to), the heading and its lead. Plain on purpose: a project gives it its own form.
 */
export function PageHeader({
  title,
  lead,
  kicker,
  breadcrumbs,
  children,
}: {
  title: ReactNode;
  lead?: ReactNode;
  /** A short line above the heading that says what the page belongs to (a project's client). */
  kicker?: ReactNode;
  breadcrumbs?: ReactNode;
  /** Extra content under the lead, such as a search form. */
  children?: ReactNode;
}) {
  return (
    <div className="border-b" data-cms-zone="kopf">
      <div className="page-container pt-12 pb-12 sm:pt-16 sm:pb-16">
        {breadcrumbs ? <div className="mb-8">{breadcrumbs}</div> : null}
        {kicker ? <p className="mb-3 font-medium text-muted-foreground">{kicker}</p> : null}
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance hyphens-auto sm:text-5xl">
          {title}
        </h1>
        {lead ? (
          <div className="mt-5 max-w-3xl text-lg text-pretty text-muted-foreground">{lead}</div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
