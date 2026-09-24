"use client";

import { cn } from "@/lib/utils";

import { usePauseOffscreen } from "../_lib/use-pause-offscreen";

// Decorative wire globe for the hero contact card: tilted great circles around a soft cyan glow.
// Pure SVG + CSS; it turns slowly only for users who allow motion, and only while on screen.
const RINGS = [0, 28, 57, 93, 124, 151];

export function HeroGlobe({ className }: { className?: string }) {
  const globe = usePauseOffscreen<SVGSVGElement>();

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 bottom-16 -z-10 grid place-items-center pt-fib-sm",
        className,
      )}
    >
      <div className="absolute aspect-square h-3/4 rounded-full bg-primary/30 blur-3xl" />
      <svg
        ref={globe}
        viewBox="-100 -100 200 200"
        className="relative aspect-square h-full max-h-60 motion-safe:animate-[spin_60s_linear_infinite]"
      >
        <circle r="80" fill="none" className="stroke-primary/80" strokeWidth="1.25" />
        {RINGS.map((angle, i) => (
          <ellipse
            key={angle}
            rx="80"
            ry={18 + i * 11}
            fill="none"
            transform={`rotate(${angle})`}
            className="stroke-primary/60"
            strokeWidth="1"
          />
        ))}
      </svg>
    </div>
  );
}
