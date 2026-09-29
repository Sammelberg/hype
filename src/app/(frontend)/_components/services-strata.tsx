"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useRef, useState } from "react";

import { type GlyphName, ServiceGlyph } from "@/components/site/service-glyphs";
import { scrollPageTo } from "@/components/site/smooth-scroll";
import { Button } from "@/components/ui/button";

import { FIR_DESIGNS } from "@/components/site/fir-shapes";
import styles from "./services-strata.module.css";
import { type Ridge, valley, VALLEY_H, VALLEY_W, type ValleySpec } from "./valley";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin);

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

// Each valley hints at its service: web a wide open valley, mobile two hills side by side,
// integration a saddle the copper arc bridges, modernisation one young steep hill with young firs
// beside an old one, operations a long steady ridge. The far and middle ridges and their groves
// come from the seed; the near ridge and its large firs are drawn here.
const VALLEYS: Record<GlyphName, ValleySpec> = {
  web: {
    seed: 11,
    near: [
      [330, 520, 55],
      [960, 560, 70],
    ],
    arc: { crest: 850 },
    firs: [
      { design: "dicht", x: 300, h: 250 },
      { design: "schlank", x: 372, h: 170 },
      { design: "konkav", x: 880, h: 260 },
    ],
  },
  mobile: {
    seed: 23,
    near: [
      [500, 200, 80],
      [760, 200, 88],
    ],
    arc: { crest: 760 },
    firs: [
      { design: "schlank", x: 300, h: 230 },
      { design: "dicht", x: 870, h: 260 },
      { design: "schlank", x: 930, h: 180 },
    ],
  },
  integration: {
    seed: 37,
    near: [
      [340, 360, 80],
      [880, 360, 80],
    ],
    arc: { bridge: [340, 880] },
    firs: [
      { design: "konkav", x: 305, h: 240 },
      { design: "schlank", x: 915, h: 260 },
    ],
  },
  modernisation: {
    seed: 41,
    near: [[640, 230, 105]],
    arc: { crest: 640 },
    firs: [
      { design: "dicht", x: 310, h: 290 },
      { design: "schlank", x: 380, h: 150 },
      { design: "schlank", x: 425, h: 115 },
      { design: "konkav", x: 895, h: 240 },
    ],
  },
  operations: {
    seed: 53,
    near: [[600, 1600, 40]],
    arc: { crest: 780 },
    firs: [
      { design: "dicht", x: 300, h: 250 },
      { design: "konkav", x: 890, h: 250 },
    ],
  },
};

/** Where the section holds and the cards ride sideways: the same query as in the styles. */
const RIDE =
  "(min-width: 64rem) and (min-height: 40rem) and (prefers-reduced-motion: no-preference)";

/** How long the ride holds each card in the middle, in card-to-card moves. */
const DWELL = 0.35;
/** Page scroll per pixel the track moves: under 1, a card-to-card move takes less than its width. */
const PACE = 0.75;

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
        {/* The drawn lines in a layer of their own: drawing them repaints nothing else. */}
        <svg viewBox={VIEW} preserveAspectRatio="xMidYMax slice" className={styles.lines}>
          <path data-ridge className={styles.edge} d={v.ridges.near.edge} />
          <path data-arc className={styles.arc} d={v.arc} />
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
 * „Was wir entwickeln“ as a gallery of framed views: the stage holds under the header and five
 * wide cards ride through its middle one by one, the service on the left and a window into its own
 * Black Forest valley on the right (valley.ts). Each card comes to rest in the middle for a stretch
 * of scrolling before the next moves in, and the page scrolls on only after the last one has
 * rested. As a card nears the middle its ridges shift against each other, the near one faster than
 * the far one, and its ice line draws, then its copper arc. A rail names the services,
 * steps either way and jumps; focus inside a card brings it to the middle. Below lg, on short
 * screens and with reduced motion the cards form a finished sideways track, centred card by card.
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
        // One unit of the ride is one card-to-card move; each card also rests for DWELL units.
        const units = count * DWELL + last;

        // Per card, two paused timelines set from its distance to the middle (sync below): the
        // ridges shifting against each other (translation only, so the compositor moves them
        // without repainting), and the arrival (ice line, copper arc, words).
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
            .fromTo(q("[data-ridge]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.75 }, 0)
            .fromTo(
              q("[data-arc]"),
              { drawSVG: "0%", autoAlpha: 0 },
              { drawSVG: "100%", autoAlpha: 1, duration: 0.3 },
              0.6,
            );
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
          show(nearest(x));
        };

        const ride = gsap.timeline({
          defaults: { ease: "none" },
          onUpdate: sync,
          scrollTrigger: {
            trigger: stage,
            pin: true,
            anticipatePin: 1,
            start: () => `top ${header()}`,
            end: () => `+=${step() * units * PACE}`,
            // Lenis already smooths the scroll; a scrub lag on top of it reads as sluggish.
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
        ride.to({}, { duration: DWELL });
        for (let i = 1; i < count; i++) {
          ride.to(track, { x: () => -offset(i), duration: 1 }).to({}, { duration: DWELL });
        }
        sync();

        // To the middle of card i's rest.
        jump.current = (index, behavior = "smooth") => {
          const st = ride.scrollTrigger;
          if (!st) return;
          const progress = (index * (1 + DWELL) + DWELL / 2) / units;
          scrollPageTo(st.start + (st.end - st.start) * progress, {
            immediate: behavior === "instant",
          });
        };

        // Tabbing into a card that is still off to the side brings it to the middle.
        const follow = cards.map((card, i) => {
          const onFocus = () => jump.current(i, "instant");
          card.addEventListener("focusin", onFocus);
          return () => card.removeEventListener("focusin", onFocus);
        });

        // A link such as /#vorgehen landed before the ride's spacer existed, so the page now stops
        // short of its target: take it there again.
        const hash = decodeURIComponent(window.location.hash.slice(1));
        const target = hash ? document.getElementById(hash) : null;
        if (target && section.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING) {
          ScrollTrigger.refresh();
          target.scrollIntoView({ block: "start", behavior: "instant" });
        }

        return () => {
          follow.forEach((off) => off());
          section.removeAttribute("data-ride");
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
