import Link from "next/link";

import { PageHeader } from "@/components/site/page-header";

import styles from "./not-found.module.css";

// Where a visitor who took a wrong turn most likely wanted to go.
const WAYS = [
  { href: "/", label: "Startseite" },
  { href: "/leistungen", label: "Leistungen" },
  { href: "/projekte", label: "Projekte" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/suche", label: "Suche" },
] as const;

// Off the path: a compass whose needle searches, swings and settles, and the ways back.
export default function NotFound() {
  return (
    <main>
      <PageHeader
        title="Seite nicht gefunden"
        lead="Die angeforderte Seite existiert nicht oder wurde verschoben."
        horizonKey="404"
      />
      <div className="page-container grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-24">
        <nav aria-labelledby="wege-titel">
          <h2
            id="wege-titel"
            className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
          >
            Von hier aus weiter
          </h2>
          <ul className="mt-8 flex flex-wrap gap-3">
            {WAYS.map((way) => (
              <li key={way.href}>
                <Link
                  href={way.href}
                  className="group inline-flex items-center gap-2.5 rounded-full border border-primary-soft/25 bg-card px-6 py-3 text-lg transition-colors hover:border-primary-soft/60 hover:text-primary-soft"
                >
                  {way.label}
                  <svg
                    viewBox="0 0 28 28"
                    aria-hidden="true"
                    className="size-4 fill-none stroke-current stroke-2 transition-transform duration-200 ease-out [stroke-linecap:round] [stroke-linejoin:round] group-hover:translate-x-0.5"
                  >
                    <path d="M5 14h17M16 8l6 6-6 6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <svg viewBox="0 0 200 200" aria-hidden="true" className={styles.compass}>
          <circle cx="100" cy="100" r="92" className={styles.rim} />
          <circle cx="100" cy="100" r="74" className={styles.inner} />
          {Array.from({ length: 36 }, (_, i) => (
            <line
              key={i}
              x1="100"
              y1={i % 9 === 0 ? 14 : 20}
              x2="100"
              y2="26"
              transform={`rotate(${i * 10} 100 100)`}
              className={i % 9 === 0 ? styles.tickMajor : styles.tick}
            />
          ))}
          <text x="100" y="46" className={styles.north}>
            N
          </text>
          <g className={styles.needle}>
            <path d="M100 38 L108 100 L100 108 L92 100 Z" className={styles.needleNorth} />
            <path d="M100 162 L108 100 L100 92 L92 100 Z" className={styles.needleSouth} />
          </g>
          <circle cx="100" cy="100" r="4" className={styles.pin} />
        </svg>
      </div>
    </main>
  );
}
