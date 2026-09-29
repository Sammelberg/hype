"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useRef, useState } from "react";

import { type GlyphName, ServiceGlyph } from "@/components/site/service-glyphs";
import { Button } from "@/components/ui/button";

import { FIR_DESIGNS } from "./fir-shapes";
import styles from "./services-strata.module.css";
import { valley, VALLEY_H, VALLEY_W, type ValleySpec } from "./valley";

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
// integration a saddle the copper arc bridges, modernisation one young steep hill before soft old
// ones with young firs beside an old one, operations a long steady ridge.
const VALLEYS: Record<GlyphName, ValleySpec> = {
  web: {
    seed: 11,
    near: [
      [300, 520, 90],
      [980, 560, 120],
    ],
    arc: { crest: 980 },
    firs: [
      { design: "dicht", x: 330, h: 300 },
      { design: "schlank", x: 410, h: 200 },
      { design: "konkav", x: 890, h: 320 },
    ],
  },
  mobile: {
    seed: 23,
    near: [
      [470, 230, 170],
      [790, 230, 185],
    ],
    arc: { crest: 790 },
    firs: [
      { design: "schlank", x: 300, h: 250 },
      { design: "dicht", x: 880, h: 300 },
      { design: "schlank", x: 935, h: 200 },
    ],
  },
  integration: {
    seed: 37,
    near: [
      [330, 380, 170],
      [900, 380, 170],
    ],
    arc: { bridge: [330, 900] },
    firs: [
      { design: "konkav", x: 300, h: 280 },
      { design: "schlank", x: 920, h: 300 },
    ],
  },
  modernisation: {
    seed: 41,
    near: [
      [300, 600, 50],
      [640, 240, 230],
      [1000, 600, 50],
    ],
    arc: { crest: 640 },
    firs: [
      { design: "dicht", x: 290, h: 360 },
      { design: "schlank", x: 370, h: 170 },
      { design: "schlank", x: 415, h: 130 },
      { design: "konkav", x: 920, h: 280 },
    ],
  },
  operations: {
    seed: 53,
    near: [[600, 1600, 70]],
    arc: { crest: 820 },
    firs: [
      { design: "dicht", x: 260, h: 300 },
      { design: "konkav", x: 930, h: 300 },
    ],
  },
};

/** Where the section holds and the cards ride sideways: the same query as in the styles. */
const RIDE =
  "(min-width: 64rem) and (min-height: 40rem) and (prefers-reduced-motion: no-preference)";

const VIEW = `0 0 ${VALLEY_W} ${VALLEY_H}`;

