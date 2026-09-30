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
import { glidePageTo, holdPage, releasePage, scrollPageTo } from "@/components/site/smooth-scroll";
import { Button } from "@/components/ui/button";

import { FIR_DESIGNS } from "@/components/site/fir-shapes";
import styles from "./services-strata.module.css";
import { type Ridge, valley, VALLEY_H, VALLEY_W, type ValleySpec } from "./valley";

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
const LIGHTS: readonly { a: string; b: string; glow: string }[] = [
  { a: "oklch(0.2 0.075 262)", b: "oklch(0.44 0.21 262)", glow: "oklch(0.7 0.19 258)" },
  { a: "oklch(0.17 0.055 262)", b: "oklch(0.38 0.18 260)", glow: "oklch(0.64 0.2 258)" },
  { a: "oklch(0.24 0.1 258)", b: "oklch(0.5 0.21 255)", glow: "oklch(0.78 0.14 250)" },
  { a: "oklch(0.19 0.07 262)", b: "oklch(0.42 0.2 262)", glow: "oklch(0.66 0.2 260)" },
  { a: "oklch(0.16 0.05 262)", b: "oklch(0.36 0.17 262)", glow: "oklch(0.62 0.19 258)" },
];

// Each valley hints at its service in its near skyline: web a wide open valley between two
// heights, mobile two peaks side by side, integration two peaks with a saddle between them,
// modernisation one young steep peak beside an old worn one, operations a long steady ridge.
// Behind it stand the generated middle range and the high mountains (valley.ts).
const VALLEYS: Record<GlyphName, ValleySpec> = {
  web: {
    seed: 11,
    near: [
      [0, 610],
      [150, 560],
      [280, 640],
      [430, 700],
      [790, 705],
      [950, 630],
      [1080, 565],
      [1200, 610],
    ],
    firs: [
      { design: "dicht", x: 300, h: 250 },
      { design: "schlank", x: 372, h: 170 },
      { design: "konkav", x: 880, h: 260 },
    ],
  },
  mobile: {
    seed: 23,
    near: [
      [0, 700],
      [330, 690],
      [500, 560],
      [590, 640],
      [700, 572],
      [860, 690],
      [1200, 705],
    ],
    firs: [
      { design: "schlank", x: 300, h: 230 },
      { design: "dicht", x: 870, h: 260 },
      { design: "schlank", x: 930, h: 180 },
    ],
  },
  integration: {
    seed: 37,
    near: [
      [0, 690],
      [250, 650],
      [340, 572],
      [470, 655],
      [610, 668],
      [750, 652],
      [880, 572],
      [990, 660],
      [1200, 690],
    ],
    firs: [
      { design: "konkav", x: 305, h: 240 },
      { design: "schlank", x: 915, h: 260 },
    ],
  },
  modernisation: {
    seed: 41,
    near: [
      [0, 700],
      [180, 668],
      [320, 626],
      [450, 690],
      [560, 694],
      [640, 520],
      [735, 690],
      [1200, 708],
    ],
    firs: [
      { design: "dicht", x: 310, h: 290 },
      { design: "schlank", x: 380, h: 150 },
      { design: "schlank", x: 425, h: 115 },
      { design: "konkav", x: 895, h: 240 },
    ],
  },
  operations: {
    seed: 53,
    near: [
      [0, 690],
      [170, 652],
      [400, 628],
      [640, 612],
      [900, 628],
      [1070, 650],
      [1200, 682],
    ],
    firs: [
      { design: "dicht", x: 300, h: 250 },
      { design: "konkav", x: 890, h: 250 },
    ],
  },
};

/** Where the stage takes the wheel and the cards ride sideways: the same query as in the styles. */
const RIDE =
  "(min-width: 64rem) and (min-height: 40rem) and (prefers-reduced-motion: no-preference)";

