import { cn } from "@/lib/utils";

import styles from "./triangle-motif.module.css";

// Triangle motif („Dreiecke“ block, supplied by the owner): three peaks — the tall centre one, two
// flanking ones — joined at their bases. Decorative. MountainHero's GSAP timeline draws it once
// the ridge has started (data-tri-* hooks); until then the strokes are hidden.
export function TriangleMotif({ className }: { className?: string }) {
  return (
    <div data-motif aria-hidden="true" className={cn(styles.motif, className)}>
      <svg viewBox="-110 26 300 173" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* A faint glow: one soft blur of the strokes, well below the sharp line. */}
          <filter id="tri-neon" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feComponentTransfer in="blur" result="glow">
              <feFuncA type="linear" slope="0.4" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* The diamond peak stays a clean line; only the coloured gems glow. */}
        <g transform="translate(40 154) scale(1.15) translate(-40 -154)">
          <path
            data-tri-centre
            className={cn(styles.stroke, styles.centre)}
            d="M40 50 L100 154 L-20 154 Z"
            strokeWidth="3"
          />
          <circle data-tri-dot className={styles.dotCentre} cx="40" cy="50" r="4" />
        </g>
        <g filter="url(#tri-neon)">
          <g transform="translate(-40 194) scale(1.15) translate(40 -194)">
            <path
              data-tri-side
              className={cn(styles.stroke, styles.left)}
              d="M-40 90 L20 194 L-100 194 Z"
              strokeWidth="2"
            />
            <circle data-tri-dot className={styles.dotLeft} cx="-40" cy="90" r="3" />
          </g>
          <g transform="translate(120 194) scale(1.15) translate(-120 -194)">
            <path
              data-tri-side
              className={cn(styles.stroke, styles.right)}
              d="M120 90 L180 194 L60 194 Z"
              strokeWidth="2"
            />
            <circle data-tri-dot className={styles.dotRight} cx="120" cy="90" r="3" />
          </g>
          <line
            data-tri-side
            className={cn(styles.stroke, styles.connector)}
            x1="40"
            y1="154"
            x2="-40"
            y2="194"
            strokeWidth="2"
          />
          <line
            data-tri-side
            className={cn(styles.stroke, styles.connector)}
            x1="40"
            y1="154"
            x2="120"
            y2="194"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  );
}
