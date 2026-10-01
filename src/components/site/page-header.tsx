import type { CSSProperties, ReactNode } from "react";

import { HORIZON_H, HORIZON_W, horizon, ridgeY, sky, SKY_H, SKY_W } from "@/lib/horizon";
import { cn } from "@/lib/utils";

import { FIR_DESIGNS } from "./fir-shapes";
import { InView } from "./in-view";
import styles from "./page-header.module.css";
import { RisingWords } from "./words";

const FIR = FIR_DESIGNS.dicht;
const [, , FIR_W, FIR_H] = FIR.viewBox.split(" ").map(Number) as [number, number, number, number];

/**
 * Head of every page besides the home page: a sparse night sky, breadcrumbs, the heading at the
 * scale of the home sections, a lead beside it from lg up, and the page's own drawn horizon
 * underneath (seeded by `horizonKey`, usually the path) — or a `scene` of the page's own in its
 * place. When the page opens the heading's words rise one by one and the horizon draws; scrolling
 * away, the text drifts up and dims while the horizon sinks a little slower (motion.css).
 */
export function PageHeader({
  title,
  lead,
  kicker,
  breadcrumbs,
  horizonKey,
  scene,
  beacon = false,
  children,
}: {
  title: ReactNode;
  lead?: ReactNode;
  /** A short line above the heading that says what the page belongs to (a project's client). */
  kicker?: ReactNode;
  breadcrumbs?: ReactNode;
  horizonKey: string;
  /** The page's own picture in place of the horizon (a service's valley, a map). */
  scene?: ReactNode;
  /** A warm light on the horizon's crest: someone is there (the contact page). */
  beacon?: boolean;
  /** Extra content under the lead, such as a search form. */
  children?: ReactNode;
}) {
  const stars = sky(horizonKey);

  return (
    <InView className={cn(styles.head, "border-b")} data-cms-zone="kopf">
      <svg
        viewBox={`0 0 ${SKY_W} ${SKY_H}`}
        preserveAspectRatio="xMidYMin slice"
        aria-hidden="true"
        className={styles.sky}
      >
        {stars.map((s, i) => (
          <circle
            key={`${s.x}-${s.y}`}
            cx={s.x}
            cy={s.y}
            r={s.r}
            opacity={s.o}
            className={s.twinkle ? cn(styles.twinkle, "loop") : undefined}
            style={s.twinkle ? ({ "--d": `${(i % 7) * 0.9}s` } as CSSProperties) : undefined}
          />
        ))}
      </svg>
      <div className="relative page-container sd-away pt-12 sm:pt-20 3xl:pt-28">
        {breadcrumbs ? (
          <div className="rise-later" style={{ "--delay": "0.05s" } as CSSProperties}>
            {breadcrumbs}
          </div>
        ) : null}
        <div
          className={cn(
            "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end lg:gap-x-16 3xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]",
            breadcrumbs ? "mt-8" : null,
          )}
        >
          <div>
            {kicker ? (
              <p
                className="mb-3 rise-later text-base font-medium text-primary-soft 3xl:text-lg"
                style={{ "--delay": "0.1s" } as CSSProperties}
              >
                {kicker}
              </p>
            ) : null}
            <h1 className="text-[clamp(2.5rem,1.4rem+4vw,5rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance hyphens-auto">
              {typeof title === "string" ? <RisingWords text={title} /> : title}
            </h1>
          </div>
          {lead ? (
            <div className="rise-later text-lg text-pretty text-muted-foreground 3xl:text-xl">
              {lead}
            </div>
          ) : null}
        </div>
        {children ? (
          <div className="rise-later" style={{ "--delay": "0.6s" } as CSSProperties}>
            {children}
          </div>
        ) : null}
      </div>
      <div className="relative sd-sink">
        {scene ?? <Horizon horizonKey={horizonKey} beacon={beacon} />}
      </div>
    </InView>
  );
}

function Horizon({ horizonKey, beacon }: { horizonKey: string; beacon: boolean }) {
  const h = horizon(horizonKey);
  // The arc spans 180 units over the crest: the light stands in its middle, on the ridge.
  const crestX = Number(/^M ([\d.]+)/.exec(h.arc)?.[1] ?? HORIZON_W / 2) + 90;
  const crestY = ridgeY(horizonKey, crestX) - 4;
  return (
    <svg
      viewBox={`0 0 ${HORIZON_W} ${HORIZON_H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      className={cn(styles.horizon, "mt-10 sm:mt-14")}
    >
      <symbol id="horizont-tanne" viewBox={FIR.viewBox}>
        <path fill="currentColor" d={FIR.d} />
      </symbol>
      <path className={styles.ground} d={h.ground} />
      {h.firs.map((fir, i) => {
        const w = (fir.h * FIR_W) / FIR_H;
        return (
          <use
            key={fir.x}
            href="#horizont-tanne"
            className={styles.fir}
            style={{ "--order": i } as CSSProperties}
            x={fir.x - w / 2}
            y={fir.y - fir.h}
            width={w}
            height={fir.h}
          />
        );
      })}
      <path className={styles.ridge} d={h.ridge} pathLength={1} />
      <path className={styles.arc} d={h.arc} pathLength={1} />
      {beacon ? (
        <g className={styles.beacon}>
          <circle cx={crestX} cy={crestY} r={16} className={cn(styles.beaconHalo, "loop")} />
          <circle cx={crestX} cy={crestY} r={3.5} className={styles.beaconHeart} />
        </g>
      ) : null}
    </svg>
  );
}
