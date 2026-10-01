import type { CSSProperties } from "react";

import { FirMark } from "@/components/site/fir-mark";
import { Part } from "@/components/site/part";
import { RichText } from "@/components/site/rich-text";
import { LitWords } from "@/components/site/words";
import type { LexicalDocument } from "@/cms/rich-text/schema";
import { type Block, plainParagraphs, type Step } from "@/cms/rich-text/shapes";
import type { TextPart } from "@/cms/rich-text/parts";
import { CONTOUR_SIZE, contours } from "@/lib/contours";
import { HORIZON_H, HORIZON_W, horizon } from "@/lib/horizon";

import styles from "./content-blocks.module.css";

// A content page below its header, in the shapes its text takes (cms/rich-text/shapes.ts): the
// text before the first h2 as a statement beside the page's own contour map, then each block with
// the one movement that fits it.

/** The text before the first h2: its first paragraph large, words lighting up as it is read. */
export function Statement({ intro, mapKey }: { intro: LexicalDocument; mapKey: string }) {
  const paragraphs = plainParagraphs(intro);
  const map = contours(mapKey);
  return (
    <div className="page-container grid gap-14 py-20 sm:py-28 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-center lg:gap-20">
      <div className="min-w-0">
        {paragraphs ? (
          <>
            <p className="text-[clamp(1.625rem,1.2rem+1.6vw,2.75rem)] leading-[1.18] font-medium tracking-[-0.02em] text-balance">
              <LitWords text={paragraphs[0]!} />
            </p>
            {paragraphs.slice(1).map((text) => (
              <p
                key={text}
                className="mt-6 max-w-prose text-lg text-pretty text-muted-foreground sm:text-xl"
              >
                {text}
              </p>
            ))}
          </>
        ) : (
          <RichText data={intro} className="prose-xl max-w-prose 3xl:prose-2xl" />
        )}
      </div>
      {/* The page's own mountain, as a hiking map draws it: rings that draw themselves from the
          summit outwards as the map comes into view, a copper mark on the top. */}
      <svg
        viewBox={`0 0 ${CONTOUR_SIZE} ${CONTOUR_SIZE}`}
        aria-hidden="true"
        className={styles.map}
      >
        {map.rings.map((d, k) => (
          <path
            key={d}
            d={d}
            pathLength={1}
            className={k % 4 === 3 ? styles.ringMajor : styles.ring}
            style={{ "--k": k } as CSSProperties}
          />
        ))}
        <path className={styles.summit} d={`M ${map.peak.x} ${map.peak.y - 9} l 8 14 h -16 z`} />
      </svg>
    </div>
  );
}

/**
 * Numbered parts as one way up the mountain: from lg up a path winds from waypoint to waypoint
 * and draws itself as the page goes down; each waypoint lights when it reaches the middle.
 */
