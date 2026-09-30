import type { ReactNode } from "react";

import { CardLink, tileLinkSurface } from "../card-link";

// A related document inside a card: its name opens it, the rest says where it stands.
export function DokumentKachel({
  href,
  titel,
  unter,
  status,
  betrag,
}: {
  href: string;
  titel: string;
  unter?: ReactNode;
  status?: ReactNode;
  betrag?: string | null;
}) {
  return (
    <li
      className={`${tileLinkSurface} flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2.5`}
    >
      <div className="flex min-w-0 flex-col">
        <CardLink tile href={href} className="truncate font-medium">
          {titel}
        </CardLink>
        {unter ? <span className="truncate text-xs text-muted-foreground">{unter}</span> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {betrag ? <span className="text-sm tabular-nums">{betrag}</span> : null}
        {status}
      </div>
    </li>
  );
}
