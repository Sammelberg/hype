"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

// A link card that tells its `hero-spotlight` light where the mouse is (--spot-x/--spot-y).
// Writes the variables on the card itself, so only the card restyles; touch pointers are ignored.
export function SpotlightLink({ onPointerMove, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (event.pointerType !== "mouse") return;
        const el = event.currentTarget;
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
        el.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
      }}
    />
  );
}
