"use client";

import { type ReactNode, useRef } from "react";

import { gsap, MOTION, useGSAP } from "@/lib/motion/gsap";
import { scrollScene, scrollTween } from "@/lib/motion/scene";

// The demo's scroll scenes: a parallax layer and a gallery that travels sideways while its stage
// holds the screen, telling its step without a per-frame callback.
export function Szenen({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.matchMedia(root.current ?? undefined).add(MOTION, () => {
        const scope = root.current;
        const bereich = scope?.querySelector("[data-parallaxe-bereich]");
        const ebene = scope?.querySelector("[data-parallaxe]");
        if (bereich && ebene) {
          scrollTween(
            ebene,
            { yPercent: -20 },
            { yPercent: 0 },
            { trigger: bereich, start: "top bottom", end: "bottom top" },
          );
        }
        const holder = scope?.querySelector("[data-sticky-stage]");
        const reihe = scope?.querySelector<HTMLElement>("[data-reihe]");
        const anzeige = scope?.querySelector<HTMLElement>("[data-schritt-anzeige]");
        if (holder && reihe) {
          const karten = reihe.children.length;
          scrollScene(
            {
              trigger: holder,
              steps: {
                count: karten,
                onStep: (step) => {
                  reihe.dataset.schritt = String(step);
                  if (anzeige) anzeige.textContent = `Karte ${step + 1} von ${karten}`;
                },
              },
            },
            (scene) =>
              scene.to(
                reihe,
                { x: () => -(reihe.scrollWidth - window.innerWidth) },
                { duration: 1 },
              ),
          );
        }
      });
    },
    { scope: root },
  );
  return <div ref={root}>{children}</div>;
}
