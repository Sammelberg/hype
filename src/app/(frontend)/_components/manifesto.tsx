"use client";

import { useGSAP } from "@gsap/react";
import { cn } from "cn";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState, type CSSProperties } from "react";

import { glideTo, holdGesture, setWheelStepper } from "@/lib/smooth-scroll";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Where a phrase's beam stands: -1 gone above, 0 facing the screen, 1 waiting below. Each beam
// turns about its own axis (half a line deep), travels a line and shrinks while turned away.
function beam(side: number) {
  const depth = "0.45em";
  return `translateY(${side * 0.95}em) scale(${1 - Math.abs(side) * 0.2}) translateZ(-${depth}) rotateX(${-side * 90}deg) translateZ(${depth})`;
}

// Pull-in zone: once the section shows (its top within 90% of the screen height from the top,
// or its end likewise from the bottom), the next wheel gesture pulls it into place.
const APPROACH = 0.9;

// Scroll (px) past a phrase's step before the next phrase takes over when the page moves without
// the wheel (keyboard, scrollbar, touch).
const THRESHOLD_PX = 12;

// Pinned "manifesto": the inner screen sticks while the phrases replace each other, then releases.
// Each change costs half a screen of scroll. With Lenis and a fine pointer, every wheel gesture
// while pinned flips one phrase and the page glides to its step (see setWheelStepper). Once the
// section shows, the next gesture pulls it into place on its first or last phrase; running into it
// anyway, the page settles on that phrase instead of running through
// (after a jump into the middle, on the nearest one).
// Other scrolling (keyboard, scrollbar, touch) flips a phrase just past its step.
// Reduced motion: no sticky, no transitions; the phrases stack, one screen each.
export function Manifesto({ phrases, caption }: { phrases: string[]; caption?: string | null }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const count = phrases.length;

  useGSAP(
    () => {
      if (count < 2) return;
      const mm = gsap.matchMedia();
      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", fine: "(pointer: fine)" },
        (context) => {
          if (!context.conditions?.motion) return;
          let current = 0;
          let inside = false;
          let gliding = false;
          let release: gsap.core.Tween | undefined;

          const show = (index: number) => {
            current = index;
            setActive(index);
          };
          const glide = (self: ScrollTrigger, index: number, duration?: number) => {
            if (!context.conditions?.fine) return;
            const top = self.start + (index / (count - 1)) * (self.end - self.start);
            // A pixel inside the range: at its exact edges the trigger is inactive, and the next
            // gesture would count as arriving again.
            const target = gsap.utils.clamp(self.start + 1, self.end - 1, top);
            // Set first: Lenis completes synchronously when it is already there. The delayed call
            // frees the fallback if the glide is cut short (the menu stops Lenis).
            gliding = true;
            release?.kill();
            release = gsap.delayedCall(1, () => (gliding = false));
            const done = () => {
              gliding = false;
              release?.kill();
            };
            if (!glideTo(target, done, duration)) done();
          };

          const st = ScrollTrigger.create({
            trigger: root.current,
            start: "top top",
            end: "bottom bottom",
            // Runs before onToggle in the same tick, so `inside` still holds the previous state.
            onUpdate: (self) => {
              if (!inside && self.isActive) {
                // A glide of ours is carrying the page in (a pull-in, maybe already stepped on):
                // it has picked the phrase.
                if (gliding) return;
                // Nearest step: the first or last phrase when scrolling in, the closest after a jump.
                const edge = Math.round(self.progress * (count - 1));
                show(edge);
                if (context.conditions?.fine) holdGesture();
                glide(self, edge);
                return;
              }
              if (gliding) return;
              const x = self.progress * (count - 1);
              const threshold = Math.min(
                0.5,
                THRESHOLD_PX / ((self.end - self.start) / (count - 1)),
              );
              const next =
                self.direction > 0
                  ? Math.min(count - 1, Math.floor(x + 1 - threshold))
                  : Math.max(0, Math.ceil(x - 1 + threshold));
              if (next === current) return;
              show(next);
              glide(self, next);
            },
            onToggle: (self) => {
              inside = self.isActive;
              // Leaving through an edge: show that edge's phrase for the way back.
              if (!inside) show(self.progress >= 1 ? count - 1 : 0);
            },
          });

          if (!context.conditions?.fine) return;
          // Past the first or last phrase the wheel scrolls the page on.
          setWheelStepper((direction) => {
            // Arriving: once the section shows at the bottom of the screen (scrolling down) or its
            // end at the top (scrolling up), the next gesture pulls it into place.
            const scroll = st.scroll();
            const reach = window.innerHeight * APPROACH;
            if (!gliding && direction > 0 && scroll < st.start && scroll > st.start - reach) {
              show(0);
              glide(st, 0, 0.9);
              return true;
            }
            if (!gliding && direction < 0 && scroll > st.end && scroll < st.end + reach) {
              show(count - 1);
              glide(st, count - 1, 0.9);
              return true;
            }
            const next = current + direction;
            // While a glide runs (still pulling the section in), the gesture steps on from its phrase.
            if ((!st.isActive && !gliding) || next < 0 || next >= count) return false;
            show(next);
            glide(st, next);
            return true;
          });
          return () => setWheelStepper(null);
        },
      );
    },
    { scope: root, dependencies: [count] },
  );

  return (
    <section
      ref={root}
      aria-labelledby="manifest-titel"
      data-active={active}
      style={{ "--manifesto-count": count } as CSSProperties}
      className="relative h-[calc(100svh+(var(--manifesto-count)-1)*50svh)] bg-paper text-ink motion-reduce:h-auto"
    >
      <h2 id="manifest-titel" className="sr-only">
        {phrases.join(" ")}
      </h2>
      <div className="sticky top-0 grid h-svh place-items-center overflow-hidden px-6 motion-reduce:static motion-reduce:h-auto motion-reduce:overflow-visible">
        {/* A drum of beams: each phrase is printed on its own square beam. Scrolling down, the
            current beam turns over its top edge while it rises and shrinks away; the next one
            rises from below, turns to face the screen and grows to full size (scrolling back, the
            reverse). Beams further away wait above or below, hidden. */}
        <div
          aria-hidden
          className="grid -translate-y-[2%] place-items-center perspective-[1400px] motion-reduce:perspective-none"
        >
          {phrases.map((phrase, i) => (
            <p
              key={i}
              style={{ transform: beam(Math.sign(i - active)) }}
              className={cn(
                "max-w-[90vw] text-center text-[clamp(40px,7vw,140px)] leading-[0.9] font-bold tracking-[-0.01em] text-balance uppercase [--depth:0.5em] [grid-area:1/1] backface-hidden",
                "transition-[opacity,transform] duration-800 ease-(--ease-in-out)",
                "motion-reduce:grid motion-reduce:h-svh motion-reduce:transform-none! motion-reduce:place-items-center motion-reduce:opacity-100 motion-reduce:transition-none motion-reduce:[grid-area:auto]",
                i === active ? "opacity-100" : "opacity-0",
              )}
            >
              {phrase}
            </p>
          ))}
        </div>
        {/* Inside the sticky screen, so they stay on it; with reduced motion, at the column's end. */}
        {caption ? (
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs font-semibold tracking-[0.08em] whitespace-nowrap text-ink-muted uppercase">
            {caption}
          </span>
        ) : null}
        {count > 5 ? (
          <span
            aria-hidden
            className="absolute right-6 bottom-5 font-mono text-[11px] text-ink-muted tabular-nums"
          >
            {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
        ) : null}
      </div>
    </section>
  );
}
