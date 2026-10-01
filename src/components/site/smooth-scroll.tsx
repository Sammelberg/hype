"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let holder: (() => void) | null = null;
let stopper: ((from: number, to: number) => boolean) | null = null;

/**
 * Scrolls the page to y: through Lenis while it runs, so the two never fight; natively otherwise.
 * An immediate jump is forced, so Lenis does not glide on toward a target it had before.
 */
export function scrollPageTo(y: number, { immediate = false } = {}) {
  // A scroll from code (an anchor, the admin's preview) outranks a section that holds the page.
  const release = holder;
  holder = null;
  release?.();
  if (lenis) {
    // Lenis clamps to the page height it last measured, and measures a resize only after a pause:
    // right after the page grew, a jump would stop at the old height.
    lenis.resize();
    lenis.scrollTo(y, { immediate, force: immediate });
  } else window.scrollTo({ top: y, behavior: immediate ? "instant" : "smooth" });
}

/**
 * Lets the page come to rest at y the way a wheel turn moves it (Lenis' own 0.6s glide from where
 * it is), then calls onComplete. The services ride stops the page with it: never further than the
 * hand turned, so nothing pulls.
 */
export function settlePageAt(y: number, onComplete?: () => void) {
  if (!lenis) {
    window.scrollTo({ top: y, behavior: "smooth" });
    onComplete?.();
    return;
  }
  lenis.scrollTo(y, { force: true, onComplete: () => onComplete?.() });
}

/** Moves the page on by delta as one wheel step would (from where Lenis is heading). */
export function scrollPageBy(delta: number) {
  if (!lenis) window.scrollBy({ top: delta, behavior: "smooth" });
  else settlePageAt(Math.min(lenis.limit, Math.max(0, lenis.targetScroll + delta)));
}

/**
 * A place the page stops at on its way past: `stop(from, to)` sees where a wheel step would take
 * the page and returns true when it takes the step itself (the services ride does, when the step
 * would carry the page across the stage's place). Touch, keys and the scrollbar pass freely.
 */
export function stopPageOnWheel(stop: (from: number, to: number) => boolean) {
  stopper = stop;
  return () => {
    if (stopper === stop) stopper = null;
  };
}

/**
 * Holds the page still while an overlay (the phone menu) is open or the services ride has the
 * wheel: Radix locks native scrolling, but Lenis would keep moving the page on wheel input.
 */
export function pauseSmoothScroll(paused: boolean) {
  if (paused) lenis?.stop();
  else lenis?.start();
}

// Smooth wheel and trackpad scrolling for the whole site: Lenis on the window, driven by GSAP's
// ticker so it moves in step with every ScrollTrigger. Touch stays native; with reduced motion
// Lenis steps aside on its own. In-page anchors glide and still stop below the header
// (scroll-margin in globals.css); a link to another page drops any leftover inertia.
export function SmoothScroll() {
  useEffect(() => {
    const instance = new Lenis({
      anchors: true,
      stopInertiaOnNavigate: true,
      // A timed glide instead of Lenis' default lerp: the lerp's exponential tail crawls on for
      // ~0.6s at under a pixel per frame, so the page stopped in visible one-pixel steps with
      // pauses between them. An ease-out over a fixed time comes to rest in a few frames.
      lerp: 0,
      duration: 0.6,
      easing: (t) => 1 - (1 - t) ** 3,
      // While a section holds the page (holdPage), its wheel and touch are not Lenis' to scroll.
      virtualScroll: ({ deltaY, event }) => {
        if (holder) return false;
        if (stopper && event.type.includes("wheel") && !event.ctrlKey) {
          const from = instance.targetScroll;
          const to = Math.min(instance.limit, Math.max(0, from + deltaY));
          if (stopper(from, to)) {
            // Handed past Lenis, the event would also scroll the page natively for a frame.
            if (event.cancelable) event.preventDefault();
            return false;
          }
        }
        return true;
      },
    });
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

/**
 * A section takes the wheel: the page stands still until `releasePage`, or until code scrolls it
 * (scrollPageTo), which calls `release` first so the section lets go. The section itself must
 * prevent the native scroll of the input it takes (the services ride's Observer does).
 */
// Not lenis.stop(): that sets overflow: clip on <html>, the scrollbar goes, and the whole page
// shifts sideways by its width, and back on release. Lenis runs on and only ignores the wheel;
// the holder takes it (and prevents the native scroll) itself.
export function holdPage(release: () => void) {
  holder = release;
}

export function releasePage() {
  holder = null;
}
