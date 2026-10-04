"use client";

import { type ReactNode, useRef } from "react";

import { gsap, MOTION, useGSAP } from "@/lib/motion/gsap";
import { scrollScene } from "@/lib/motion/scene";

// The scene of the Figuren gallery: while its stage holds the screen, the row travels left by its
// overflow, played on the page's scroll timeline (docs/motion-architecture.md). The stage is a
// stage only while the scene runs (`data-szene` on the holder): without scripts and with reduced
// motion the row is a plain strip that swipes sideways, so the page is whole without the scene.
export function GalerieSzene({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.matchMedia(root.current ?? undefined).add(MOTION, () => {
        const holder = root.current?.querySelector<HTMLElement>("[data-sticky-stage]");
        const reihe = root.current?.querySelector<HTMLElement>("[data-reihe]");
        if (!holder || !reihe) return;
        holder.dataset.szene = "";
        // How far the last card's end (with the row's end padding) lies past the screen.
        const ueberstand = () => {
          const letzte = reihe.lastElementChild as HTMLElement | null;
          if (!letzte) return 0;
          const ende =
            letzte.offsetLeft +
            letzte.offsetWidth +
            parseFloat(getComputedStyle(reihe).paddingRight);
          return Math.max(0, ende - reihe.clientWidth);
        };
        scrollScene({ trigger: holder }, (scene) =>
          scene.to(reihe, { x: () => -ueberstand() }, { duration: 1 }),
        );
        return () => {
          delete holder.dataset.szene;
        };
      });
    },
    { scope: root },
  );
  return <div ref={root}>{children}</div>;
}
