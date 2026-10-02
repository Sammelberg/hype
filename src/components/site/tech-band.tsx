import Link from "next/link";

import { InView } from "./in-view";
import styles from "./tech-band.module.css";
import { TECH_LOGOS } from "./tech-logos";

/**
 * A running band of the stack we build with (tech-logos.ts): logo and name, sliding slowly to the
 * left in an endless loop. It pauses under the pointer or keyboard focus and while off screen;
 * with reduced motion it stands still and wraps. The logos come from one cached sprite
 * (/technik.svg); the second copy of the row is hidden from assistive technology.
 */
export function TechBand({ title }: { title: string }) {
  const row = (copy: boolean) => (
    <ul
      className={styles.row}
      aria-hidden={copy || undefined}
      aria-label={copy ? undefined : title}
    >
      {TECH_LOGOS.map((logo, i) => (
        <li key={logo.name} className={styles.item}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.logo}>
            <use href={`/technik.svg#logo-${i}`} />
          </svg>
          <span>{logo.name}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <InView className={styles.band}>
      <section aria-labelledby="technik-titel" data-cms-zone="technik">
        <div className="page-container flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
          <h2 id="technik-titel" className="text-sm font-medium text-muted-foreground">
            {title}
          </h2>
          <Link
            href={"/ueber-uns/technologie" as never}
            className="text-sm font-medium text-primary-soft hover:underline"
          >
            Unser Stack im Detail →
          </Link>
        </div>
        <div className={styles.viewport}>
          <div className={`${styles.track} loop`}>
            {row(false)}
            {row(true)}
          </div>
        </div>
      </section>
    </InView>
  );
}
