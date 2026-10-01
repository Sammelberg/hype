"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

import { FIR_DESIGNS } from "@/components/site/fir-shapes";
import { HORIZON_H, HORIZON_W, horizon } from "@/lib/horizon";
import { cn } from "@/lib/utils";

import styles from "./horizon.module.css";

const FIR = FIR_DESIGNS.dicht;
const [, , FIR_W, FIR_H] = FIR.viewBox.split(" ").map(Number) as [number, number, number, number];

/**
 * The screen's own horizon, seeded by its section (/admin/rechnungen and every invoice below it
 * share one), keyed by it so it draws again when the section changes.
 */
export function ScreenHorizon({ tall = false, className }: { tall?: boolean; className?: string }) {
  const pathname = usePathname();
  const key = pathname.split("/").slice(0, 3).join("/");
  const h = horizon(key);
  return (
    <svg
      key={key}
      viewBox={`0 0 ${HORIZON_W} ${HORIZON_H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      className={cn(styles.horizon, tall && styles.tall, className)}
    >
      <symbol id="screen-tanne" viewBox={FIR.viewBox}>
        <path fill="currentColor" d={FIR.d} />
      </symbol>
      <path className={styles.ground} d={h.ground} />
      {h.firs.map((fir, i) => {
        const w = (fir.h * FIR_W) / FIR_H;
        return (
          <use
            key={fir.x}
            href="#screen-tanne"
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
  );
}
