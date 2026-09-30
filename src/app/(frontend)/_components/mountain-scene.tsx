"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type CSSProperties, type ReactNode, useRef } from "react";

import { glidePageTo } from "@/components/site/smooth-scroll";
import { cn } from "@/lib/utils";

import styles from "./mountain-scene.module.css";
import { bindLights } from "./lights";
import { bindNightSky } from "./night-sky";
import { bindStarfield } from "./starfield";

// Tiers of the fir, bottom to top (viewBox 0 0 200 560). The hero's own firs, back by the owner's
// request (2026-09-30); the drawn ones of fir-shapes.ts serve the page headers and the valleys.
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
  {
    layer: "fore",
    style: { height: "100%", bottom: "12%" },
    sway: 2,
    duration: 5.6,
    delay: -2.1,
  },
  {
    layer: "fore",
    style: { height: "82%", bottom: "9%", marginLeft: "9vw" },
    sway: 1.6,
    duration: 6.2,
    delay: -3.4,
  },
  {
    layer: "mid",
    style: { height: "56%", bottom: "19%" },
    sway: 1,
    duration: 7.5,
    delay: -1.2,
  },
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

/** Brightness the ridge outline and its highlight settle to after the draw (e2e/hero.spec.ts checks it). */
const RIDGE_REST = 0.72;
const ACCENT_REST = 0.75;

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin);

/** How near the top (share of the screen height) the page, scrolling up, is pulled onto the hero. */
const PULL = 0.45;

// Front ridge of the block: a closed ribbon, filled from the start; its outline is drawn.
const MAIN_RIDGE =
  "M 50 550 L 350 470 L 600 550 L 800 360 L 900 480 L 1000 400 L 1200 550 L 1450 550 Q 1200 440 1100 480 Q 1000 520 900 480 Q 800 440 800 360 Q 700 480 600 550 Q 500 470 350 470 Q 200 520 50 550 Z";

/**
 * First screen of the home page under a night sky, closed off by mountain ridges with swaying firs.
 */
