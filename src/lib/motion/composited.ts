import type { Channel, Value } from "./keyframes";

// What a scroll scene may animate: the properties the browser moves on the compositor, without
// layout or paint. A clip-path, filter, size, colour or font weight is laid out or painted again
// on every scrolled frame and stutters under load (docs/motion-architecture.md, „Свойства“).
export const CHANNELS = [
  "x",
  "y",
  "xPercent",
  "yPercent",
  "rotate",
  "rotateX",
  "rotateY",
  "scale",
  "scaleX",
  "scaleY",
  "opacity",
] as const satisfies readonly Channel[];

// GSAP's names for the rotations work too.
export const ALIASES = {
  rotation: "rotate",
  rotationX: "rotateX",
  rotationY: "rotateY",
} as const satisfies Record<string, Channel>;

// A value, or one per element (index in the targets).
export type Resolver = Value | ((element: Element, index: number) => Value);

export type CompositedVars = Partial<
  Record<(typeof CHANNELS)[number] | keyof typeof ALIASES, Resolver>
> & {
  transformOrigin?: string;
};

const ALLOWED = new Set<string>([...CHANNELS, ...Object.keys(ALIASES), "transformOrigin"]);

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
