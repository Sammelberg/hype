import type { CSSProperties, ReactNode } from "react";

import { HORIZON_H, HORIZON_W, horizon } from "@/lib/horizon";
import { cn } from "@/lib/utils";

import { FIR_DESIGNS } from "./fir-shapes";
import styles from "./page-header.module.css";

const FIR = FIR_DESIGNS.dicht;
const [, , FIR_W, FIR_H] = FIR.viewBox.split(" ").map(Number) as [number, number, number, number];

/**
 * Head of every page besides the home page: breadcrumbs, the heading at the scale of the home
 * sections, a lead beside it from lg up, and the page's own drawn horizon underneath (seeded by
 * `horizonKey`, usually the path).
 */
export function PageHeader({
  title,
  lead,
  kicker,
  breadcrumbs,
  horizonKey,
  children,
}: {
  title: ReactNode;
  lead?: ReactNode;
  /** A short line above the heading that says what the page belongs to (a project's client). */
  kicker?: ReactNode;
  breadcrumbs?: ReactNode;
  horizonKey: string;
  /** Extra content under the lead, such as a search form. */
  children?: ReactNode;
}) {
  const h = horizon(horizonKey);

  return (
    <div className="border-b" data-cms-zone="kopf">
      <div className="page-container pt-12 sm:pt-20 3xl:pt-28">
        {breadcrumbs}
        <div
          className={cn(
            "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end lg:gap-x-16 3xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]",
            breadcrumbs ? "mt-8" : null,
          )}
        >
          <div>
            {kicker ? (
              <p className="mb-3 text-base font-medium text-primary-soft 3xl:text-lg">{kicker}</p>
            ) : null}
            <h1 className="text-[clamp(2.5rem,1.4rem+4vw,5rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance hyphens-auto">
              {title}
            </h1>
          </div>
          {lead ? (
            <div className="text-lg text-pretty text-muted-foreground 3xl:text-xl">{lead}</div>
          ) : null}
        </div>
        {children}
      </div>
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
      </svg>
    </div>
  );
}
