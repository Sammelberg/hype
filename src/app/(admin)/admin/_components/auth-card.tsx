import type { ReactNode } from "react";

import { initialOf } from "@/lib/brand";

// The frame around the login, the note on an empty database and the password change: the mark, a title
// and one column of form, centred on the paper.
export function AuthCard({
  title,
  lead,
  children,
  siteName,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
  siteName: string;
}) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="rise-in w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <span aria-hidden="true" className="font-semibold">
              {initialOf(siteName)}
            </span>
          </span>
          <div className="leading-tight">
            <p className="font-medium">{siteName}</p>
            <p className="text-sm text-muted-foreground">Verwaltung</p>
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {lead ? <p className="mt-2 text-muted-foreground">{lead}</p> : null}
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
