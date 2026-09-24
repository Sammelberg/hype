import type Lenis from "lenis";
import type { VirtualScrollData } from "lenis";

// The homepage's Lenis instance while it runs (null with reduced motion or off the homepage),
// so controls can scroll through Lenis instead of fighting it with native smooth scrolling.
let current: Lenis | null = null;

export function setSmoothScroll(lenis: Lenis | null) {
  current = lenis;
}

export function scrollToTop() {
  if (current) current.scrollTo(0);
  else window.scrollTo({ top: 0 });
}

// Overlays (the site menu) hold the page still while open; Lenis would otherwise keep scrolling
// on wheel events that Radix's scroll lock does not see.
export function pauseSmoothScroll(paused: boolean) {
  if (paused) current?.stop();
  else current?.start();
}

// Wheel stepping: a section that moves in steps (the manifesto) registers a stepper while it
// runs. Each new wheel gesture is offered to it; when it takes one, the rest of that gesture is
// swallowed until the wheel has been quiet for GESTURE_GAP ms (trackpad inertia coasts on for a
// second or more), so a flick moves one step and every separate mouse notch moves one step.
const GESTURE_GAP = 180;
let stepper: ((direction: 1 | -1) => boolean) | null = null;
let holding = false;
let lastWheel = 0;

export function setWheelStepper(fn: typeof stepper) {
  stepper = fn;
}

// Swallows the rest of the running wheel gesture (a section settling the page as it arrives).
export function holdGesture() {
  holding = true;
}

// Lenis' `virtualScroll` option; returning false skips Lenis, so the event is cancelled here.
export function filterWheel({ event, deltaY }: VirtualScrollData) {
  // A stopped Lenis (open menu) cancels the wheel itself; nothing may step behind the overlay.
  if (!event.type.includes("wheel") || deltaY === 0 || current?.isStopped) return true;
  const now = performance.now();
  const fresh = now - lastWheel > GESTURE_GAP;
  lastWheel = now;
  if (fresh) holding = Boolean(stepper?.(deltaY > 0 ? 1 : -1));
  if (!holding) return true;
  if (event.cancelable) event.preventDefault();
  return false;
}

// Glides to `top` through Lenis; a later glide takes over a running one. Returns false without
// Lenis (reduced motion, off the homepage); callers then leave the native scroll alone.
export function glideTo(top: number, onComplete?: () => void, duration = 0.6) {
  if (!current) return false;
  current.scrollTo(top, {
    duration,
    easing: (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
    onComplete: () => onComplete?.(),
  });
  return true;
}
