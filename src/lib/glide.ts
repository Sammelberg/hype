// The curve of a glide that takes over a page already in motion: it starts at exactly the speed
// and direction the page has and comes to rest at the target, with no jump in speed anywhere.
// A cubic from (0, 0) to (1, 1) with the slope `c` at the start and 0 at the end:
//   p(t) = (c − 2)·t³ + (3 − 2c)·t² + c·t
// For c in [0, 3] it moves only forward; below 0 it first runs on the way the page was going
// and turns round smoothly (the page had overshot); above 3 it would overshoot the target. Outside
// [−2, 3] the glide is shortened until the slope fits. Pure, for tests.

/** Slope at the start (the page's speed in units of distance per duration). */
const MAX_SLOPE = 3;
const MIN_SLOPE = -2;

export function carryCurve(
  distance: number,
  speed: number,
  { duration, shortest = 0.2 }: { duration: number; shortest?: number },
) {
  if (Math.abs(distance) < 1) return { duration: 0, easing: (t: number) => t };
  // The page's speed along the way to the target (negative: moving away from it).
  const along = speed * Math.sign(distance);
  let c = (along * duration) / Math.abs(distance);
  // Outside the range the glide is shortened until the slope fits: the start speed still matches.
  if (c > MAX_SLOPE || c < MIN_SLOPE) {
    const limit = c > MAX_SLOPE ? MAX_SLOPE : MIN_SLOPE;
    duration = Math.max(shortest, (limit * Math.abs(distance)) / along);
    c = (along * duration) / Math.abs(distance);
  }
  c = Math.max(MIN_SLOPE, Math.min(MAX_SLOPE, c));
  return { duration, easing: (t: number) => (c - 2) * t ** 3 + (3 - 2 * c) * t ** 2 + c * t };
}
