import type { CSSProperties } from "react";

import { constellation, SKY_CHART_H, SKY_CHART_W } from "@/lib/constellation";
import { cn } from "@/lib/utils";

import styles from "./star-chart.module.css";

/**
 * A project's own constellation (lib/constellation, seeded by its path): faint dust, the figure's
 * lines drawn one after another as the chart comes into view, its stars lighting up. Decoration.
 */
export function StarChart({ chartKey, className }: { chartKey: string; className?: string }) {
  const c = constellation(chartKey);
  return (
    <svg
      viewBox={`0 0 ${SKY_CHART_W} ${SKY_CHART_H}`}
      aria-hidden="true"
      className={cn(styles.chart, className)}
    >
      {c.dust.map((d) => (
        <circle
          key={`${d.x}-${d.y}`}
          cx={d.x}
          cy={d.y}
          r={d.r}
          opacity={d.o}
          className={styles.dust}
        />
      ))}
      {c.links.map(([a, b], k) => {
        const s = c.stars[a]!;
        const t = c.stars[b]!;
        return (
          <line
            key={`${a}-${b}`}
            x1={s.x}
            y1={s.y}
            x2={t.x}
            y2={t.y}
            pathLength={1}
            className={styles.link}
            style={{ "--k": k } as CSSProperties}
          />
        );
      })}
      {c.stars.map((s, k) => (
        <g key={`${s.x}-${s.y}`} className={styles.star} style={{ "--k": k } as CSSProperties}>
          <circle cx={s.x} cy={s.y} r={s.r * 3.2} className={styles.halo} />
          <circle cx={s.x} cy={s.y} r={s.r} />
        </g>
      ))}
    </svg>
  );
}
