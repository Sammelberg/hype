// Keyframes for scroll scenes (scene.ts), from port's scrub-keyframes. A scene is written like a
// GSAP timeline: segments that move one channel of one element (x, scale, opacity …) from a value
// to another between two timeline times. Only composited channels exist: the browser moves them
// without layout or paint (docs/motion-architecture.md). This turns an element's segments into one Web Animations
// keyframe list whose offsets are positions on the page's whole scroll range, so the browser plays
// it on a scroll timeline in step with the scroll, off the main thread for transform and opacity.

export type Channel =
  | "x"
  | "y"
  | "xPercent"
  | "yPercent"
  | "rotate"
  | "rotateX"
  | "rotateY"
  | "scale"
  | "scaleX"
  | "scaleY"
  | "opacity";

export type Value = number | string;

export interface Segment {
  channel: Channel;
  t0: number;
  t1: number;
  // Missing: the channel's value at t0 (where the segment before it ended, else its rest value).
  from?: Value;
  to: Value;
  ease: (progress: number) => number;
  linear: boolean;
}

// Scroll positions in px: the scene runs from `start` to `end` of a page that scrolls `max`.
export interface Range {
  start: number;
  end: number;
  max: number;
}

const REST: Record<Channel, Value> = {
  x: 0,
  y: 0,
  xPercent: 0,
  yPercent: 0,
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
};

const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;

// Numbers interpolate; strings of the same shape interpolate number by number, in the units of the
// target ("inset(6% 4% round 2rem)" → "inset(0% 0% round 0rem)"); anything else switches halfway.
export function interpolate(from: Value, to: Value, p: number): Value {
  if (typeof from === "number" && typeof to === "number") return from + (to - from) * p;
  const a = String(from).match(NUMBER) ?? [];
  const b = String(to).match(NUMBER) ?? [];
  if (a.length && a.length === b.length) {
    let i = 0;
    return String(to).replace(NUMBER, () => {
      const v = Number(a[i]) + (Number(b[i]) - Number(a[i])) * p;
      i++;
      return String(Math.round(v * 1e4) / 1e4);
    });
  }
  return p < 0.5 ? from : to;
}

// The channel's value at time t, GSAP's way: segments in start order, a later one takes over from
// its start; before the first one the channel holds that segment's start value.
function valueAt(segments: Segment[], t: number): Value {
  let value: Value | undefined;
  for (const s of segments) {
    const from = s.from ?? value ?? REST[s.channel];
    if (value === undefined) value = from;
    if (t < s.t0) break;
    value =
      t >= s.t1 || s.t1 === s.t0
        ? s.to
        : interpolate(from, s.to, s.ease((t - s.t0) / (s.t1 - s.t0)));
  }
  return value ?? REST[segments[0]!.channel];
}

const num = (v: Value | undefined, fallback: number) =>
  v === undefined ? fallback : typeof v === "number" ? v : parseFloat(v) || 0;

// "12px", "-8%", "calc(12px + -8%)": px and percent parts of one axis, zero parts left out.
const axis = (px: number, percent: number) => {
  if (!percent) return `${px}px`;
  return px ? `calc(${px}px + ${percent}%)` : `${percent}%`;
};

type State = Partial<Record<Channel, Value>>;

// One keyframe's CSS properties from the channel values. Transforms use the individual translate,
// rotate and scale properties: they leave the element's `transform` to its CSS entrance
// animations, and the browser composites them like a transform. Like GSAP's transform, they
// replace what the element's CSS sets for the same property (Tailwind's scale-x-0 on a bar).
function toCss(state: State): Keyframe {
  const kf: Keyframe = {};
  const has = (...cs: Channel[]) => cs.some((c) => c in state);
  if (has("x", "y", "xPercent", "yPercent")) {
    kf.translate = `${axis(num(state.x, 0), num(state.xPercent, 0))} ${axis(num(state.y, 0), num(state.yPercent, 0))}`;
  }
  const rotations = ["rotate", "rotateX", "rotateY"].filter((c) => c in state) as Channel[];
  if (rotations.length > 1) {
    kf.transform = rotations.map((c) => `${c}(${num(state[c], 0)}deg)`).join(" ");
  } else if (rotations[0] === "rotate") {
    kf.rotate = `${num(state.rotate, 0)}deg`;
  } else if (rotations[0]) {
    kf.rotate = `${rotations[0] === "rotateX" ? "x" : "y"} ${num(state[rotations[0]], 0)}deg`;
  }
  if (has("scale", "scaleX", "scaleY")) {
    const s = num(state.scale, 1);
    kf.scale = `${s * num(state.scaleX, 1)} ${s * num(state.scaleY, 1)}`;
  }
  if ("opacity" in state) kf.opacity = num(state.opacity, 1);
  return kf;
}

// Eased segments are sampled this many times; linear ones need only their ends, the browser
// interpolates between keyframes in a straight line.
const SAMPLES = 16;

// The element's keyframes on the page's scroll range. `duration` is the scene's length in timeline
// units, mapped onto range.start…range.end. An instant change (a set, or a segment starting where the value jumps) gets two keyframes
// at the same offset.
export function buildKeyframes(segments: Segment[], duration: number, range: Range): Keyframe[] {
  const byChannel = new Map<Channel, Segment[]>();
  for (const s of [...segments].sort((a, b) => a.t0 - b.t0)) {
    byChannel.set(s.channel, [...(byChannel.get(s.channel) ?? []), s]);
  }
  const total = Math.max(duration, 1e-6);
  const state = (t: number) => {
    const out: State = {};
    for (const [channel, list] of byChannel) out[channel] = valueAt(list, t);
    return out;
  };

  const max = Math.max(range.max, 1e-6);
  const span = range.end - range.start;
  const offsetOf = (t: number) => (range.start + (t / total) * span) / max;
  const timeOf = (offset: number) => {
    const scroll = offset * max;
    if (span <= 0) return scroll >= range.start ? total : 0;
    return Math.min(1, Math.max(0, (scroll - range.start) / span)) * total;
  };

  const times = new Set<number>([0, total]);
  // Where a value may jump: a set, or a segment whose own start value differs from the one before.
  const jumps = new Set<number>();
  for (const s of segments) {
    times.add(s.t0).add(s.t1);
    if (s.t1 === s.t0 || s.from !== undefined) jumps.add(s.t0);
    if (!s.linear && s.t1 > s.t0) {
      for (let i = 1; i < SAMPLES; i++) times.add(s.t0 + ((s.t1 - s.t0) * i) / SAMPLES);
    }
  }
  const offsets = new Map<number, number | null>([
    [0, null],
    [1, null],
  ]);
  for (const t of times) {
    const o = offsetOf(t);
    if (o > 0 && o < 1) offsets.set(o, t);
  }

  const epsilon = total * 1e-6;
  const frames: Keyframe[] = [];
  for (const [offset, at] of [...offsets].sort((a, b) => a[0] - b[0])) {
    const t = at ?? timeOf(offset);
    if (at !== null && at > 0 && jumps.has(at)) {
      const before = toCss(state(t - epsilon));
      const after = toCss(state(t));
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        frames.push({ ...before, offset });
        frames.push({ ...after, offset });
        continue;
      }
    }
    frames.push({ ...toCss(state(t)), offset });
  }
  return frames;
}