// TEMPORARILY OFF (owner's request, 2026-09-24): the moon; sky, mist and stars stay. Set back to
// true to bring it back.
const SHOW_MOON = false;

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
  //   while a thick stroke melts into the 2.5px outline and the glow fades;
  // - the highlight arc follows; both start the first time the scene comes into view;
  // - off-screen, the CSS sway of the firs pauses.
  // Reduced motion: the finished scene (the sway stops in CSS).
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const scene = hero.current?.querySelector<HTMLElement>("[data-scene]");
      // data-drawn marks the finished outline (e2e/hero.spec.ts); CSS then keeps it 2.5px wide.
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

      // Coming back up from below, the hero pulls itself into place: once the page, still moving
      // up, is within PULL of the top, it glides the rest at the speed it already has (as the
      // services stage does on the way down). Wheel and trackpad only; touch scrolls as it does.
      mm.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
        let gliding = false;
        const pull = ScrollTrigger.create({
          trigger: hero.current,
          start: "top top",
          end: () => `+=${window.innerHeight * PULL}`,
          onUpdate: (self) => {
            const y = self.scroll();
            if (gliding || self.direction >= 0 || y <= 0 || y > self.end) return;
            gliding = true;
            glidePageTo(0, {
              duration: 0.8,
              carry: true,
              onComplete: () => {
                gliding = false;
              },
            });
          },
        });
        return () => pull.kill();
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // DrawSVG measures in SVG units, so drawn strokes scale with the SVG; widths are divided by
        // that scale to stay the block's screen-pixel widths.
        const svg = scene?.querySelector("[data-line]")?.closest("svg");
        const px = 1500 / (svg?.getBoundingClientRect().width || 1500);
        // One continuous ease for head and brightness, so they move as one.
        const draw = { duration: 2.4, ease: "power1.out" };

        // Glow: at the start the whole ridge flares up in a soft halo that fades as the outline
        // draws — the block's 16px drop-shadow on the filled shape. The halo is its own layer with a
        // static blur; only its opacity animates, so the blur is rasterised once and the fade runs
        // on the compositor instead of re-blurring every frame.

        // Fixed stroke widths in SVG units that equal the block's screen pixels.
        gsap.set("[data-line]", { strokeWidth: 2.5 * px, autoRound: false });
        gsap.set("[data-trail] path", { strokeWidth: 6 * px, autoRound: false });

        gsap
          .timeline({
            delay: 0.2,
            onComplete: () => {
              gsap.set("[data-line]", { clearProps: "strokeWidth" });
              markDrawn();
            },
            scrollTrigger: { trigger: "[data-scene]", start: "top bottom", once: true },
          })
          .fromTo(
            "[data-line], [data-trail] path",
            { drawSVG: "0%" },
            { drawSVG: "100%", ...draw },
            0,
          )
          .fromTo("[data-line]", { strokeOpacity: 0 }, { strokeOpacity: 1, ...draw }, 0)
          // The thick stroke rises and melts away (opacity, on the compositor): the eye reads the
          // outline thinning to 2.5px, while no stroke width changes — animating a width
          // below ~2px made its anti-aliasing flicker along the diagonals near the end.
          .fromTo(
            "[data-trail]",
            { opacity: 0 },
            {
              keyframes: { opacity: [0, 0.6, 0], easeEach: "sine.inOut" },
              duration: 2.4,
              ease: "none",
            },
            0,
          )
          .fromTo("[data-glow]", { opacity: 1 }, { opacity: 0, ...draw }, 0)
          .fromTo(
            "[data-accent]",
            { drawSVG: "0%", opacity: 0 },
            { drawSVG: "100%", opacity: 1, duration: 2.2, ease: "power3.inOut" },
            0.3,
          )
          // Triangle motif (triangle-motif.tsx), the block's timing: 1.7s after load the centre
          // peak draws, its dots light up, then the flanking peaks and connectors follow.
          .fromTo(
            "[data-tri-centre]",
            { drawSVG: "0%", strokeOpacity: 0 },
            { drawSVG: "100%", strokeOpacity: 1, duration: 1.2, ease: "power4.out" },
            1.5,
          )
          .to("[data-tri-dot]", { opacity: 1, duration: 0.4, ease: "power4.out" }, 2.4)
          .fromTo(
            "[data-tri-side]",
            { drawSVG: "0%", strokeOpacity: 0 },
            { drawSVG: "100%", strokeOpacity: 1, duration: 1, ease: "power4.out" },
            2.5,
          )
          // Once everything is drawn, the ridge settles: its outline and the golden highlight arc
          // dim to a quiet sketch (the arc stays a touch brighter), so the bright lines belong to
          // the drawing and not to the resting scene.
          .to("[data-line]", { strokeOpacity: RIDGE_REST, duration: 1.8, ease: "sine.inOut" }, 3.2)
          .to("[data-accent]", { opacity: ACCENT_REST, duration: 1.8, ease: "sine.inOut" }, 3.2);
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-tri-centre], [data-tri-side]", { strokeOpacity: 1 });
        gsap.set("[data-line]", { strokeOpacity: RIDGE_REST });
        gsap.set("[data-tri-dot]", { opacity: 1 });
        gsap.set("[data-accent]", { opacity: ACCENT_REST });
        markDrawn();
      });

      // The night around the scene, back to front: WebGL sky with moon and mist (night-sky.ts),
      // twinkling stars and the random starfall (starfield.ts), and in front of the forest the
      // lights rising from it (lights.ts). All fade in with the ridge draw and run on GSAP's
      // ticker only while the hero is on screen (the ticker idles in hidden tabs too); reduced
      // motion draws everything once, still.
      const root = hero.current;
      const starCanvas = root?.querySelector<HTMLCanvasElement>("[data-stars]");
      const lightCanvas = root?.querySelector<HTMLCanvasElement>("[data-lights]");
      const skyCanvas = root?.querySelector<HTMLCanvasElement>("[data-sky]");
      if (!root || !starCanvas || !lightCanvas || !skyCanvas) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // The moon sits high in the free sky, up and to the left of the triangle motif from lg up,
      // small in the upper right on narrower screens.
      const moon = () => {
        const box = root.getBoundingClientRect();
        const motif = root.querySelector("[data-motif]")?.getBoundingClientRect();
        const wide = window.innerWidth >= 1024;
        return {
          x:
            wide && motif
              ? motif.left + motif.width / 2 - box.left - box.width * 0.12
              : box.width * 0.74,
          y: wide ? Math.max(52, box.height * 0.06) : 48,
          r: window.innerWidth >= 1920 ? 46 : wide ? 38 : 24,
        };
      };
      const night = bindNightSky(skyCanvas, {
        sky: [1 / 255, 3 / 255, 12 / 255],
        moon,
        showMoon: SHOW_MOON,
        // The triangle motif always has mist behind it.
        cradle: () => {
          const box = root.getBoundingClientRect();
          const motif = root.querySelector("[data-motif]")?.getBoundingClientRect();
          if (!motif?.width) return null;
          return {
            x: motif.left - box.left,
            y: motif.top - box.top,
            w: motif.width,
            h: motif.height,
          };
        },
      });
      if (!night && SHOW_MOON) {
        const m = moon();
        const fallback = root.querySelector<HTMLElement>("[data-moon-fallback]");
        gsap.set(fallback, {
          display: "block",
          left: m.x,
          top: m.y,
          width: m.r * 2,
          height: m.r * 2,
        });
      }
      const stars = bindStarfield(starCanvas, { still: reduced });
      const lights = bindLights(lightCanvas, { still: reduced });
      const fade = { stars: reduced ? 1 : 0, lights: reduced ? 1 : 0 };
      // The sky's cloud shader is the one heavy draw, costlier than a whole frame at 144 Hz. It
      // holds still while the page scrolls and drifts on once it rests, so no scroll frame waits
      // for it. The sky keeps its own clock, which stops with it: after a pause the clouds drift on
      // from where they stood instead of jumping ahead by the time they were held.
      let scrolledAt = -Infinity;
      const onScroll = () => {
        scrolledAt = performance.now();
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      let skyTime = 0;
      let lastTick = -1;
      const tick = () => {
        const t = gsap.ticker.time;
        const dt = lastTick < 0 ? 0 : Math.min(t - lastTick, 0.1);
        lastTick = t;
        if (reduced) night?.render(14, true);
        else if (performance.now() - scrolledAt > 160) {
          skyTime += dt;
          night?.render(skyTime);
        }
        stars.render(t, fade.stars);
        lights.render(t, fade.lights);
      };

      if (reduced) {
        gsap.set([skyCanvas, lightCanvas], { opacity: 1 });
        tick();
      } else {
        gsap.to(skyCanvas, { opacity: 1, duration: 1.8, delay: 0.2, ease: "power1.inOut" });
        gsap.to(fade, { stars: 1, duration: 1.8, delay: 0.5, ease: "power1.inOut" });
        gsap.to(fade, { lights: 1, duration: 2.5, delay: 1.2, ease: "power1.inOut" });
        gsap.set(lightCanvas, { opacity: 1 });
        // Off screen the ticker stops; the sky's clock picks up again without a jump.
        const toggle = ({ isActive }: ScrollTrigger) => {
          lastTick = -1;
          if (isActive) gsap.ticker.add(tick);
          else gsap.ticker.remove(tick);
        };
        toggle(
          ScrollTrigger.create({
            trigger: root,
            start: "top bottom",
            end: "bottom top",
            onToggle: toggle,
          }),
        );
      }
      return () => {
        window.removeEventListener("scroll", onScroll);
        gsap.ticker.remove(tick);
        night?.destroy();
        stars.destroy();
        lights.destroy();
      };
    },
    { scope: hero },
  );

  return (
    <section
      ref={hero}
      aria-labelledby={labelledBy}
      data-cms-zone="kopf"
      className={cn(
        styles.hero,
        "relative isolate flex min-h-[calc(100svh-var(--spacing-header))] flex-col text-foreground",
      )}
    >
      <canvas data-sky aria-hidden="true" className={styles.sky} />
      <div data-moon-fallback aria-hidden="true" className={styles.moonFallback} />
      <canvas data-stars aria-hidden="true" className={styles.stars} />
      <div className="relative z-10">{children}</div>
      <div data-scene aria-hidden="true" className={cn(styles.scene, "mt-auto")}>
        <div className={styles.ridges}>
          <svg className={styles.far} viewBox="0 0 1500 650" preserveAspectRatio="xMidYMax meet">
            <path d="M 0 570 L 200 470 L 400 530 L 600 400 L 800 500 L 1000 380 L 1200 500 L 1400 450 L 1500 570 Z" />
          </svg>
          <svg className={styles.mid} viewBox="0 0 1500 650" preserveAspectRatio="xMidYMax meet">
            <path d="M 100 590 L 350 470 L 500 550 L 700 420 L 900 540 L 1100 410 L 1300 540 L 1450 470 L 1500 590 Z" />
          </svg>
          <div data-glow className={styles.glow}>
            <svg viewBox="0 0 1500 650" preserveAspectRatio="xMidYMax meet">
              <path d={MAIN_RIDGE} />
            </svg>
          </div>
          <svg viewBox="0 0 1500 650" preserveAspectRatio="xMidYMax meet">
            <path data-line className={styles.draw} d={MAIN_RIDGE} />
            <path data-accent className={styles.accent} d="M 600 550 Q 800 420 900 480" />
          </svg>
          <div data-trail className={styles.trail}>
            <svg viewBox="0 0 1500 650" preserveAspectRatio="xMidYMax meet">
              <path d={MAIN_RIDGE} />
            </svg>
          </div>
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
      <canvas data-lights aria-hidden="true" className={styles.lights} />
    </section>
  );
}
