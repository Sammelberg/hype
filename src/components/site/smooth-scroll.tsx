"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

import { carryCurve } from "@/lib/glide";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let holder: (() => void) | null = null;
// The glide that a wheel turn or swipe extends instead of interrupting (glidePageTo's `follow`).
let following: ((delta: number) => void) | null = null;

/**
 * Scrolls the page to y: through Lenis while it runs, so the two never fight; natively otherwise.
 * An immediate jump is forced, so Lenis does not glide on toward a target it had before.
 */
export function scrollPageTo(y: number, { immediate = false } = {}) {
  // A scroll from code (an anchor, the admin's preview) outranks a section that holds the page.
  const release = holder;
  holder = null;
  following = null;
  release?.();
  if (lenis) {
    // Lenis clamps to the page height it last measured, and measures a resize only after a pause:
    // right after the page grew, a jump would stop at the old height.
    lenis.resize();
    lenis.scrollTo(y, { immediate, force: immediate });
  } else window.scrollTo({ top: y, behavior: immediate ? "instant" : "smooth" });
}

/**
 * Glides the page to y over `duration` seconds on a curve of its own, deaf to wheel and keys
 * meanwhile unless `lock` is off (then the hand can take the page over and onComplete may never
 * come), then calls onComplete. The services ride docks and leaves with it, the hero pulls with it.
 */
export function glidePageTo(
  y: number,
  {
    duration,
    easing,
    onComplete,
    carry = false,
    follow = false,
  }: {
    duration: number;
    easing?: (t: number) => number;
    onComplete?: () => void;
    /**
     * Take over the page in motion: the curve starts at exactly the speed and direction it
     * already has (src/lib/glide.ts), whatever that is, and settles on y. No push, no brake.
     */
    carry?: boolean;
    /**
     * Open to the hand: a wheel turn or swipe while it glides moves the target on by as much and
     * the glide carries on from its speed toward it, so turning on never brakes the page.
     * Without it the glide is deaf to wheel and keys meanwhile.
     */
    follow?: boolean;
  },
) {
  following = null;
  if (!lenis) {
    window.scrollTo({ top: y, behavior: "smooth" });
    window.setTimeout(() => onComplete?.(), duration * 1000);
    return;
  }
  const instance = lenis;
  let target = y;
  const run = (curve: boolean) => {
    let d = duration;
    let e = easing;
    if (curve) {
      // Lenis' velocity is px per frame; the last frame's length makes it px per second, at any
      // refresh rate (60, 120, 144 Hz).
      const frame = gsap.ticker.deltaRatio(60) / 60;
      const speed = instance.velocity / Math.max(frame, 1 / 240);
      ({ duration: d, easing: e } = carryCurve(target - instance.animatedScroll, speed, {
        duration,
      }));
    }
    instance.scrollTo(target, {
      duration: d,
      easing: e,
      lock: !follow,
      force: true,
      onComplete: () => {
        if (following === extend) following = null;
        onComplete?.();
      },
    });
  };
  const extend = (delta: number) => {
    target = Math.min(instance.limit, Math.max(0, target + delta));
    run(true);
  };
  if (follow) following = extend;
  instance.resize();
  run(carry);
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
        if (following) {
          // Handed past Lenis, the event would also scroll the page natively for a frame, and
          // Lenis would pull it back: a jolt the eye sees.
          if (event.cancelable) event.preventDefault();
          following(deltaY);
          return false;
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
