"use client";

import { type CSSProperties, useEffect, useRef } from "react";

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

// Skylines (viewBox 0 340 1500 310): far and mid ridges, and the front ridge that draws itself.
const FAR =
  "M 0 570 L 200 470 L 400 530 L 600 400 L 800 500 L 1000 380 L 1200 500 L 1400 450 L 1500 570";
const MID =
  "M 0 630 L 100 590 L 350 470 L 500 550 L 700 420 L 900 540 L 1100 410 L 1300 540 L 1450 470 L 1500 590";
const MAIN = "M 50 550 L 350 470 L 600 550 L 800 360 L 900 480 L 1000 400 L 1200 550 L 1450 550";

type Tree = {
  layer: "back" | "mid" | "fore";
  /** Centre, % of the forest width. */
  x: number;
  /** Height and lift off the ground, % of the forest height. */
  height: number;
  lift: number;
  sway: number;
  duration: number;
  delay: number;
  /** Hidden below 480px, where the groups would crowd. */
  wide?: boolean;
};

// Two groups, left and right, so the middle stays open for the ridge.
const TREES: Tree[] = [
  { layer: "fore", x: 5, height: 100, lift: 12, sway: 2, duration: 5.6, delay: -2.1 },
  { layer: "mid", x: 26, height: 56, lift: 19, sway: 1, duration: 7.5, delay: -1.2, wide: true },
  { layer: "fore", x: 16, height: 82, lift: 9, sway: 1.6, duration: 6.2, delay: -3.4 },
  { layer: "back", x: 71, height: 74, lift: 10, sway: 1.4, duration: 6.5, delay: -4.3 },
  { layer: "mid", x: 81, height: 68, lift: 22, sway: 1.3, duration: 6.8, delay: -0.5, wide: true },
  { layer: "back", x: 97, height: 62, lift: 21, sway: 1.1, duration: 7.1, delay: -3 },
  { layer: "fore", x: 89, height: 90, lift: 8, sway: 1.8, duration: 5.9, delay: -1.8 },
];

const LAYER_CLASS = { back: styles.back, mid: styles.midTree, fore: styles.fore };

/** Decorative mountain ridges with swaying firs; sits at the bottom of the home hero. */
export function MountainScene({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  // The ridge draws the first time the scene comes into view (below the fold on landscape phones);
  // the looping sway runs only while the scene is on screen and the tab is visible.
  useEffect(() => {
    const scene = ref.current;
    if (!scene) return;
    let onScreen = true;
    const update = () => {
      scene.toggleAttribute("data-paused", !onScreen || document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      if (onScreen) scene.setAttribute("data-seen", "");
      update();
    });
    observer.observe(scene);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className={cn(styles.scene, className)}>
      <div className={styles.ridges}>
        {/* Each ridge: a body filled down to the ground, and its skyline as a separate stroke. */}
        <svg viewBox="0 340 1500 310" preserveAspectRatio="none">
          <path className={styles.farBody} d={`${FAR} L 1500 650 L 0 650 Z`} />
          <path className={styles.farLine} d={FAR} />
          <path className={styles.midBody} d={`${MID} L 1500 650 L 0 650 Z`} />
          <path className={styles.midLine} d={MID} />
          <path
            className={styles.mainBody}
            d="M 50 550 L 350 470 L 600 550 L 800 360 L 900 480 L 1000 400 L 1200 550 L 1450 550 Q 1200 440 1100 480 Q 1000 520 900 480 Q 800 440 800 360 Q 700 480 600 550 Q 500 470 350 470 Q 200 520 50 550 Z"
          />
          <path className={styles.mainLine} pathLength={1} d={MAIN} />
          <path className={styles.highlight} pathLength={1} d="M 600 550 Q 800 420 900 480" />
        </svg>
      </div>

      <div className={styles.forest}>
        {TREES.map((tree, index) => (
          <div
            key={index}
            className={cn(styles.tree, LAYER_CLASS[tree.layer], tree.wide && styles.wide)}
            style={
              {
                left: `${tree.x}%`,
                bottom: `${tree.lift}%`,
                height: `${tree.height}%`,
                "--sway": `${tree.sway}deg`,
                "--sway-duration": `${tree.duration}s`,
                "--sway-delay": `${tree.delay}s`,
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
  );
}
