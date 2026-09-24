"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type CSSProperties, type ReactNode, useRef } from "react";

import { cn } from "@/lib/utils";

import styles from "./mountain-scene.module.css";

// Tiers of the fir, bottom to top (viewBox 0 0 200 560).
const FIR_TIERS = [
  "100,382 178,490 22,490",
  "100,334 166,434 34,434",
  "100,290 154,382 46,382",
  "100,250 143,332 57,332",
  "100,214 133,284 67,284",
  "100,182 124,240 76,240",
  "100,152 116,198 84,198",
  "100,126 110,158 90,158",
  "100,104 107,132 93,132",
  "100,82 105,110 95,110",
  "100,62 104,90 96,90",
  "100,44 102,70 98,70",
];

type Tree = {
  layer: "back" | "mid" | "fore";
  /** Placement from the block: height and lift in % of the forest, gaps in vw. */
  style: CSSProperties;
  sway: number;
  duration: number;
  delay: number;
};

// The block's seven firs, left group then right group (margin-left: auto splits them).
const TREES: Tree[] = [
  { layer: "fore", style: { height: "100%", bottom: "12%" }, sway: 2, duration: 5.6, delay: -2.1 },
  {
    layer: "fore",
    style: { height: "82%", bottom: "9%", marginLeft: "9vw" },
    sway: 1.6,
    duration: 6.2,
    delay: -3.4,
  },
  { layer: "mid", style: { height: "56%", bottom: "19%" }, sway: 1, duration: 7.5, delay: -1.2 },
  {
    layer: "back",
    style: { height: "74%", bottom: "10%", marginLeft: "auto", left: "-6vw" },
    sway: 1.4,
    duration: 6.5,
    delay: -4.3,
  },
  {
    layer: "mid",
    style: { height: "68%", bottom: "22%", marginLeft: "8vw" },
    sway: 1.3,
    duration: 6.8,
    delay: -0.5,
  },
  {
    layer: "fore",
    style: { height: "90%", bottom: "8%", marginLeft: "7vw", left: "-6vw" },
    sway: 1.8,
    duration: 5.9,
    delay: -1.8,
  },
  {
    layer: "back",
    style: { height: "62%", bottom: "21%", marginLeft: "3vw" },
    sway: 1.1,
    duration: 7.1,
    delay: -3,
  },
];

const LAYER_CLASS = { back: styles.back, mid: styles.midTree, fore: styles.fore };

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin);

// Front ridge of the block: a closed ribbon, filled from the start; its outline is drawn.
const MAIN_RIDGE =
  "M 50 550 L 350 470 L 600 550 L 800 360 L 900 480 L 1000 400 L 1200 550 L 1450 550 Q 1200 440 1100 480 Q 1000 520 900 480 Q 800 440 800 360 Q 700 480 600 550 Q 500 470 350 470 Q 200 520 50 550 Z";

/**
 * First screen of the home page under a night sky, closed off by mountain ridges with swaying firs.
 */
