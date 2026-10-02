"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Observer } from "gsap/Observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useRef, useState } from "react";

import { type GlyphName, ServiceGlyph } from "@/components/site/service-glyphs";
import {
  holdPage,
  releasePage,
  scrollPageBy,
  scrollPageTo,
  settlePageAt,
  stopPageOnWheel,
} from "@/components/site/smooth-scroll";
import { Button } from "@/components/ui/button";

import { FIR_DESIGNS } from "@/components/site/fir-shapes";
import { InView } from "@/components/site/in-view";
import { Lake, Mist, Moon, Pieces, SceneDefs } from "@/components/site/valley-scene";
import styles from "./services-strata.module.css";
import { type Ridge, valley, VALLEY_H, VALLEY_W, type ValleySpec } from "@/components/site/valley";
import { VALLEYS } from "@/components/site/valleys";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin, Observer);

export type Service = {
  title: string;
  /** The name on the rail. */
  short: string;
  text: string;
  /** Kinds of work this covers, shown under the text as „Zum Beispiel“. */
  examples: readonly string[];
  glyph: GlyphName;
  /** The service's own page. */
  href: string;
};

/** Light of each card: deep, sapphire and the glow at the horizon. One hue family (250 to 262). */
export const LIGHTS: readonly { a: string; b: string; glow: string }[] = [
  { a: "oklch(0.2 0.075 262)", b: "oklch(0.44 0.21 262)", glow: "oklch(0.7 0.19 258)" },
  { a: "oklch(0.17 0.055 262)", b: "oklch(0.38 0.18 260)", glow: "oklch(0.64 0.2 258)" },
  { a: "oklch(0.24 0.1 258)", b: "oklch(0.5 0.21 255)", glow: "oklch(0.78 0.14 250)" },
  { a: "oklch(0.19 0.07 262)", b: "oklch(0.42 0.2 262)", glow: "oklch(0.66 0.2 260)" },
  { a: "oklch(0.16 0.05 262)", b: "oklch(0.36 0.17 262)", glow: "oklch(0.62 0.19 258)" },
];

/** Where the stage takes the wheel and the cards ride sideways: the same query as in the styles. */
const RIDE =
  "(min-width: 64rem) and (min-height: 40rem) and (prefers-reduced-motion: no-preference)";

/** One card to the next: long enough to read as travel, soft at both ends. */
const SLIDE = { duration: 0.95, ease: "power3.inOut" };
/**
 * Every card comes to rest in the middle for at least this long (s), however fast the hand turns
 * (the owner's call, 2026-10-01: no card is skipped). Input meanwhile waits: one step, not more.
 */
const REST = 0.3;
/**
 * Input within this long of the one before is the same gesture: the notches of one turn of the
 * wheel (a hand spins several at once), a trackpad's glide. A new card needs a pause.
 */
const QUIET_MS = 300;
/** A glide may pause this long and still be the same gesture, if its steps keep shrinking. */
const TAIL_MS = 700;
/**
 * A hand that keeps turning: after the first card, every RUSH further steps of the same turn (as
 * large as the step that started it, so a notch of any wheel) move one more card. An ordinary turn of a
 * few notches stays one card.
 */
const RUSH = 6;

const VIEW = `0 0 ${VALLEY_W} ${VALLEY_H}`;
const FIR_CLASS: Record<Ridge, string | undefined> = {
  far: styles.firFar,
  mid: styles.firMid,
  near: styles.firNear,
};

