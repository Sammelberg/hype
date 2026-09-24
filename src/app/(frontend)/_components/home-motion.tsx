"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useRef, type ReactNode } from "react";

import { filterWheel, setSmoothScroll } from "@/lib/smooth-scroll";
import { Cursor } from "./cursor";
import { ScrollProgressTop } from "./scroll-progress-top";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Scroll choreography for the homepage. The markup is complete without it (no JS, reduced motion):
// the gallery is then a native horizontal scroller on wide screens and a grid on narrow ones.
// Hooks are data attributes set by page.tsx: data-hero, data-hero-line, data-hero-fade,
// data-service, data-service-line, data-gallery, data-track-viewport, data-track, data-panel,
// data-panel-media, data-progress, data-step, data-step-card, data-curtain.
export function HomeMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const mm = gsap.matchMedia(root.current ?? undefined);

      // Smooth scrolling, synced to ScrollTrigger through GSAP's ticker.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const lenis = new Lenis({ anchors: true, virtualScroll: filterWheel });
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        setSmoothScroll(lenis);
        return () => {
          setSmoothScroll(null);
          gsap.ticker.remove(tick);
          gsap.ticker.lagSmoothing(500, 33);
          lenis.destroy();
        };
      });

      // Hero: the name lines drift apart and the intro fades while the hero scrolls away.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const hero = { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true };
        gsap.to("[data-hero-line]", {
          xPercent: (i: number) => (i % 2 === 0 ? -7 : 7),
          ease: "none",
          scrollTrigger: hero,
        });
        // fromTo: a plain to() would record the start opacity mid CSS fade-in and pin the text at 0.
        gsap.fromTo(
          "[data-hero-fade]",
          { opacity: 1 },
          { opacity: 0, ease: "none", scrollTrigger: hero },
        );
      });

      // Services: the rule above each service fills as the service passes through the viewport.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        for (const item of gsap.utils.toArray<HTMLElement>("[data-service]")) {
          gsap.fromTo(
            item.querySelector("[data-service-line]"),
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: { trigger: item, start: "top 85%", end: "top 40%", scrub: true },
            },
          );
        }
      });

      // Wide screens: pin the gallery and turn vertical scroll into horizontal travel.
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 64rem)", () => {
        const section = root.current?.querySelector<HTMLElement>("[data-gallery]");
        const viewport = section?.querySelector<HTMLElement>("[data-track-viewport]");
        const track = section?.querySelector<HTMLElement>("[data-track]");
        if (!section || !viewport || !track) return;

        const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
        gsap.set(viewport, { overflow: "visible" });
        gsap.set("[data-progress]", { opacity: 1 });

        const travel = gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${distance()}`,
              pin: true,
              scrub: true,
              invalidateOnRefresh: true,
            },
          })
          .to(track, { x: () => -distance() }, 0)
          .fromTo("[data-progress]", { scaleX: 0 }, { scaleX: 1 }, 0);

        // Each cover drifts inside its frame as it crosses the screen.
        for (const panel of gsap.utils.toArray<HTMLElement>("[data-panel]")) {
          gsap.fromTo(
            panel.querySelector("[data-panel-media]"),
            { xPercent: -8, scale: 1.2 },
            {
              xPercent: 8,
              scale: 1.2,
              ease: "none",
              scrollTrigger: {
                trigger: panel,
                containerAnimation: travel,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            },
          );
        }

        // Keyboard users: a focused project off to the side scrolls the page to where it is in view.
        const onFocus = contextSafe!((event: FocusEvent) => {
          const panel = (event.target as HTMLElement).closest<HTMLElement>("[data-panel]");
          const st = travel.scrollTrigger;
          if (!panel || !st) return;
          // Both rects carry the same translate, so their difference is the panel's place in the track.
          const offset =
            panel.getBoundingClientRect().left -
            track.getBoundingClientRect().left -
            parseFloat(getComputedStyle(track).paddingLeft);
          const target = Math.min(1, Math.max(0, offset / distance()));
          window.scrollTo({ top: st.start + target * (st.end - st.start), behavior: "instant" });
        });
        track.addEventListener("focusin", onFocus);
        return () => track.removeEventListener("focusin", onFocus);
      });

      // Process: while the next card slides over, the covered card steps back. Created after the
      // gallery pin so its positions include the pin spacing.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const steps = gsap.utils.toArray<HTMLElement>("[data-step]");
        steps.slice(0, -1).forEach((step, i) => {
          const next = steps[i + 1]!;
          gsap.to(step.querySelector("[data-step-card]"), {
            scale: 0.92,
            ease: "none",
            scrollTrigger: {
              trigger: next,
              start: "top bottom",
              // Ends where the next card sticks (its CSS `top`).
              end: () => `top ${parseFloat(getComputedStyle(next).top)}px`,
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
        });
      });

      // Closing: the dark panel opens from an inset card to full bleed as it scrolls in.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-curtain]",
          { clipPath: "inset(6% 4% 6% 4% round 2rem)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0rem)",
            ease: "none",
            scrollTrigger: {
              trigger: "[data-curtain]",
              start: "top bottom",
              end: "top 15%",
              scrub: true,
            },
          },
        );
      });

      // Narrow screens: covers drift vertically inside their frames.
      mm.add("(prefers-reduced-motion: no-preference) and (max-width: 63.99rem)", () => {
        for (const panel of gsap.utils.toArray<HTMLElement>("[data-panel]")) {
          gsap.fromTo(
            panel.querySelector("[data-panel-media]"),
            { yPercent: -6, scale: 1.15 },
            {
              yPercent: 6,
              scale: 1.15,
              ease: "none",
              scrollTrigger: {
                trigger: panel,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        }
      });
    },
    { scope: root },
  );

  // overflow-x-clip here, not on <body>: body's overflow is propagated to the viewport, where
  // `clip` becomes `hidden` and focus can scroll the page sideways. clip keeps sticky working.
  return (
    <div ref={root} className="overflow-x-clip">
      {children}
      <Cursor />
      <ScrollProgressTop />
    </div>
  );
}
