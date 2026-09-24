"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// A slow endless band (client logos or project tags). Scrolling speeds it up and turns it to the
// scroll direction; it pauses off screen. Reduced motion: a static, wrapping list.
export function Marquee({
  label,
  items,
}: {
  label: string;
  items: { key: string; content: ReactNode }[];
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia(root.current ?? undefined);
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const loop = gsap.to("[data-marquee-row]", {
          xPercent: -50,
          ease: "none",
          duration: Math.max(20, items.length * 4),
          repeat: -1,
        });
        let direction = 1;
        ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
          onUpdate: (self) => {
            direction = self.direction;
            const boost = Math.min(6, 1 + Math.abs(self.getVelocity()) / 300);
            gsap.to(loop, { timeScale: direction * boost, duration: 0.2, overwrite: true });
            gsap.to(loop, { timeScale: direction, duration: 1.2, delay: 0.2, ease: "power2.out" });
          },
        });
      });
    },
    { scope: root },
  );

  const row = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      aria-label={hidden ? undefined : label}
      className={`flex shrink-0 items-center ${hidden ? "motion-reduce:hidden" : "motion-reduce:flex-wrap"}`}
    >
      {items.map((item) => (
        <li key={item.key} className="flex shrink-0 items-center">
          {item.content}
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={root} className="overflow-hidden border-y py-fib-lg">
      <div data-marquee-row className="flex w-max motion-reduce:w-auto">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
