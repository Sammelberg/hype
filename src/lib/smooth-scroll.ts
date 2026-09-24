import type Lenis from "lenis";

// The running Lenis instance, if a page starts one (null by default and with reduced motion).
// A page with scroll-driven motion creates Lenis in its GSAP setup and registers it here, so shared
// UI (the site menu) can hold it still; see the gsap-scrolltrigger and gsap-react skills.
let current: Lenis | null = null;

export function setSmoothScroll(lenis: Lenis | null) {
  current = lenis;
}

// Overlays (the site menu) hold the page still while open; Lenis would otherwise keep scrolling
// on wheel events that Radix's scroll lock does not see.
export function pauseSmoothScroll(paused: boolean) {
  if (paused) current?.stop();
  else current?.start();
}
