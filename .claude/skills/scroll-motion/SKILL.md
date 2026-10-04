---
name: scroll-motion
description: Build, review, repair or migrate site motion — scroll scenes, parallax, sticky or pinned sections, horizontal galleries, reveals, word-by-word text, loops, canvas, Lenis — and jank ("ruckelt", "тормозит", stutter, slow phone). Load before any animation on the site, a review of motion code, or a complaint that a page is slow.
---

# Site motion

Motion on the site runs on the compositor, so a page with GSAP and Lenis scrolls without dropped frames on a phone. Every rule, the effect → tool table, the costly → cheap table and the budget are in [`docs/motion-architecture.md`](../../../docs/motion-architecture.md): read the parts the task touches before writing code. A stutter is repaired by making the effect cheap, never by removing or stepping it. `/next/bewegung` shows every part working.

Pick the branch, then follow its steps.

## Build an effect

1. **Name the effect and its end state.** What the visitor sees at each scroll position or moment ("row travels left by its overflow while the section holds the screen"). Settle a vague term with `animation-vocabulary` via `skill-router`. Done when each effect has a checkable end state.
2. **Find its row** in „Какой инструмент для какого эффекта" and use that tool:
   - moves with the scroll: `scrollTween` / `scrollScene` from `@/lib/motion/scene`, inside `useGSAP(() => gsap.matchMedia().add(MOTION, …))`;
   - holds the screen: `<StickyStage length="…svh">`, the scene's trigger is its `[data-sticky-stage]` holder;
   - discrete states: `steps: { count, onStep }`, a `data-*` attribute or React state set only there;
   - arrives once: `<Reveal>` (`order` for a row), text inside as `<Worte>`;
   - loops: CSS keyframes on transform/opacity inside `<Schleife>`; canvas/rAF gated by `useSichtbar`;
   - links: `<Verweis>`; time-based UI motion: `motion/react` or `gsap` from `@/lib/motion/gsap`.
     Done when `pnpm typecheck` and `pnpm lint` pass with no cast or disable comment around motion code.
3. **Map it onto composited properties** — `x`/`y`/`xPercent`/`yPercent`, `scale*`, `rotate*`, `opacity`. A clip, blur, darkening, growing bar, colour or weight takes its cheap form from „Свойства". Done when nothing per frame is laid out or painted.
4. **Keep the page whole without motion.** The h1 and the first screen stand from the first paint; reduced motion and no JS show the final layout. Done when the page reads fully with `prefers-reduced-motion: reduce` and with scripts off.
5. **Hold the budget.** `pnpm exec playwright test e2e/scroll-budget.spec.ts --project=chromium` against a production build; a new kind of part also gets its case in `e2e/bewegung.spec.ts` and the demo. Done when both pass on every route the change touches.
6. **Verify on real input** with `verify-interaction` (wheel, trackpad, touch), and on the owner's device when they reported jank. Done when step 1's end states hold for each input.

## Repair jank

1. **Measure before touching code:** DevTools → Performance on a 4× slowed CPU, scroll through the section and rest 3 s; the budget spec gives the same numbers. Done when the cause is named with a figure — a long task, per-frame layout or paint, a loop at rest, a per-frame callback, media, prefetch.
2. **Replace that one cause** with the rule that covers it. The effect looks the same afterwards.
3. **Re-run the budget and the previous profile.** Done when the figure from step 1 is under its threshold.

## Review motion code

Check every rule of the document's „Правила" against the diff or the project, and report each breach as `file:line`, the rule's number and the fix. Done when every rule was applied to every motion file the change touches, with no rule skipped as "probably fine".

## Migrate an older project

Follow „Перенос старого проекта" in the document, one step per change, with the budget measured before and after each. Start with the background (loops, canvas): the largest gain, and the site looks the same.