function Valley({ spec, mist, firs }: { spec: ValleySpec; mist: string; firs: string }) {
  const v = valley(spec);
  return (
    <div className={styles.window} aria-hidden="true">
      <div data-depth="far" className={styles.depth}>
        <svg viewBox={VIEW} preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id={mist} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className={styles.mistStop} stopOpacity="0" />
              <stop offset="0.5" className={styles.mistStop} stopOpacity="0.3" />
              <stop offset="1" className={styles.mistStop} stopOpacity="0" />
            </linearGradient>
          </defs>
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
          <path className={styles.farHills} d={v.far} />
          <rect
            x="-20"
            y={v.mist[0]!.y}
            width={VALLEY_W + 40}
            height={v.mist[0]!.h}
            fill={`url(#${mist})`}
          />
        </svg>
      </div>
      <div data-depth="mid" className={styles.depth}>
        <svg viewBox={VIEW} preserveAspectRatio="xMidYMax slice">
          <path className={styles.midHills} d={v.mid} />
          <rect
            x="-20"
            y={v.mist[1]!.y}
            width={VALLEY_W + 40}
            height={v.mist[1]!.h}
            fill={`url(#${mist})`}
          />
        </svg>
      </div>
      <div data-depth="near" className={styles.depth}>
        <svg viewBox={VIEW} preserveAspectRatio="xMidYMax slice">
          <path className={styles.nearFill} d={v.near.fill} />
          <path data-ridge className={styles.edge} d={v.near.edge} />
          <path data-arc className={styles.arc} d={v.near.arc} />
          {v.firs.map((fir, n) => {
            const design = FIR_DESIGNS[fir.design];
            const [, , vw, vh] = design.viewBox.split(" ").map(Number);
            const w = (fir.h * vw!) / vh!;
            return (
              <g
                key={`${fir.design}-${fir.x}`}
                className={styles.fir}
                style={
                  {
                    "--sway": `${1.2 + (n % 3) * 0.3}deg`,
                    animationDuration: `${5.6 + ((spec.seed + n) % 4) * 0.7}s`,
                    animationDelay: `${-((spec.seed * 0.7 + n * 2.1) % 5)}s`,
                  } as CSSProperties
                }
              >
                <use
                  href={`#${firs}-${fir.design}`}
                  x={fir.x - w / 2}
                  y={fir.y - fir.h}
                  width={w}
                  height={fir.h}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/**
 * „Was wir entwickeln“ as a gallery of framed views: the stage holds under the header and five
 * wide cards pass sideways, the service on the left and a window into its own Black Forest valley
 * on the right (valley.ts). As a card crosses the stage the view moves into the valley, the near
 * slope and firs coming closer faster than the far hills; the slope's ice line draws itself as the
 * card arrives, then its copper arc. A rail names the services, steps either way and jumps; focus
 * inside a card brings the card into view. Below lg, on short screens and with reduced motion the
 * cards form a finished sideways track, the rail beneath.
 */
export function ServicesStrata({
  id,
  title,
  intro,
  services,
}: {
  id: string;
  title: string;
  intro: string;
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
      const show = (index: number) => setCurrent((was) => (was === index ? was : index));
      const offset = (index: number) => cards[index]!.offsetLeft - cards[0]!.offsetLeft;
      const nearest = (x: number, width: number) => {
        const eye = x + width * 0.35;
        let best = 0;
        cards.forEach((_, i) => {
          if (offset(i) <= eye) best = i;
        });
        return best;
      };

      // The firs sway only while the section is on screen.
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => section.toggleAttribute("data-live", self.isActive),
      });

      const mm = gsap.matchMedia();

      mm.add(RIDE, () => {
        section.setAttribute("data-ride", "");
        // The track is no longer a scroll region of its own.
        track.removeAttribute("tabindex");
        const header = () => document.querySelector("header")?.offsetHeight ?? 64;
        const distance = () => Math.max(1, track.scrollWidth - stage.clientWidth);

        const ride = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: stage,
            pin: true,
            anticipatePin: 1,
            start: () => `top ${header()}`,
            end: () => `+=${distance()}`,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => show(nearest(self.progress * distance(), stage.clientWidth)),
          },
        });

        jump.current = (index, behavior = "smooth") => {
          const st = ride.scrollTrigger;
          if (!st) return;
          const progress = Math.min(1, offset(index) / distance());
          window.scrollTo({ top: st.start + (st.end - st.start) * progress, behavior });
        };

        // Tabbing into a card that is still off to the side brings it into view.
        const follow = cards.map((card, i) => {
          const onFocus = () => jump.current(i, "instant");
          card.addEventListener("focusin", onFocus);
          return () => card.removeEventListener("focusin", onFocus);
        });

        cards.forEach((card, i) => {
          const q = gsap.utils.selector(card);

          // Into the valley: the nearer a layer, the more it grows toward the viewer.
          gsap
            .timeline({
              defaults: { ease: "none" },
              scrollTrigger: {
                trigger: card,
                containerAnimation: ride,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            })
            .fromTo(
              q("[data-depth='far']"),
              { scale: 1, xPercent: -2 },
              { scale: 1.04, xPercent: 2 },
              0,
            )
            .fromTo(
              q("[data-depth='mid']"),
              { scale: 1, xPercent: -1 },
              { scale: 1.09, xPercent: 1 },
              0,
            )
            .fromTo(
              q("[data-depth='near']"),
              { scale: 1, yPercent: 0 },
              { scale: 1.12, yPercent: 3 },
              0,
            );

          // Arrival: the ice line draws, then the copper arc; the words settle. The first card
          // arrives with the section itself, the others with the ride.
          const arrival = gsap
            .timeline({
              defaults: { ease: "none" },
              scrollTrigger:
                i === 0
                  ? { trigger: stage, start: "top 85%", end: "top 25%", scrub: 0.8 }
                  : {
                      trigger: card,
                      containerAnimation: ride,
                      start: "left 90%",
                      end: "left 30%",
                      scrub: 0.8,
                    },
            })
            .fromTo(q("[data-ridge]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.75 }, 0)
            .fromTo(
              q("[data-arc]"),
              { drawSVG: "0%", autoAlpha: 0 },
              { drawSVG: "100%", autoAlpha: 1, duration: 0.3 },
              0.6,
            );
          if (i > 0) {
            arrival.fromTo(
              q("[data-copy]"),
              { x: 40, autoAlpha: 0.15 },
              { x: 0, autoAlpha: 1, duration: 0.6 },
              0,
            );
          }
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
        const onScroll = () => show(nearest(track.scrollLeft, track.clientWidth));
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
        <p className={styles.intro}>{intro}</p>
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
                  mist={`${id}-nebel-${i}`}
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
