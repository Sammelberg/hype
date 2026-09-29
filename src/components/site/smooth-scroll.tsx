"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

/** Scrolls the page to y: through Lenis while it runs, so the two never fight; natively otherwise. */
export function scrollPageTo(y: number, { immediate = false } = {}) {
  if (lenis) lenis.scrollTo(y, { immediate });
  else window.scrollTo({ top: y, behavior: immediate ? "instant" : "smooth" });
}

// Smooth wheel and trackpad scrolling for the whole site: Lenis on the window, driven by GSAP's
// ticker so it moves in step with every ScrollTrigger. Touch stays native; with reduced motion
// Lenis steps aside on its own. In-page anchors glide and still stop below the header
// (scroll-margin in globals.css); a link to another page drops any leftover inertia.
export function SmoothScroll() {
  useEffect(() => {
    const instance = new Lenis({ anchors: true, stopInertiaOnNavigate: true });
    lenis = instance;
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    // A slow frame must not be stretched into a jump of the page.
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      instance.destroy();
      lenis = null;
    };
  }, []);
  return null;
}
