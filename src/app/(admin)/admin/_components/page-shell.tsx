import type { ReactNode } from "react";

// The top of every admin screen: title, one line of context, the actions on the right.
export function PageShell({
  title,
  lead,
  actions,
  children,
  wide = false,
}: {
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "flex flex-col gap-8" : "mx-auto flex w-full max-w-5xl flex-col gap-8"}>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {title}
          </h1>
          {lead ? <p className="max-w-prose text-pretty text-muted-foreground">{lead}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
