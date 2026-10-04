import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// The only place GSAP, ScrollTrigger and Lenis are imported (eslint.config.mjs refuses them
// elsewhere): scroll-linked motion goes through scrollScene (scene.ts), smooth scrolling through
// <SmoothScroll /> (components/motion/smooth-scroll.tsx). Time-based timelines (an entrance, a
// hover) use `gsap` from here directly.
if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, useGSAP);

// With motion allowed; pass it to gsap.matchMedia() so reduced motion gets the still page.
export const MOTION = "(prefers-reduced-motion: no-preference)";

// Measure every scene again, after a change of layout the browser does not report (fonts,
// content loaded late).
export const refreshScroll = () => ScrollTrigger.refresh();

export { gsap, ScrollTrigger, useGSAP };
