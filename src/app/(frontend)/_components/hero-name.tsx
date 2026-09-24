"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

// The hero title. Geist is a variable font: with a mouse, letters near the pointer
// grow heavy and distant ones thin out, then settle back to semibold when the pointer leaves.
// Screen readers get the plain name; the per-letter spans are presentation only.
// The caller sets size and leading together (cn drops a leading-* that precedes a text-* size).
// A final full stop is set in the accent colour; the rest is `hero-ink` (tonal, one light sweep).
const REST = 600;
const LIGHT = 300;
const HEAVY = 900;

export function HeroName({ lines, className }: { lines: string[]; className?: string }) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = heading.current;
    if (!el) return;
    const query = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    const letters = Array.from(el.querySelectorAll<HTMLElement>("[data-letter]"));
    const weights = letters.map(() => REST);
    let pointer: { x: number; y: number } | null = null;
    let frame = 0;

    const step = () => {
      const radius = parseFloat(getComputedStyle(el).fontSize) * 1.4;
      let moving = false;
      letters.forEach((letter, i) => {
        let target = REST;
        if (pointer) {
          const r = letter.getBoundingClientRect();
          const d = Math.hypot(
            pointer.x - (r.left + r.width / 2),
            pointer.y - (r.top + r.height / 2),
          );
          target = LIGHT + (HEAVY - LIGHT) * Math.max(0, 1 - d / radius);
        }
        const next = weights[i]! + (target - weights[i]!) * 0.18;
        weights[i] = Math.abs(target - next) < 0.5 ? target : next;
        if (weights[i] !== target) moving = true;
        letter.style.fontWeight = String(Math.round(weights[i]!));
      });
      frame = moving || pointer ? requestAnimationFrame(step) : 0;
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };
    const onMove = (event: PointerEvent) => {
      if (!query.matches) return;
      pointer = { x: event.clientX, y: event.clientY };
      start();
    };
    const onLeave = () => {
      pointer = null;
      start();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      for (const letter of letters) letter.style.fontWeight = "";
    };
  }, []);

  return (
    <h1 ref={heading} className={cn("font-semibold tracking-tighter break-words", className)}>
      <span className="sr-only">{lines.join(" ")}</span>
      {lines.map((line, i) => (
        <span key={i} aria-hidden data-hero-line className="block overflow-hidden pb-[0.06em]">
          <span className="block animate-line-rise" style={{ animationDelay: `${120 + i * 90}ms` }}>
            <span className="hero-ink">
              {Array.from(line).map((char, j) => (
                <span
                  key={j}
                  data-letter
                  className={
                    i === lines.length - 1 && j === line.length - 1 && char === "."
                      ? "text-primary"
                      : undefined
                  }
                >
                  {char}
                </span>
              ))}
            </span>
          </span>
        </span>
      ))}
    </h1>
  );
}
