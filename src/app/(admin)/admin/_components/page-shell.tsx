import type { ReactNode } from "react";

import { CompactTitle } from "./screen/compact-title";

// The top of every admin screen: title, one line of context, the actions on the right. Scrolled
// away, it condenses into a slim bar (CompactTitle).
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
      <CompactTitle title={title}>
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <h1 className="text-3xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
                {title}
              </h1>
              {lead ? (
                <p className="max-w-prose text-pretty text-muted-foreground">{lead}</p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        </header>
      </CompactTitle>
      {children}
    </div>
  );
}
