---
name: scroll-motion
description: Build, change or repair scroll-driven motion — scroll scenes, scrub, sticky or pinned sections, horizontal galleries, parallax, Lenis smooth scrolling — and scroll jank ("ruckelt", "тормозит", stutter while scrolling). Load before writing any animation tied to the scroll position.
---

# Scroll motion

Every scroll effect goes through one door (`src/lib/motion/`, `src/components/motion/`) and moves only composited properties, so a page with GSAP and Lenis scrolls without dropped frames. The why, the replacement table and a worked example: [`docs/motion-architecture.md`](../../../docs/motion-architecture.md). The owner's effects are kept: a stutter is repaired by making the effect cheap, never by removing or stepping it.

## Steps

1. **Name the effect and its consequence.** Write down what the visitor sees per scroll position ("row travels left by its overflow while the section holds the screen"). Settle the term with `animation-vocabulary` if the request is vague. Done when each effect has a checkable end state.
2. **Map it onto composited properties.** Only `x`/`y`/`xPercent`/`yPercent`, `scale*`, `rotate*`, `skew*`, `opacity`/`autoAlpha` change per frame. A clip, blur, darkening, growing bar, colour or weight change takes the cheap form from the table in the doc. Done when no per-frame value is laid out or painted.
3. **Build it through the door.**
   - Scroll-linked: `scrollScene({ trigger, start, end }, (scene) => scene.to(…))` from `@/lib/motion/scene`, inside `useGSAP(() => gsap.matchMedia().add(MOTION, …))`.
   - Holds the screen: wrap in `<StickyStage length="…svh">`, trigger the `[data-sticky-stage]` holder with the default start and end.
   - Discrete states (cards, chapters, labels): `steps: { count, onStep }`; set a `data-*` attribute or React state only there.
   - Smooth scrolling: `<SmoothScroll />` once in `(frontend)/layout.tsx`, nothing else.
   - Time-based UI motion: `motion/react`, or `gsap` from `@/lib/motion/gsap` without `scrollTrigger`.
     Done when `pnpm typecheck` and `pnpm lint` pass with no cast or disable comment around motion code.
4. **Keep the page complete without motion.** Reduced motion and no JS show the final layout; `StickyStage` collapses to a plain section. Done when the page reads fully with `prefers-reduced-motion: reduce`.
5. **Hold the budget.** Pause videos and loops off-screen; `prefetch={false}` on link-heavy long pages; images carry `sizes`. Run `pnpm exec playwright test e2e/scroll-budget.spec.ts --project=chromium` against a production build. Done when it passes on every route the change touches.
6. **Verify on real input** with `verify-interaction` (wheel, trackpad, touch), and on the owner's device when they reported the jank. Done when the consequence from step 1 holds for each input profile.

## Repairing jank

Record before changing anything: DevTools → Performance, scroll through the section, then name the cause — long task, per-frame Layout/Paint, a script pin, a per-frame state update, media or prefetch. Replace that one cause (step 2–5) and re-run the budget. The effect looks the same afterwards.