/** One card to the next: long enough to read as travel, soft at both ends. */
const SLIDE = { duration: 0.95, ease: "power3.inOut" };
/** The page's glide onto the stage: it arrives and settles, no bump. */
const DOCK = { duration: 0.85, easing: (t: number) => 1 - (1 - t) ** 4 };
/** And away from it after the last card (or back up before the first). */
const LEAVE = {
  duration: 0.9,
  easing: (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
};
/** Input within this long of the one before is the same gesture: a trackpad's glide runs on. */
const QUIET_MS = 220;
/** A glide may pause this long and still be the same gesture, if its steps keep shrinking. */
const TAIL_MS = 700;
/** Wheel notches this far apart are separate turns, even when a busy page delivers them close. */
const NOTCH_MS = 90;
/** How near the stage comes to its place (share of the screen height) before the page docks. */
const APPROACH = 0.3;
/** How far the page moves on when it leaves the stage (share of the screen height). */
const ONWARD = 0.55;

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

  return (
    <div className={styles.window} aria-hidden="true">
      <div data-depth="far" className={styles.depth}>
        <svg viewBox={VIEW} preserveAspectRatio="xMidYMax slice">
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
          <path className={styles.farRidge} d={v.ridges.far.fill} />
          <path className={styles.farEdge} d={v.ridges.far.edge} />
          {trees("far")}
        </svg>
      </div>
      <div data-depth="mid" className={styles.depth}>
        <svg viewBox={VIEW} preserveAspectRatio="xMidYMax slice">
          <path className={styles.midRidge} d={v.ridges.mid.fill} />
          <path className={styles.midEdge} d={v.ridges.mid.edge} />
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
        </svg>
        {/* The drawn line in a layer of its own: drawing it repaints nothing else. */}
        <svg viewBox={VIEW} preserveAspectRatio="xMidYMax slice" className={styles.lines}>
          <path data-ridge className={styles.edge} d={v.ridges.near.edge} />
        </svg>
        <svg viewBox={VIEW} preserveAspectRatio="xMidYMax slice">
          {trees("near")}
        </svg>
      </div>
    </div>
  );
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * „Was wir entwickeln“ as a gallery of framed views: five wide cards, the service on the left and
 * a window into its own Black Forest valley on the right (valley.ts). As the stage comes near its
 * place under the header the page glides onto it and holds; from then on each gesture (a wheel
 * turn, a trackpad swipe, a swipe on a touch screen, an arrow or page key) moves exactly one card
 * into the middle, and one more after the last glides the page on (before the first: back up).
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

        // free: the page scrolls; docking/leaving: the page glides onto the stage or away;
        // docked: the stage holds the page and every gesture moves one card.
        let mode: "free" | "docking" | "docked" | "leaving" = "free";
        let index = 0;
        let slide: gsap.core.Tween | null = null;
        let lastInput = Number.NEGATIVE_INFINITY;

        const slideTo = (to: number, instant = false) => {
          index = gsap.utils.clamp(0, last, to);
          show(index);
          slide?.kill();
          slide = gsap.to(track, {
            x: -offset(index),
            ...SLIDE,
            duration: instant ? 0 : SLIDE.duration,
            onUpdate: sync,
            onComplete: () => {
              slide = null;
              sync();
            },
          });
        };

        // The watcher's range is the approach zone around the stage's place under the header, so
        // its middle is that place.
        const watcher = ScrollTrigger.create({
          trigger: stage,
          start: () => `top ${header() + window.innerHeight * APPROACH}`,
          end: () => `top ${header() - window.innerHeight * APPROACH}`,
          onUpdate: (self) => {
            const y = self.scroll();
            const place = (self.start + self.end) / 2;
            // Something moved the page while the stage held it (a jump from code, the browser):
            // the stage lets go instead of holding a page that has gone elsewhere.
            if (mode === "docked" && Math.abs(y - place) > 2) {
              release();
              releasePage();
              return;
            }
            // Only inside the approach zone: the trigger also reports a jump across it.
            if (mode !== "free" || y < self.start || y > self.end) return;
            // Coming down onto it, or having overshot it with cards still ahead; coming up onto it,
            // or having overshot it upwards with cards still behind.
            const down = self.direction > 0 && (y < place || index < last);
            const up = self.direction < 0 && (y > place || index > 0);
            if (down || up) dock();
          },
        });
        const place = () => (watcher.start + watcher.end) / 2;

        const release = () => {
          mode = "free";
          section.removeAttribute("data-held");
          observer.disable();
        };
        const hold = () => {
          mode = "docked";
          // The gesture that brought the page here still runs out (a trackpad's glide): it must
          // not also move the first card on.
          lastInput = performance.now();
          lastSize = 0;
          floor = Number.POSITIVE_INFINITY;
          holdPage(release);
          section.setAttribute("data-held", "");
          observer.enable();
        };
        const dock = () => {
          mode = "docking";
          glidePageTo(place(), { ...DOCK, onComplete: hold });
        };
        const leave = (dir: 1 | -1) => {
          release();
          releasePage();
          mode = "leaving";
          glidePageTo(place() + dir * window.innerHeight * ONWARD, {
            ...LEAVE,
            onComplete: () => {
              mode = "free";
            },
          });
        };
        const move = (dir: 1 | -1) => {
          if (mode !== "docked") return;
          const next = index + dir;
          if (next < 0 || next > last) leave(dir);
          else slideTo(next);
        };
        // One gesture, one card. A gesture starts after a pause (QUIET_MS), unless what comes is
        // a smaller step after a lull (a trackpad's glide tapering off on a busy machine), or
        // inside a running glide as a clear new push (a swipe while the last one still glides on).
        let lastSize = 0;
        let floor = Number.POSITIVE_INFINITY;
        let lastMove = Number.NEGATIVE_INFINITY;
        const gesture = (dir: 1 | -1, size: number) => {
          const now = performance.now();
          const gap = now - lastInput;
          const pause = gap > QUIET_MS;
          // A wheel notch repeats the same size exactly; a trackpad never quite does.
          const notch = size >= 40 && Math.abs(size - lastSize) < 0.5;
          const go = pause
            ? !(gap < TAIL_MS && size < lastSize)
            : (notch && gap > NOTCH_MS && now - lastMove > NOTCH_MS) ||
              (size > floor * 2 + 4 && now - lastMove > QUIET_MS);
          floor = pause || go ? size : Math.min(floor, size);
          lastInput = now;
          lastSize = size;
          if (!go) return;
          lastMove = now;
          move(dir);
        };

        // Wheel and touch while the stage holds the page (off otherwise). wheelSpeed -1: turning
        // the wheel down, like swiping up, reads as „up“, the way on.
        const observer = Observer.create({
          target: window,
          type: "wheel,touch",
          wheelSpeed: -1,
          tolerance: 8,
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
          move(onward || (space && !event.shiftKey) ? 1 : -1);
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
          hold();
        };
        // A new size moves the stage's place and the cards' offsets: stay where we are.
        const onRefresh = () => {
          gsap.set(track, { x: -offset(index) });
          sync();
          if (mode === "docked") snap();
        };
        ScrollTrigger.addEventListener("refresh", onRefresh);

        sync();

        // The rail and focus: to card i, docking the page first if it is not yet on the stage.
        jump.current = (to) => {
          if (mode !== "docked") dock();
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
          watcher.kill();
          slide?.kill();
          if (mode === "docked") releasePage();
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
