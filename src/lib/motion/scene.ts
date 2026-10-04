import {
  ALIASES,
  assertComposited,
  type CompositedVars,
  type Resolver,
  stepAt,
} from "./composited";
import { gsap, ScrollTrigger } from "./gsap";
import { buildKeyframes, type Channel, type Segment } from "./keyframes";

// Scroll scenes, played by the browser (from port's scroll-scrub, where it replaced GSAP's scrub).
// A scene reads like a GSAP timeline (fromTo, to, set, hold; positions and durations in timeline
// units; GSAP eases) and ScrollTrigger says where on the page it runs, but the motion becomes Web
// Animations on the page's scroll timeline: the browser moves the elements with the scroll in the
// same frame, off the main thread. GSAP's scrub set every value from JavaScript one frame after
// the page had moved, so each scene trailed the scroll and stuttered whenever the main thread was
// busy. Browsers without scroll timelines play the same animations from the scroll position on
// each scroll event.

export interface TweenOptions {
  // Start on the scene's timeline; default: where the scene currently ends.
  at?: number;
  duration?: number;
  // A GSAP ease name, or a function of the segment's progress for motion no ease describes.
  ease?: string | ((progress: number) => number);
  // Each further target starts this much later.
  stagger?: number;
}

type Targets = gsap.TweenTarget;
type Edge = string | number | ((self: ScrollTrigger) => string | number);

export interface SceneOptions {
  trigger: Element | string;
  start?: Edge;
  end?: Edge;
  // A scene in equal steps: onStep runs only when the step changes, never on every frame.
  steps?: { count: number; onStep: (step: number) => void };
}

interface Pending {
  channel: Channel;
  t0: number;
  t1: number;
  from?: Resolver;
  to: Resolver;
  ease: string | ((progress: number) => number);
  index: number;
}

const scrollTimelines = typeof ScrollTimeline === "function";
// Where animation ranges exist, each animation covers only its scene's stretch of the scroll:
// before and after it holds its end frames without being sampled. Spread over the whole page
// (keyframe offsets), every scene was active on every frame, and the browser restyled all of
// them each time the page moved.
const ranged =
  scrollTimelines && typeof Animation === "function" && "rangeStart" in Animation.prototype;

const live = new Set<Scene>();

let pageTimeline: ScrollTimeline | undefined;
const pageScroll = () =>
  (pageTimeline ??= new ScrollTimeline({
    source: document.scrollingElement ?? document.documentElement,
  }));

// Every scene is measured with no scene's motion on the page: ScrollTrigger and the scenes' own
// values read the layout, and a moved trigger or neighbour would skew them.
function liftAll() {
  for (const scene of live) scene.lift();
}

function rebuildAll() {
  liftAll();
  const apply = [...live].map((scene) => scene.prepare());
  for (const run of apply) run();
}

// New scenes are built together once the code that made them has run, before the page paints.
let scheduled = false;
function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    rebuildAll();
  });
}

let watching = false;
function watch() {
  if (watching || typeof window === "undefined") return;
  watching = true;
  // Positions change with every ScrollTrigger refresh (resize, fonts) and offsets with the page's
  // height, which also changes without one (content below loading in).
  ScrollTrigger.addEventListener("refreshInit", liftAll);
  ScrollTrigger.addEventListener("refresh", rebuildAll);
  let height = document.documentElement.scrollHeight;
  let queued = 0;
  new ResizeObserver(() => {
    const next = document.documentElement.scrollHeight;
    if (next === height || queued) return;
    height = next;
    queued = requestAnimationFrame(() => {
      queued = 0;
      rebuildAll();
    });
  }).observe(document.body);
  if (!scrollTimelines) {
    const sync = () => {
      for (const scene of live) scene.seek();
    };
    window.addEventListener("scroll", sync, { passive: true });
  }
}

const TRANSFORMS = new Set<Channel>([
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
]);

export class Scene {
  private readonly pending = new Map<Element, Pending[]>();
  private readonly animations = new Map<Element, Animation>();
  private readonly origins = new Map<Element, string>();
  private length = 0;
  private dead = false;
  readonly trigger: ScrollTrigger;

  constructor(options: SceneOptions) {
    const { trigger, start = "top top", end = "bottom bottom", steps } = options;
    let current = -1;
    // Only measures (and tells the steps); the browser plays the motion.
    this.trigger = ScrollTrigger.create({
      trigger,
      start,
      end,
      invalidateOnRefresh: true,
      onUpdate: steps
        ? (self) => {
            const step = stepAt(self.progress, steps.count);
            if (step === current) return;
            current = step;
            steps.onStep(step);
          }
        : undefined,
    });
    const destroy = () => this.destroy();
    // Recorded in the running gsap.context, so matchMedia and useGSAP revert it with the rest.
    (gsap.core as unknown as { context: (o: object) => void }).context({
      revert: destroy,
      kill: destroy,
    });
    live.add(this);
    watch();
    schedule();
  }

  duration() {
    return this.length;
  }

  fromTo(targets: Targets, from: CompositedVars, to: CompositedVars, options: TweenOptions = {}) {
    return this.add(targets, from, to, options);
  }

  to(targets: Targets, to: CompositedVars, options: TweenOptions = {}) {
    return this.add(targets, undefined, to, options);
  }

  set(targets: Targets, vars: CompositedVars, at = this.length) {
    return this.add(targets, undefined, vars, { at, duration: 0 });
  }

  // An empty stretch at the end (GSAP: tl.to({}, { duration })).
  hold(duration: number) {
    this.length += duration;
    return this;
  }