export function MountainHero({
  labelledBy,
  children,
}: {
  /** id of the heading that names the section. */
  labelledBy: string;
  children: ReactNode;
}) {
  const hero = useRef<HTMLElement>(null);

  // Motion engine (GSAP, scoped to the hero, reverted on unmount). The block's own animation, kept
  // as designed and rendered more exactly:
  // - the ridge outline draws over its measured length (DrawSVG) instead of a guessed dash of 2200,
  //   so it finishes in step with the stroke thinning 8 → 4 → 1.5 px and the glow fading;
  // - the highlight arc follows; both start the first time the scene comes into view;
  // - off-screen, the CSS sway of the firs pauses.
  // Reduced motion: the finished scene (the sway stops in CSS).
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const scene = hero.current?.querySelector<HTMLElement>("[data-scene]");
      // data-drawn marks the finished outline (e2e/hero.spec.ts); CSS then keeps it 1.5px wide.
      const markDrawn = () => scene?.setAttribute("data-drawn", "");

      // onToggle fires only on a change, so the state is also set right away (a page reloaded
      // further down starts with the scene off-screen).
      const pause = ({ isActive, trigger }: ScrollTrigger) =>
        trigger?.toggleAttribute("data-paused", !isActive);
      pause(
        ScrollTrigger.create({
          trigger: "[data-scene]",
          start: "top bottom",
          end: "bottom top",
          onToggle: pause,
        }),
      );

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // DrawSVG measures in SVG units, so the drawn stroke scales with the SVG; widths are divided
        // by that scale to stay the block's screen-pixel widths.
        const svg = scene?.querySelector("[data-line]")?.closest("svg");
        const px = 1500 / (svg?.getBoundingClientRect().width || 1500);
        // GSAP interpolates the numbers inside filter strings, not var(): read the glow colour once.
        const rgb = scene ? getComputedStyle(scene).getPropertyValue("--glow-rgb").trim() : "";
        const glow = `drop-shadow(0px 0px 16px rgba(${rgb}, 0.45))`;
        const noGlow = `drop-shadow(0px 0px 0px rgba(${rgb}, 0))`;

        gsap
          .timeline({
            delay: 0.2,
            onComplete: () => {
              gsap.set("[data-line]", { clearProps: "strokeWidth,filter" });
              markDrawn();
            },
            scrollTrigger: { trigger: "[data-scene]", start: "top bottom", once: true },
          })
          .fromTo(
            "[data-line]",
            { drawSVG: "0%", filter: glow },
            { drawSVG: "100%", filter: noGlow, duration: 2.4, ease: "power1.out" },
            0,
          )
          .fromTo(
            "[data-line]",
            { strokeWidth: 8 * px, strokeOpacity: 0 },
            {
              keyframes: [
                { strokeWidth: 4 * px, strokeOpacity: 0.4 },
                { strokeWidth: 1.5 * px, strokeOpacity: 1 },
              ],
              duration: 2.4,
              ease: "power1.out",
            },
            0,
          )
          .fromTo(
            "[data-accent]",
            { drawSVG: "0%", opacity: 0 },
            { drawSVG: "100%", opacity: 0.6, duration: 2.2, ease: "power3.inOut" },
            0.3,
          );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-line]", { strokeOpacity: 1 });
        gsap.set("[data-accent]", { opacity: 0.6 });
        markDrawn();
      });
    },
    { scope: hero },
  );

  return (
    <section
      ref={hero}
      aria-labelledby={labelledBy}
      className={cn(
        styles.hero,
        "flex min-h-[calc(100svh-var(--spacing-header))] flex-col text-foreground",
      )}
    >
      {children}
      <div data-scene aria-hidden="true" className={cn(styles.scene, "mt-auto")}>
        <div className={styles.ridges}>
          <svg className={styles.far} viewBox="0 0 1500 650" preserveAspectRatio="xMidYMax meet">
            <path d="M 0 570 L 200 470 L 400 530 L 600 400 L 800 500 L 1000 380 L 1200 500 L 1400 450 L 1500 570 Z" />
          </svg>
          <svg className={styles.mid} viewBox="0 0 1500 650" preserveAspectRatio="xMidYMax meet">
            <path d="M 100 590 L 350 470 L 500 550 L 700 420 L 900 540 L 1100 410 L 1300 540 L 1450 470 L 1500 590 Z" />
          </svg>
          <svg viewBox="0 0 1500 650" preserveAspectRatio="xMidYMax meet">
            <path data-line className={styles.draw} d={MAIN_RIDGE} />
            <path data-accent className={styles.accent} d="M 600 550 Q 800 420 900 480" />
          </svg>
        </div>

        <div className={styles.forest}>
          {TREES.map((tree, index) => (
            <div
              key={index}
              className={cn(styles.tree, LAYER_CLASS[tree.layer])}
              style={
                {
                  ...tree.style,
                  "--sway": `${tree.sway}deg`,
                  animationDuration: `${tree.duration}s`,
                  animationDelay: `${tree.delay}s`,
                } as CSSProperties
              }
            >
              <svg viewBox="0 0 200 560">
                <g fill="currentColor">
                  <rect x="93" y="472" width="14" height="72" />
                  {FIR_TIERS.map((points) => (
                    <polygon key={points} points={points} />
                  ))}
                </g>
              </svg>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
