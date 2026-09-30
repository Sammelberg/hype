import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// A card that opens a document: its title is the one link, stretched over the whole card, so
// the link's name stays the title and the card still takes a click anywhere. The card itself
// shows the focus ring. Nested tiles (a section's pages) use `tile` and sit above the stretch.
export const cardLinkSurface =
  "relative transition-[box-shadow] duration-150 hover:ring-foreground/25 has-[[data-card-link]:focus-visible]:ring-2 has-[[data-card-link]:focus-visible]:ring-ring";

export const tileLinkSurface =
  "relative z-10 transition-colors duration-150 hover:bg-muted has-[[data-tile-link]:focus-visible]:ring-2 has-[[data-tile-link]:focus-visible]:ring-ring";

export function CardLink({
  href,
  tile = false,
  className,
  children,
}: {
  href: string;
  tile?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href as never}
      data-card-link={tile ? undefined : ""}
      data-tile-link={tile ? "" : undefined}
      className={cn(
        "outline-none after:absolute after:inset-0 after:content-['']",
        tile ? "after:rounded-lg" : "after:rounded-xl",
        className,
      )}
    >
      {children}
    </Link>
  );
}
