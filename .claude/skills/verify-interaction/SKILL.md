---
name: verify-interaction
description: Verify scroll- and gesture-driven UI against real input before calling it done. Use when a change reacts to wheel, trackpad, touch or keyboard scrolling (pinned or stepped sections, snapping, Lenis, ScrollTrigger), when a motion effect needs frame-by-frame proof, or when the user reports that it "still behaves the same" although tests pass.
---

# Verify interaction

Scroll behaviour depends on the input device: one wheel notch, a trackpad flick and a touch swipe produce different event streams, and a headless run proves only the profile it replayed. The reference implementation is `e2e/manifesto.spec.ts`; copy its helpers rather than writing a throwaway script.

## Steps

1. **Name the consequence per input.** Write down, for one input of each profile below, what must be true afterwards ("one notch → next phrase, section top at 0"). Done when every profile the feature responds to has a checkable consequence.
2. **Expose the state.** Give the component a `data-*` attribute that carries the state under test (`data-active` on the manifesto). Assertions read that, never class names or opacity.
3. **Encode it as an e2e spec** in `e2e/`, following `manifesto.spec.ts`:
   - hide Reticle overlays in `beforeEach` (they catch clicks and the wheel);
   - on the homepage, wait for `<html class="lenis">`; wheel input before Lenis runs is native scrolling and gives false failures;
   - send one input, then poll until the section stops moving (glides run up to ~1s) before asserting;
   - skip wheel-only behaviour on the `mobile` project.
     Done when the spec fails on the reported bug (revert the fix or reason it through) and passes with it.
4. **Run it red-proof**: `pnpm exec playwright test e2e/<spec> --repeat-each=3`. Done when all repeats pass.
5. **Look at the motion** when the change is visual: screenshot a `clip` of the element at ~40% of the transition duration and once settled, then read the images. Done when the mid-frame shows the intended movement and the settled frame shows no clipping.
6. **Confirm on the user's device** before reporting done. Ask which input (mouse wheel, trackpad, touch) and browser they use when it is unknown. If they report no change while the spec passes, the input differs from every profile you replayed: log the decision points with a temporary `console.log`, reload their tab (`reticle_navigate` with `reload`), ask them to repeat the gesture, and read `reticle_observe` with `console`. Remove the logging afterwards.

## Input profiles

| Profile              | Replay with `page.mouse.wheel`                                |
| -------------------- | ------------------------------------------------------------- |
| Wheel notch, Linux   | one event of 53px (Chrome on Linux; the smallest common step) |
| Wheel notch, Win/mac | one event of 100–120px                                        |
| Fast wheel spin      | notches 250ms apart; each must still count                    |
| Trackpad flick       | ~60 events, 16ms apart, decaying from 60px (`60·e^(-k/15)`)   |
| Keyboard / scrollbar | `window.scrollTo` or `PageDown`; no wheel events at all       |

A `window.scrollTo` jump followed by a wheel event can leave Lenis on its old position; drive with the wheel, or send a 1px wheel event first.
