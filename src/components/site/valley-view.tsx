import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { FIR_DESIGNS } from "./fir-shapes";
import { type Ridge, valley, VALLEY_H, VALLEY_W, type ValleySpec } from "./valley";
import styles from "./valley-view.module.css";

const VIEW = `0 0 ${VALLEY_W} ${VALLEY_H}`;
const r1 = (n: number) => Math.round(n * 10) / 10;
const FIR_CLASS: Record<Ridge, string | undefined> = {
  far: styles.firFar,
  mid: styles.firMid,
  near: styles.firNear,
};

/**
 * A service's Black Forest valley (valley.ts) at night, outside the home services: the same
 * ridges and firs, but in the site's soft navy instead of the cards' sapphire (that saturation
 * stays on the home page). Its three depths drift apart as it crosses the screen and its ice line
 * draws itself (scroll-driven, valley-view.module.css); still with reduced motion. `id` keeps the
 * fir symbols of several valleys on one page apart.
 */
export function ValleyView({
  spec,
  id,
  className,
  frame = "window",
  ...rest
}: Omit<ComponentProps<"div">, "id" | "children"> & {
  spec: ValleySpec;
  id: string;
  className?: string;
  /** A framed window, or the large wide picture under a page heading. */
  frame?: "window" | "panorama";
}) {
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
            href={`#${id}-${fir.design}`}
            x={r1(fir.x - w / 2)}
            y={r1(fir.y - fir.h)}
            width={r1(w)}
            height={fir.h}
            className={FIR_CLASS[ridge]}
          />
        );
      });

  return (
    <div
      aria-hidden="true"
      {...rest}
      className={cn(styles.view, frame === "window" ? styles.window : styles.panorama, className)}
    >
      <svg width="0" height="0" className="absolute">
        {Object.entries(FIR_DESIGNS).map(([name, design]) => (
          <symbol key={name} id={`${id}-${name}`} viewBox={design.viewBox}>
            <path fill="currentColor" d={design.d} />
          </symbol>
        ))}
      </svg>
      <svg viewBox={VIEW} preserveAspectRatio="xMidYMax slice" className={styles.far}>
        {v.stars.map((s) => (
          <circle key={`${s.x}-${s.y}`} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
        ))}
        <path className={styles.farRidge} d={v.ridges.far.fill} />
        <path className={styles.farEdge} d={v.ridges.far.edge} />
        {trees("far")}
      </svg>
      <svg viewBox={VIEW} preserveAspectRatio="xMidYMax slice" className={styles.mid}>
        <path className={styles.midRidge} d={v.ridges.mid.fill} />
        <path className={styles.midEdge} d={v.ridges.mid.edge} />
        {trees("mid")}
      </svg>
      <svg viewBox={VIEW} preserveAspectRatio="xMidYMax slice" className={styles.near}>
        <path className={styles.nearRidge} d={v.ridges.near.fill} />
        <path className={`${styles.edge} sd-stroke`} d={v.ridges.near.edge} pathLength={1} />
        {trees("near")}
      </svg>
    </div>
  );
}
