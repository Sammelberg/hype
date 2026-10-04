import { Verweis } from "@/components/site/verweis";

import { cn } from "@/lib/utils";

type Door = { id: number; title: string; path: string; summary: string | null };

// Pages as cards: the pages below a page, or the home page's way into the others. The whole card
// is the link's target; only the title names it.
export function Doors({
  doors,
  label,
  heading = "h2",
}: {
  doors: Door[];
  /** Names the list (an overview's pages are its body: the page's title). */
  label?: string;
  /** The cards' titles sit under a heading of their own on the home page. */
  heading?: "h2" | "h3";
}) {
  const Title = heading;
  return (
    <ul
      aria-label={label}
      className={cn("grid gap-4", doors.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : null)}
    >
      {doors.map((door) => (
        <li
          key={door.id}
          className="relative flex flex-col gap-3 rounded-xl border bg-card p-6 transition-colors hover:bg-muted/50"
        >
          <Title className="text-xl font-semibold tracking-tight text-balance break-words hyphens-auto">
            <Verweis
              href={door.path as never}
              className="outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-ring"
            >
              {door.title}
            </Verweis>
          </Title>
          {door.summary ? (
            <p className="line-clamp-3 text-pretty text-muted-foreground">{door.summary}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
