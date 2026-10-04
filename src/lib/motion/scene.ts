import { assertComposited, stepAt, type CompositedVars } from "./composited";
import { gsap, ScrollTrigger } from "./gsap";

type Targets = gsap.TweenTarget;
type Position = gsap.Position;
type Edge = string | number | ((self: ScrollTrigger) => string | number);

export interface SceneOptions {
  trigger: Element | string;
  start?: Edge;
  end?: Edge;
  // true follows the scroll exactly; a number (seconds) lets the scene catch up softly.
  scrub?: true | number;
  // A scene in equal steps: onStep runs only when the step changes, never on every frame.
  steps?: { count: number; onStep: (step: number) => void };
}

// The timeline a scene is built on: only composited properties (composited.ts), checked by
// type and again at runtime.
export class Scene {
  constructor(readonly timeline: gsap.core.Timeline) {}

  to(targets: Targets, vars: CompositedVars, position?: Position) {
    assertComposited(vars);
    this.timeline.to(targets, { ease: "none", ...vars }, position);
    return this;
  }

  from(targets: Targets, vars: CompositedVars, position?: Position) {
    assertComposited(vars);
    this.timeline.from(targets, { ease: "none", ...vars }, position);
    return this;
  }

  fromTo(targets: Targets, from: CompositedVars, to: CompositedVars, position?: Position) {
    assertComposited(from);
    assertComposited(to);
    this.timeline.fromTo(targets, from, { ease: "none", ...to }, position);
    return this;
  }

  set(targets: Targets, vars: CompositedVars, position?: Position) {
    assertComposited(vars);
    this.timeline.set(targets, vars, position);
    return this;
  }
}

// A scroll-linked scene. Call it inside useGSAP(() => gsap.matchMedia().add(MOTION, …)) so it
// is reverted with the component and absent under reduced motion. A scene that holds the screen
// stands in <StickyStage> (CSS sticky) and takes the stage's holder as trigger with the default
// start and end; ScrollTrigger's `pin` is not offered (it moved the section from JavaScript a
// frame after the page and jumped where it began and ended).
export function scrollScene(options: SceneOptions, build: (scene: Scene) => void) {
  const { trigger, start = "top top", end = "bottom bottom", scrub = true, steps } = options;
  let current = -1;
  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger,
      start,
      end,
      scrub,
      invalidateOnRefresh: true,
      onUpdate: steps
        ? (self) => {
            const step = stepAt(self.progress, steps.count);
            if (step === current) return;
            current = step;
            steps.onStep(step);
          }
        : undefined,
    },
  });
  build(new Scene(timeline));
  return timeline;
}
