import Link from "next/link";
import type { CSSProperties } from "react";

import { Spotlight } from "@/components/site/spotlight";
import { HORIZON_H, HORIZON_W, horizon } from "@/lib/horizon";
import { cn } from "@/lib/utils";

type Door = { id: number; title: string; path: string; summary: string | null };

// The pages below a page, each a door showing the horizon its own page opens with (lib/horizon,
// seeded by its path), drawn as the door comes into view. One page fills the row; more share it.
export function ChildDoors({ doors, large = false }: { doors: Door[]; large?: boolean }) {
  return (
    <ul
      className={cn(
        "grid sd-stagger gap-4",
        doors.length > 1 ? "md:grid-cols-2" : null,
        doors.length > 2 ? "xl:grid-cols-3" : null,
      )}
    >
      {doors.map((door, i) => {
        const h = horizon(door.path);
        return (
          <li key={door.id} style={{ "--i": i } as CSSProperties}>
            <Spotlight className="group h-full rounded-3xl border border-primary-soft/15 bg-card transition-colors hover:border-primary-soft/40">
              <Link
                href={door.path as never}
                className={cn(
                  "flex h-full flex-col outline-none after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-ring",
                  large && doors.length === 1 ? "lg:grid lg:grid-cols-2 lg:items-end" : null,
                )}
              >
                <div
                  className={cn(
                    "flex flex-col gap-4 p-8 sm:p-10",
                    large && doors.length === 1 ? "lg:p-14" : null,
                  )}
                >
                  <h2
                    className={cn(
                      "font-semibold tracking-tight text-balance",
                      large ? "text-3xl sm:text-5xl 3xl:text-6xl" : "text-2xl sm:text-3xl",
                    )}
                  >
                    {door.title}
                  </h2>
                  {door.summary ? (
                    <p className="max-w-prose text-lg text-pretty text-muted-foreground sm:text-xl">
                      {door.summary}
                    </p>
                  ) : null}
                  <span className="mt-2 inline-flex items-center gap-3 font-medium text-primary-soft">
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
                <svg
                  viewBox={`0 0 ${HORIZON_W} ${HORIZON_H}`}
                  preserveAspectRatio="xMidYMax slice"
                  aria-hidden="true"
                  className={cn(
                    "mt-auto w-full transition-transform duration-500 ease-out group-hover:-translate-y-1",
                    large ? "h-36 sm:h-48" : "h-28",
                  )}
                >
                  <path d={h.ground} className="fill-secondary" />
                  <path
                    d={h.ridge}
                    pathLength={1}
                    className="sd-stroke fill-none stroke-primary-soft [stroke-width:2.5]"
                  />
                  <path
                    d={h.arc}
                    pathLength={1}
                    className="sd-stroke fill-none stroke-[oklch(0.7_0.12_58)] [stroke-width:2.5]"
                  />
                </svg>
              </Link>
            </Spotlight>
          </li>
        );
      })}
    </ul>
  );
}
