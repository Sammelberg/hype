import type { gsap } from "gsap";

// What a scroll scene may animate: the properties the browser moves on the compositor, without
// layout or paint. Everything a scene changes on every scrolled frame must be one of these; a
// clip-path, filter, size, colour or font weight is laid out or painted again on each frame and
// stutters under load (docs/motion-architecture.md, „Свойства“).
export const COMPOSITED = [
  "x",
  "y",
  "z",
  "xPercent",
  "yPercent",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
  "rotation",
  "rotationX",
  "rotationY",
  "rotateX",
  "rotateY",
  "skewX",
  "skewY",
  "opacity",
  "autoAlpha",
] as const;

// Settings of a tween that are not drawn on every frame.
export const TIMING = [
  "duration",
  "ease",
  "stagger",
  "delay",
  "immediateRender",
  "transformOrigin",
  "force3D",
] as const;

export type CompositedProp = (typeof COMPOSITED)[number];
export type CompositedVars = Partial<Record<CompositedProp, gsap.TweenValue>> &
  Partial<Pick<gsap.TweenVars, (typeof TIMING)[number]>>;

const ALLOWED = new Set<string>([...COMPOSITED, ...TIMING]);

// The keys of `vars` a scroll scene may not animate. Types already refuse them; this catches
// values that reach a scene untyped (spread objects, `as` casts).
export function nonComposited(vars: object): string[] {
  return Object.keys(vars).filter((key) => !ALLOWED.has(key));
}

export function assertComposited(vars: object): void {
  const bad = nonComposited(vars);
  if (bad.length) {
    throw new Error(
      `scrollScene: ${bad.join(", ")} is not composited and repaints on every scrolled frame. ` +
        "Use transform or opacity instead (docs/motion-architecture.md).",
    );
  }
}

// The step a scene's progress (0…1) is on, for scenes in `count` equal steps.
export function stepAt(progress: number, count: number): number {
  return Math.min(count - 1, Math.max(0, Math.floor(progress * count)));
}