function Valley({ spec, ground, firs }: { spec: ValleySpec; ground: string; firs: string }) {
  const v = valley(spec);
  const trees = (ridge: Ridge) =>
    v.firs
      .filter((fir) => fir.ridge === ridge)
      .map((fir) => {
        const [, , vw, vh] = FIR_DESIGNS[fir.design].viewBox.split(" ").map(Number);
        const w = (fir.h * vw!) / vh!;
        return (
          <use
            key={`${fir.design}-${fir.x}`}
            href={`#${firs}-${fir.design}`}
            x={r1(fir.x - w / 2)}
            y={r1(fir.y - fir.h)}
            width={r1(w)}
            height={fir.h}
            className={FIR_CLASS[ridge]}
          />
        );
      });

  const mirror = (
    <>
      <path className={styles.farRidge} d={v.ridges.far.fill} />
      <path className={styles.farEdge} d={v.ridges.far.edge} />
      {trees("far")}
      <path className={styles.midRidge} d={v.ridges.mid.fill} />
      <path className={styles.midEdge} d={v.ridges.mid.edge} />
      {trees("mid")}
      <path fill={`url(#${ground})`} d={v.ridges.near.fill} />
      <path className={styles.edge} d={v.ridges.near.edge} />
      {trees("near")}
    </>
  );

  return (
    <InView className={styles.window} aria-hidden="true">
      <div data-depth="far" className={styles.depth}>
        <svg viewBox={VIEW} preserveAspectRatio="xMidYMax slice">
          <SceneDefs v={v} prefix={ground} />
          {v.stars.map((s) => (
            <circle
              key={`${s.x}-${s.y}`}
              className={styles.star}
              cx={s.x}
              cy={s.y}
              r={s.r}
              opacity={s.o}
            />
          ))}
          <Moon v={v} prefix={ground} />
          <path className={styles.farRidge} d={v.ridges.far.fill} />
          <path className={styles.farEdge} d={v.ridges.far.edge} />
          <Mist v={v} ridge="far" prefix={ground} />
          {trees("far")}
        </svg>
      </div>
      <div data-depth="mid" className={styles.depth}>
        <svg viewBox={VIEW} preserveAspectRatio="xMidYMax slice">
          <path className={styles.midRidge} d={v.ridges.mid.fill} />
          <path className={styles.midEdge} d={v.ridges.mid.edge} />
          <Pieces pieces={v.motif.mid} />
          <Mist v={v} ridge="mid" prefix={ground} />
          {trees("mid")}
        </svg>
      </div>
      <div data-depth="near" className={styles.depth}>
        <svg viewBox={VIEW} preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id={ground} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className={styles.groundTop} />
              <stop offset="1" className={styles.groundBottom} />
            </linearGradient>
          </defs>
          <path fill={`url(#${ground})`} d={v.ridges.near.fill} />
          <Lake v={v} prefix={ground}>
            {mirror}
          </Lake>
          <Pieces pieces={v.motif.near} />
        </svg>
        {/* The drawn line in a layer of its own: drawing it repaints nothing else. */}
        <svg viewBox={VIEW} preserveAspectRatio="xMidYMax slice" className={styles.lines}>
          <path data-ridge className={styles.edge} d={v.ridges.near.edge} />
        </svg>
        <svg viewBox={VIEW} preserveAspectRatio="xMidYMax slice">
          {trees("near")}
        </svg>
      </div>
    </InView>
  );
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * „Was wir entwickeln“ as a gallery of framed views: five wide cards, the service on the left and
 * a window into its own Black Forest valley on the right (valley.ts). A wheel step that would carry
 * the page past the stage's place under the header stops it there, from either side; from then on
 * each gesture (a wheel turn, a trackpad swipe, an arrow or page key) moves exactly one card into
 * the middle — forward coming down, back coming up — and past the last (or the first) the page
 * simply scrolls on. Nothing pulls the page anywhere.
 * A card arriving shifts its ridges against each other, the near one faster than the far one, and
 * draws its ice line. A rail names the services, steps either way and jumps; focus inside a card
 * brings it to the middle. Below lg, on short screens and with reduced motion the cards form a
 * finished sideways track, centred card by card.
 */
export function ServicesStrata({
  id,
  title,
  intro,
  services,
}: {
  id: string;
  title: string;
  intro?: string;
  services: readonly Service[];
}) {
  const root = useRef<HTMLElement>(null);
  const jump = useRef<(index: number, behavior?: ScrollBehavior) => void>(() => {});
  const [current, setCurrent] = useState(0);

  useGSAP(
    () => {
      const section = root.current;
      const stage = section?.querySelector<HTMLElement>("[data-stage]");
      const track = section?.querySelector<HTMLElement>("[data-track]");
      if (!section || !stage || !track) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]", track);
      const count = cards.length;
      const last = count - 1;
      const show = (index: number) => setCurrent((was) => (was === index ? was : index));
      // The track is padded so the first card sits in the middle: card i is there at offset(i).
      const offset = (index: number) => cards[index]!.offsetLeft - cards[0]!.offsetLeft;
      const step = () => (count > 1 ? offset(1) : 1);
      const nearest = (x: number) => gsap.utils.clamp(0, last, Math.round(x / step()));

      const mm = gsap.matchMedia();

      mm.add(RIDE, () => {
        section.setAttribute("data-ride", "");
        // The track is no longer a scroll region of its own.
        track.removeAttribute("tabindex");
        const header = () => document.querySelector("header")?.offsetHeight ?? 64;

        // Per card, two paused timelines set from its distance to the middle (sync below): the
        // ridges shifting against each other (translation only, so the compositor moves them
        // without repainting), and the arrival (ice line, words).
        const depth = cards.map((card) => {
          const q = gsap.utils.selector(card);
          return gsap
            .timeline({ paused: true, defaults: { ease: "none" } })
            .fromTo(q("[data-depth='far']"), { xPercent: -2.5 }, { xPercent: 2.5 }, 0)
            .fromTo(q("[data-depth='mid']"), { xPercent: -1 }, { xPercent: 1 }, 0)
            .fromTo(q("[data-depth='near']"), { xPercent: 2 }, { xPercent: -2 }, 0);
        });
        const arrival = (card: HTMLElement, words: boolean, vars?: gsap.TimelineVars) => {
          const q = gsap.utils.selector(card);
          const tl = gsap
            .timeline({ defaults: { ease: "none" }, ...vars })
            .fromTo(q("[data-ridge]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.75 }, 0);
          if (words) {
            tl.fromTo(
              q("[data-copy]"),
              { x: 40, autoAlpha: 0.15 },
              { x: 0, autoAlpha: 1, duration: 0.6 },
              0,
            );
          }
          return tl;
        };
        // The first card arrives with the section itself, the others as they ride in.
        arrival(cards[0]!, false, {
          scrollTrigger: { trigger: stage, start: "top 85%", end: "top 25%", scrub: true },
        });
        const arrivals = cards.map((card, i) =>
          i === 0 ? null : arrival(card, true, { paused: true }),
        );

        const sync = () => {
          const x = -Number(gsap.getProperty(track, "x"));
          const s = step();
          cards.forEach((_, i) => {
            // 0 in the middle, 1 one place to the right (arriving), -1 one to the left (leaving).
            const t = (offset(i) - x) / s;
            depth[i]!.progress(gsap.utils.clamp(0, 1, (1 - t) / 2));
            arrivals[i]?.progress(gsap.utils.clamp(0, 1, 1 - t));
          });
        };

        // free: the page scrolls; docking: a wheel step stops the page on the stage's place;
        // docked: the stage holds the page and every gesture moves one card. Nothing ever pulls
        // the page (the owner's call, 2026-10-01): it only stops where the hand was taking it.
        let mode: "free" | "docking" | "docked" = "free";
        // The mode on the section too (data-ride-state), for the tests and nothing else.
        const setMode = (next: typeof mode) => {
          mode = next;
          section.setAttribute("data-ride-state", next);
        };
        setMode("free");
        // A card moved on while the page still came to rest: one, not more.
        let movedWhileDocking = false;
        let index = 0;
        let slide: gsap.core.Tween | null = null;
        let lastInput = Number.NEGATIVE_INFINITY;

        // Steps asked for while a card still rides or rests, taken one by one, each card resting:
        // every deliberate turn counts, a hand that keeps turning adds at most one.
        let pending: { dir: 1 | -1; delta: number }[] = [];
        let rest: gsap.core.Tween | null = null;
        const busy = () => slide !== null || rest !== null;
        const settleDown = () => {
          pending = [];
          rest?.kill();
          rest = null;
        };

        const slideTo = (to: number, instant = false) => {
          index = gsap.utils.clamp(0, last, to);
          show(index);
          slide?.kill();
          rest?.kill();
          rest = null;
          if (instant) {
            slide = null;
            gsap.set(track, { x: -offset(index) });
            sync();
            return;
          }
          slide = gsap.to(track, {
            x: -offset(index),
            ...SLIDE,
            onUpdate: sync,
            onComplete: () => {
              slide = null;
              sync();
              rest = gsap.delayedCall(REST, () => {
                rest = null;
                const next = pending.shift();
                if (next) move(next.dir, next.delta);
              });
            },
          });
        };

        // The stage's place: its top under the header (the trigger's start).
        const watcher = ScrollTrigger.create({
          trigger: stage,
          start: () => `top ${header()}`,
          end: () => `top ${header()}`,
          onUpdate: (self) => {
            // Something moved the page while the stage held it (a jump from code, the scrollbar):
            // the stage lets go instead of holding a page that has gone elsewhere.
            if (mode === "docked" && Math.abs(self.scroll() - self.start) > 2) {
              release();
              releasePage();
            }
          },
        });
        const place = () => watcher.start;

        // A wheel step that would carry the page across the place stops it there, if cards are
        // left to ride that way: coming down from the first on, coming up from the last back.
        const offStop = stopPageOnWheel((from, to) => {
          if (mode !== "free") return false;
          const at = place();
          // A step that lands within a pixel of the place reaches it too.
          const down = from < at - 1 && to >= at - 1 && index < last;
          const up = from > at + 1 && to <= at + 1 && index > 0;
          if (!down && !up) return false;
          dock();
          return true;
        });

        // Out of sight the cards wait at the end the page will meet them from: the first while the
        // stage lies wholly below the screen, the last while it lies wholly above.
        const ends = ScrollTrigger.create({
          trigger: stage,
          start: "top bottom",
          end: "bottom top",
          onLeaveBack: () => {
            if (mode === "free" && index !== 0) slideTo(0, true);
          },
          onLeave: () => {
            if (mode === "free" && index !== last) slideTo(last, true);
          },
        });

        const release = () => {
          settleDown();
          setMode("free");
          section.removeAttribute("data-held");
          observer.disable();
        };
        // The stage listens from the first moment: a turn of the wheel while the page still comes
        // to rest already moves a card, none is lost. The gesture that brought the page here runs
        // on without a pause (a trackpad's glide) and so does not count.
        const dock = () => {
          setMode("docking");
          movedWhileDocking = false;
          lastInput = performance.now();
          lastSize = 0;
          floor = Number.POSITIVE_INFINITY;
          // A fast turn that brought the page here rides on in steps of its own size.
          rush = 0;
          unit = 0;
          holdPage(release);
          section.setAttribute("data-held", "");
          observer.enable();
          settlePageAt(place(), () => {
            if (mode === "docking") setMode("docked");
          });
        };
        // Past the first or the last card the page simply scrolls on, as far as the hand turns:
        // this step, and the rest of the turn through Lenis as usual.
        const leave = (distance: number) => {
          release();
          releasePage();
          scrollPageBy(distance);
        };
        // `delta`: the step of the wheel (signed, down positive), passed on when the page leaves.
        // `rushing`: a step of a hand that keeps turning, which never queues behind another.
        const move = (dir: 1 | -1, delta: number, rushing = false) => {
          if (mode !== "docked" && mode !== "docking") return;
          // A card on its way or resting: the step waits its turn.
          if (busy()) {
            if (pending.length < last && !(rushing && pending.length > 0))
              pending.push({ dir, delta });
            return;
          }
          const next = index + dir;
          if (next < 0 || next > last) return leave(delta);
          // While the page comes to rest one card may already move on.
          if (mode === "docking") {
            if (movedWhileDocking) return;
            movedWhileDocking = true;
          }
          slideTo(next);
        };
        // One gesture, one card: one turn of the wheel of however many notches, one swipe. A
        // gesture starts after a pause (QUIET_MS), unless what comes is
        // a smaller step after a lull (a trackpad's glide tapering off on a busy machine), or
        // inside a running glide as a clear new push (a swipe while the last one still glides on).
        // A hand that keeps turning rides on: steps that do not shrink (a wheel's notches, a flick
        // speeding up; a trackpad's glide tapering off does not count) add up, every RUSH of them
        // one more card, and past the last the page scrolls on (the owner's call, 2026-10-01: fast
        // scrolling works here as everywhere).
        let lastSize = 0;
        let floor = Number.POSITIVE_INFINITY;
        let lastMove = Number.NEGATIVE_INFINITY;
        let rush = 0;
        let unit = 1;
        const gesture = (dir: 1 | -1, size: number) => {
          const now = performance.now();
          const gap = now - lastInput;
          const pause = gap > QUIET_MS;
          const go = pause
            ? !(gap < TAIL_MS && size < lastSize)
            : // A new push only after the last one had nearly died away (a trackpad's tail): a
              // wheel's notches stay as large as the first, merged ones (a busy frame) larger.
              size > floor * 2 + 4 && floor < unit / 3 && now - lastMove > QUIET_MS;
          const sustained = !pause && size >= 20 && size >= lastSize;
          floor = pause || go ? size : Math.min(floor, size);
          lastInput = now;
          lastSize = size;
          if (go) {
            rush = 0;
            unit = size;
            lastMove = now;
            move(dir, dir * size);
            return;
          }
          if (!sustained) return;
          unit ||= size;
          rush += size;
          if (rush < unit * RUSH) return;
          rush = 0;
          lastMove = now;
          move(dir, dir * size, true);
        };

        // Wheel and touch while the stage holds the page (off otherwise). wheelSpeed -1: turning
        // the wheel down, like swiping up, reads as „up“, the way on.
        const observer = Observer.create({
          target: window,
          type: "wheel,touch",
          wheelSpeed: -1,
          tolerance: 8,
          // Every event on its own: a frame's events summed would make a tapering glide look
          // like a steady turn, and a turn of single notches like a new push.
          debounce: false,
          preventDefault: true,
          onUp: (self) => gesture(1, Math.abs(self.deltaY)),
          onDown: (self) => gesture(-1, Math.abs(self.deltaY)),
        });
        observer.disable();

        const onKey = (event: KeyboardEvent) => {
          if (mode !== "docked" || event.altKey || event.ctrlKey || event.metaKey) return;
          const target = event.target as HTMLElement;
          if (target.closest("input, textarea, select, [contenteditable]")) return;
          // Home and End take the page where it asks to go: the stage lets go first.
          if (event.key === "Home" || event.key === "End") {
            release();
            releasePage();
            return;
          }
          const onward = ["ArrowDown", "ArrowRight", "PageDown"].includes(event.key);
          const back = ["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key);
          const space = event.key === " " && !target.closest("button, a");
          if (!onward && !back && !space) return;
          event.preventDefault();
          const pageKey = event.key.startsWith("Page") || space;
          const dir = onward || (space && !event.shiftKey) ? 1 : -1;
          move(dir, dir * (pageKey ? window.innerHeight * 0.8 : 100));
        };
        window.addEventListener("keydown", onKey);

        // A link to an anchor elsewhere on the page takes the page there: the stage lets go.
        const onAnchor = (event: MouseEvent) => {
          if (mode !== "docked") return;
          if ((event.target as HTMLElement).closest?.('a[href*="#"]')) {
            release();
            releasePage();
          }
        };
        document.addEventListener("click", onAnchor, true);

        // Focus leaving the section (Tab on to the next link) lets the page follow it.
        const onFocusOut = (event: FocusEvent) => {
          if (mode === "docked" && !section.contains(event.relatedTarget as Node | null)) {
            release();
            releasePage();
          }
        };
        section.addEventListener("focusout", onFocusOut);

        // Back onto the stage's exact place at once (scrollPageTo lets go; hold again).
        const snap = () => {
          scrollPageTo(place(), { immediate: true });
          setMode("docked");
          holdPage(release);
          section.setAttribute("data-held", "");
          observer.enable();
        };
        // A new size moves the stage's place and the cards' offsets: stay where we are.
        const onRefresh = () => {
          gsap.set(track, { x: -offset(index) });
          sync();
          if (mode === "docked") snap();
        };
        ScrollTrigger.addEventListener("refresh", onRefresh);

        sync();

        // The rail and focus: to card i, the page coming to rest on the stage first if it is not
        // there yet (asked for by a click, so no pull).
        jump.current = (to) => {
          if (mode === "free") dock();
          settleDown();
          slideTo(to);
        };

        // Tabbing into a card that is still off to the side brings it to the middle; the browser's
        // own scroll to the focused element is undone.
        const follow = cards.map((card, i) => {
          const onFocus = () => {
            if (mode === "docked") snap();
            jump.current(i);
          };
          card.addEventListener("focusin", onFocus);
          return () => card.removeEventListener("focusin", onFocus);
        });

        return () => {
          follow.forEach((off) => off());
          window.removeEventListener("keydown", onKey);
          document.removeEventListener("click", onAnchor, true);
          section.removeEventListener("focusout", onFocusOut);
          ScrollTrigger.removeEventListener("refresh", onRefresh);
          observer.kill();
          offStop();
          watcher.kill();
          ends.kill();
          slide?.kill();
          rest?.kill();
          if (mode !== "free") releasePage();
          gsap.set(track, { clearProps: "x" });
          section.removeAttribute("data-ride");
          section.removeAttribute("data-held");
          track.setAttribute("tabindex", "0");
        };
      });

      mm.add(`not all and ${RIDE}`, () => {
        jump.current = (index, behavior) => {
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          track.scrollTo({
            left: offset(index),
            behavior: behavior ?? (reduce ? "auto" : "smooth"),
          });
        };
        const onScroll = () => show(nearest(track.scrollLeft));
        track.addEventListener("scroll", onScroll, { passive: true });
        return () => track.removeEventListener("scroll", onScroll);
      });
    },
    { scope: root, dependencies: [services.length] },
  );

  return (
    <section
      id={id}
      ref={root}
      aria-labelledby={`${id}-titel`}
      data-current={current}
      data-cms-zone="leistungen"
      className={`${styles.section} border-t`}
    >
      <div
        className={`page-container ${styles.head} lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end lg:gap-x-16`}
      >
        <h2 id={`${id}-titel`} className={styles.heading}>
          {title}
        </h2>
        {intro ? <p className={styles.intro}>{intro}</p> : null}
      </div>

      {/* The three drawn firs, once; every valley places copies of them. */}
      <svg width="0" height="0" aria-hidden="true" className="absolute">
        {Object.entries(FIR_DESIGNS).map(([name, design]) => (
          <symbol key={name} id={`${id}-tanne-${name}`} viewBox={design.viewBox}>
            <path fill="currentColor" d={design.d} />
          </symbol>
        ))}
      </svg>

      <div data-stage className={styles.stage}>
        <ul
          data-track
          className={styles.track}
          tabIndex={0}
          aria-label="Leistungen, seitlich zu blättern"
        >
          {services.map((service, i) => {
            const light = LIGHTS[i % LIGHTS.length]!;
            return (
              <li
                key={service.title}
                data-card
                className={styles.card}
                aria-labelledby={`${id}-${i}`}
                style={{ "--a": light.a, "--b": light.b, "--glow": light.glow } as CSSProperties}
              >
                <Valley
                  spec={VALLEYS[service.glyph] ?? VALLEYS.web}
                  ground={`${id}-grund-${i}`}
                  firs={`${id}-tanne`}
                />

                <div data-copy className={styles.copy}>
                  <div className={styles.titleRow}>
                    <span className={styles.glyph} aria-hidden="true">
                      <ServiceGlyph name={service.glyph} />
                    </span>
                    <h3 id={`${id}-${i}`} className={styles.title}>
                      {service.title}
                    </h3>
                  </div>
                  <div>
                    <p className={styles.text}>{service.text}</p>
                    <p className={styles.lead}>Zum Beispiel</p>
                    <ul className={styles.examples}>
                      {service.examples.map((example) => (
                        <li key={example}>{example}</li>
                      ))}
                    </ul>
                  </div>
                  <Link href={service.href as never} className={styles.more}>
                    Mehr erfahren<span className="sr-only"> über {service.title}</span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

        <nav className={styles.rail} aria-label="Leistungen">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label="Vorherige Leistung"
            disabled={current === 0}
            onClick={() => jump.current(current - 1)}
          >
            <ChevronLeft />
          </Button>
          <ol>
            {services.map((service, i) => (
              <li key={service.title}>
                <button
                  type="button"
                  className={styles.stop}
                  aria-current={current === i ? "true" : undefined}
                  onClick={() => jump.current(i)}
                >
                  {service.short}
                </button>
              </li>
            ))}
          </ol>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label="Nächste Leistung"
            disabled={current === services.length - 1}
            onClick={() => jump.current(current + 1)}
          >
            <ChevronRight />
          </Button>
        </nav>
      </div>
    </section>
  );
}
