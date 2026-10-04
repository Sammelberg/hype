"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import "lenis/dist/lenis.css";

import { gsap, ScrollTrigger } from "@/lib/motion/gsap";

// Smooth scrolling, when a project chooses it: render <SmoothScroll /> once in the frontend
// layout. One clock: Lenis is stepped by GSAP's ticker and tells ScrollTrigger in the same frame,
// so the page and every scene move together. Only with a fine pointer and motion allowed; touch
// screens keep the browser's own scroll, which no script can match there.
export function SmoothScroll() {
  useEffect(() => {
    if (!matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const lenis = new Lenis({ autoRaf: false, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    // A slow frame is not stretched over the next ones: the page stays where the wheel put it.
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);
  return null;
}