  private add(
    targets: Targets,
    from: CompositedVars | undefined,
    to: CompositedVars,
    { at = this.length, duration = 0.5, ease = "none", stagger = 0 }: TweenOptions,
  ) {
    assertComposited(to);
    if (from) assertComposited(from);
    const elements = gsap.utils.toArray<Element>(targets).filter(Boolean);
    elements.forEach((el, index) => {
      const t0 = at + index * stagger;
      const list = this.pending.get(el) ?? [];
      const { transformOrigin, ...values } = to;
      const { transformOrigin: fromOrigin, ...starts } = from ?? {};
      const origin = transformOrigin ?? fromOrigin;
      if (origin) this.origins.set(el, origin);
      // A channel only in `from` holds that value, as in GSAP.
      const keys = new Set([...Object.keys(starts), ...Object.keys(values)]);
      for (const key of keys as Set<keyof typeof values>) {
        const channel: Channel =
          key in ALIASES ? ALIASES[key as keyof typeof ALIASES] : (key as Channel);
        const start = starts[key];
        const end = values[key] ?? start!;
        list.push({ channel, t0, t1: t0 + duration, from: start, to: end, ease, index });
      }
      this.pending.set(el, list);
      this.length = Math.max(this.length, t0 + duration);
    });
    return this;
  }

  lift() {
    for (const animation of this.animations.values()) {
      (animation.effect as KeyframeEffect).setKeyframes([]);
    }
  }

  // Resolves the scene on the lifted page and returns the step that puts its motion back.
  prepare(): () => void {
    const max = ScrollTrigger.maxScroll(window);
    const { start, end } = this.trigger;
    // Not measured yet (ScrollTrigger refreshes after the page has loaded): hold the first frame.
    const range = end > start ? { start, end, max } : { start: max + 1, end: max + 2, max };
    const local = { start: 0, end: 1, max: 1 };
    const resolve = (value: Resolver | undefined, el: Element, index: number) =>
      typeof value === "function" ? value(el, index) : value;
    const frames = new Map<Element, Keyframe[]>();
    const moves = new Set<Element>();
    for (const [el, list] of this.pending) {
      const segments: Segment[] = list.map((p) => ({
        channel: p.channel,
        t0: p.t0,
        t1: p.t1,
        from: resolve(p.from, el, p.index),
        to: resolve(p.to, el, p.index)!,
        ease: typeof p.ease === "function" ? p.ease : gsap.parseEase(p.ease),
        linear: p.ease === "none" || p.ease === "linear",
      }));
      frames.set(el, buildKeyframes(segments, this.length, ranged ? local : range));
      if (list.some((p) => TRANSFORMS.has(p.channel))) moves.add(el);
    }
    return () => {
      if (this.dead) return;
      for (const [el, origin] of this.origins) {
        if (el instanceof HTMLElement) el.style.transformOrigin = origin;
      }
      // Each moving element keeps its own compositor layer for the whole page, set before the
      // first scrolled frame; without one each change repainted the scene around it.
      for (const el of moves) {
        if (el instanceof HTMLElement || el instanceof SVGElement)
          el.style.willChange = "transform";
      }
      const span = { rangeStart: `${range.start}px`, rangeEnd: `${range.end}px` };
      for (const [el, keyframes] of frames) {
        const existing = this.animations.get(el);
        if (existing) {
          (existing.effect as KeyframeEffect).setKeyframes(keyframes);
          if (ranged) Object.assign(existing, span);
          continue;
        }
        const animation = el.animate(keyframes, {
          fill: "both",
          easing: "linear",
          ...(scrollTimelines ? { duration: "auto", timeline: pageScroll() } : { duration: 1000 }),
          ...(ranged ? span : {}),
        });
        if (!scrollTimelines) animation.pause();
        this.animations.set(el, animation);
      }
      this.seek();
    };
  }

  // Without scroll timelines: show the frame for the current scroll position.
  seek() {
    if (scrollTimelines) return;
    const max = ScrollTrigger.maxScroll(window) || 1;
    const time = Math.min(1, Math.max(0, window.scrollY / max)) * 1000;
    for (const animation of this.animations.values()) animation.currentTime = time;
  }

  private destroy() {
    if (this.dead) return;
    this.dead = true;
    live.delete(this);
    for (const [el, animation] of this.animations) {
      animation.cancel();
      if (el instanceof HTMLElement || el instanceof SVGElement)
        el.style.removeProperty("will-change");
    }
    for (const el of this.origins.keys()) {
      if (el instanceof HTMLElement) el.style.removeProperty("transform-origin");
    }
    this.animations.clear();
    this.trigger.kill();
  }
}

// A scroll scene between the trigger's start and end. Call it inside
// useGSAP(() => gsap.matchMedia().add(MOTION, …)) so it is reverted with the component and absent
// under reduced motion. A scene that holds the screen stands in <StickyStage> (CSS sticky) and
// takes the stage's holder as trigger with the default start and end.
export function scrollScene(options: SceneOptions, build: (scene: Scene) => void) {
  const scene = new Scene(options);
  build(scene);
  return scene;
}

// One scene-long tween, e.g. a parallax layer: from → to while the trigger crosses its range.
export function scrollTween(
  targets: Targets,
  from: CompositedVars,
  to: CompositedVars,
  options: SceneOptions,
  tween: Omit<TweenOptions, "at"> = {},
) {
  return new Scene(options).fromTo(targets, from, to, { ...tween, at: 0 });
}