function Way({ steps }: { steps: Step[] }) {
  const n = steps.length;
  // Waypoints alternate at a quarter and three quarters of the width, one per row of equal height.
  const pts = steps.map((_, i) => [i % 2 === 0 ? 25 : 75, i * 100 + 50] as const);
  let d = `M ${pts[0]![0]} 0 L ${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 1; i < n; i++) {
    const [x0, y0] = pts[i - 1]!;
    const [x1, y1] = pts[i]!;
    d += ` C ${x0} ${y0 + 60} ${x1} ${y1 - 60} ${x1} ${y1}`;
  }
  d += ` L ${pts[n - 1]![0]} ${n * 100}`;

  return (
    <section aria-label="Schritte" className="border-t">
      <div className="page-container py-20 sm:py-28">
        <ol className={styles.way} style={{ "--rows": n } as CSSProperties}>
          <svg
            viewBox={`0 0 100 ${n * 100}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            className={styles.path}
          >
            <path d={d} className={styles.track} />
          </svg>
          {/* The same path again, uncovered from the top as the way is walked. */}
          <svg
            viewBox={`0 0 100 ${n * 100}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            className={`${styles.path} ${styles.walked}`}
          >
            <path d={d} />
          </svg>
          {steps.map((step, i) => (
            <li
              key={`${step.number}-${step.title}`}
              className={styles.stop}
              data-side={i % 2 ? "right" : "left"}
            >
              <span aria-hidden="true" className={styles.waypoint}>
                {step.number}
              </span>
              <div className={styles.stopText}>
                <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl 3xl:text-5xl">
                  <span className="sr-only">Schritt {step.number}: </span>
                  {step.title}
                </h2>
                <RichText
                  data={step.body}
                  className="prose-lg mt-4 max-w-prose text-pretty 3xl:prose-xl"
                />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Three or more short parts side by side, each standing on its own small ridge. */
function Cards({ parts }: { parts: TextPart[] }) {
  return (
    <section aria-label={parts.map((p) => p.title).join(", ")} className="border-t">
      <ul className="page-container grid sd-stagger gap-4 py-20 sm:py-28 md:grid-cols-2 xl:grid-cols-3">
        {parts.map((part, i) => {
          const h = horizon(part.title);
          return (
            <li
              key={part.title}
              style={{ "--i": i } as CSSProperties}
              className="flex min-h-[22rem] flex-col overflow-clip rounded-3xl border border-primary-soft/15 bg-card"
            >
              <svg
                viewBox={`0 0 ${HORIZON_W} ${HORIZON_H}`}
                preserveAspectRatio="xMidYMax slice"
                aria-hidden="true"
                className="h-28 w-full"
              >
                <path d={h.ground} className="fill-secondary" />
                <path
                  d={h.ridge}
                  pathLength={1}
                  className="sd-stroke fill-none stroke-primary-soft [stroke-width:3]"
                />
              </svg>
              <div className="flex flex-1 flex-col justify-end p-8 pt-6">
                <h2 className="text-2xl font-semibold tracking-tight text-balance 3xl:text-3xl">
                  {part.title}
                </h2>
                <RichText data={part.body} className="prose-lg mt-3 text-pretty" />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** A part that is only a list: its items as large lines, each rule drawn as it comes in. */
function Promises({ part, items, id }: { part: TextPart; items: string[]; id: string }) {
  return (
    <Part id={id} title={part.title}>
      <ul>
        {items.map((item) => (
          <li key={item} className="relative py-7 first:pt-0">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-px sd-draw-x bg-primary-soft/35"
            />
            <p className="flex gap-5 text-xl font-medium tracking-tight text-pretty sm:text-2xl 3xl:text-3xl">
              <span
                aria-hidden="true"
                className="mt-[0.45em] size-2.5 shrink-0 rotate-45 border border-primary-soft"
              />
              {item}
            </p>
          </li>
        ))}
      </ul>
    </Part>
  );
}

/** A part with a list of short items: the items as modules around one centre, joined by lines. */
function Modules({
  part,
  before,
  items,
  after,
  id,
}: {
  part: TextPart;
  before: LexicalDocument | null;
  items: string[];
  after: LexicalDocument | null;
  id: string;
}) {
  const n = items.length;
  // Around the centre on an ellipse, starting at the top, clockwise.
  const at = (i: number) => {
    const t = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return { x: 50 + 40 * Math.cos(t), y: 50 + 38 * Math.sin(t) };
  };
  return (
    <Part id={id} title={part.title}>
      {before ? <RichText data={before} className="prose-lg max-w-prose 3xl:prose-xl" /> : null}
      <div className={styles.constellation}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {items.map((item, i) => {
            const p = at(i);
            return (
              <line
                key={item}
                x1={50}
                y1={50}
                x2={p.x}
                y2={p.y}
                pathLength={1}
                className="sd-stroke"
              />
            );
          })}
        </svg>
        <span aria-hidden="true" className={styles.hub}>
          <FirMark className="size-8 text-primary-soft" />
        </span>
        <ul className={styles.modules}>
          {items.map((item, i) => {
            const p = at(i);
            return (
              <li
                key={item}
                style={{ "--x": `${p.x}%`, "--y": `${p.y}%`, "--i": i } as CSSProperties}
              >
                {item}
              </li>
            );
          })}
        </ul>
      </div>
      {after ? <RichText data={after} className="prose-lg mt-10 max-w-prose 3xl:prose-xl" /> : null}
    </Part>
  );
}

/** Every block of the page in order. */
export function ContentBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div data-cms-zone="text">
      {blocks.map((block, i) => {
        const id = `abschnitt-${i + 1}`;
        switch (block.kind) {
          case "steps":
            return <Way key={id} steps={block.steps} />;
          case "cards":
            return <Cards key={id} parts={block.parts} />;
          case "promises":
            return <Promises key={id} part={block.part} items={block.items} id={id} />;
          case "modules":
            return (
              <Modules
                key={id}
                part={block.part}
                before={block.before}
                items={block.items}
                after={block.after}
                id={id}
              />
            );
          case "part":
            return (
              <Part key={id} id={id} title={block.part.title}>
                <RichText data={block.part.body} className="prose-lg max-w-prose 3xl:prose-xl" />
              </Part>
            );
        }
      })}
    </div>
  );
}
