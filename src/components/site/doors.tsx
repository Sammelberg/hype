import Link from "next/link";
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

import { PenHorizon } from "./pen-horizon";
import { Spotlight } from "./spotlight";

type Door = { id: number; title: string; path: string; summary: string | null };

// Pages as doors, each showing the pen-drawn horizon its own page opens with (seeded by its path),
// drawn as the door comes into view: the pages below a page, or the home page's way into the
// others. One page fills the row; more share it, four stand two by two. Columns follow the room
// the doors have (a container query), so beside a part's heading they stay wide enough for their
// titles; a long title word breaks with a hyphen rather than leaving its door.
export function Doors({
  doors,
  label,
  large = false,
  heading = "h2",
}: {
  doors: Door[];
  /** Names the list (an overview's pages are its body: the page's title). */
  label?: string;
  large?: boolean;
  /** The doors' titles sit under a heading of their own on the home page. */
  heading?: "h2" | "h3";
}) {
  const Title = heading;
  return (
    <div className="@container">
      <ul
        aria-label={label}
        className={cn(
          "grid sd-stagger gap-4",
          doors.length > 1 ? "@2xl:grid-cols-2" : null,
          doors.length > 2 && doors.length !== 4 ? "@5xl:grid-cols-3" : null,
        )}
      >
        {doors.map((door, i) => {
          return (
            <li key={door.id} style={{ "--i": i } as CSSProperties}>
              <Spotlight className="group h-full rounded-3xl border border-primary-soft/15 bg-card transition-colors hover:border-primary-soft/40">
                <div
                  className={cn(
                    "flex h-full flex-col",
                    large && doors.length === 1 ? "lg:grid lg:grid-cols-2 lg:items-end" : null,
                  )}
                >
                  <div
                    className={cn(
                      "flex flex-col gap-4 p-8 sm:p-10",
                      large && doors.length === 1 ? "lg:p-14" : null,
                    )}
                  >
                    <Title
                      className={cn(
                        "font-semibold tracking-tight text-balance break-words hyphens-auto",
                        large ? "text-3xl sm:text-5xl 3xl:text-6xl" : "text-2xl sm:text-3xl",
                      )}
                    >
                      {/* Only the title names the link; the whole door is its target. */}
                      <Link
                        href={door.path as never}
                        className="outline-none after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-ring"
                      >
                        {door.title}
                      </Link>
                    </Title>
                    {door.summary ? (
                      <p className="max-w-prose text-lg text-pretty text-muted-foreground sm:text-xl">
                        {door.summary}
                      </p>
                    ) : null}
                    <span
                      aria-hidden="true"
                      className="mt-2 inline-flex items-center gap-3 font-medium text-primary-soft"
                    >
                      <span className="decoration-2 underline-offset-8 group-hover:underline">
                        Ansehen
                      </span>
                      <svg
                        viewBox="0 0 28 28"
                        aria-hidden="true"
                        className="size-5 fill-none stroke-current stroke-2 transition-transform duration-200 ease-out [stroke-linecap:round] [stroke-linejoin:round] group-hover:translate-x-1"
                      >
                        <path d="M5 14h17M16 8l6 6-6 6" />
                      </svg>
                    </span>
                  </div>
                  <PenHorizon
                    seed={door.path}
                    ridges={2}
                    draw="scroll"
                    className={cn(
                      "mt-auto transition-transform duration-500 ease-out [--pen-ground:var(--card)] group-hover:-translate-y-1",
                      large ? "min-h-36 sm:min-h-48" : "min-h-28",
                    )}
                  />
                </div>
              </Spotlight>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
