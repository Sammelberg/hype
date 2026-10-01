import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";

import { ClosingCta } from "@/components/site/closing-cta";
import { Faq } from "@/components/site/faq";
import { PageHeader } from "@/components/site/page-header";
import { ServiceGlyph } from "@/components/site/service-glyphs";
import { ValleyView } from "@/components/site/valley-view";
import { VALLEYS } from "@/components/site/valleys";
import { getLeistungenContent } from "@/data/queries";
import { buildMetadata } from "@/lib/seo";

import styles from "./page.module.css";

// The page „leistungen“ (/admin → Seiten → Leistungen): its lead and SEO, the five services and
// the FAQ from its sections. The pages below it hold each service's own text.
export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getLeistungenContent();
  return buildMetadata({
    meta: page?.meta,
    fallbackTitle: page?.title || "Leistungen",
    fallbackDescription: page?.lead,
    path: "/leistungen",
  });
}

// „Fünf Täler“: from lg up a window stays in view on the left and passes from one service's valley
// to the next while the services pass on the right, a rail under it naming the one being read
// (scroll-driven, page.module.css). Phones, reduced motion and browsers without scroll timelines
// show each service with its own valley above it.
export default async function LeistungenIndex() {
  const { page, sections } = await getLeistungenContent();
  const { services, faq } = sections;

  return (
    <main>
      <PageHeader title={page?.title || "Leistungen"} lead={page?.lead} horizonKey="/leistungen" />

      {services.length > 0 ? (
        <div
          className={`page-container ${styles.valleys}`}
          style={{ "--count": services.length } as CSSProperties}
          data-cms-zone="leistungen"
        >
          <div aria-hidden="true" className={styles.stage}>
            <div className={styles.frame}>
              {services.map((service, i) => (
                <ValleyView
                  key={service.id ?? service.slug}
                  spec={VALLEYS[service.glyph] ?? VALLEYS.web}
                  id={`tal-${i}`}
                  className={styles.still}
                  // Each valley follows its own service's timeline (--s0 … --s4).
                  style={{ "--tl": `--s${i}` } as CSSProperties}
                  data-place={i === 0 ? "first" : i === services.length - 1 ? "last" : "between"}
                />
              ))}
            </div>
            <ol className={styles.rail}>
              {services.map((service, i) => (
                <li
                  key={service.id ?? service.slug}
                  style={{ "--tl": `--s${i}` } as CSSProperties}
                  data-place={i === 0 ? "first" : i === services.length - 1 ? "last" : "between"}
                >
                  <ServiceGlyph name={service.glyph} className="size-5 shrink-0" />
                  {service.short}
                </li>
              ))}
            </ol>
          </div>

          <ul aria-label="Leistungen" className={styles.list}>
            {services.map((service, i) => (
              <li
                key={service.id ?? service.slug}
                className={styles.service}
                style={{ "--tl": `--s${i}` } as CSSProperties}
              >
                <ValleyView
                  spec={VALLEYS[service.glyph] ?? VALLEYS.web}
                  id={`tal-inline-${i}`}
                  className={styles.inline}
                />
                <ServiceGlyph
                  name={service.glyph}
                  className="size-12 text-primary-soft sm:size-14 3xl:size-16"
                />
                <h2 className="mt-6 text-[clamp(2.25rem,1.6rem+2.4vw,4rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-balance hyphens-auto">
                  <Link
                    href={`/leistungen/${service.slug}` as never}
                    className="decoration-primary-soft decoration-2 underline-offset-8 hover:underline"
                  >
                    {service.title}
                  </Link>
                </h2>
                <p className="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl 3xl:text-2xl">
                  {service.text}
                </p>
                {service.examples?.length ? (
                  <ul aria-label="Zum Beispiel" className="mt-8 flex max-w-2xl flex-wrap gap-2.5">
                    {service.examples.map((example) => (
                      <li
                        key={example.id ?? example.text}
                        className="rounded-full border border-primary-soft/30 bg-secondary/60 px-4 py-1.5 text-base text-pretty"
                      >
                        {example.text}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <Link
                  href={`/leistungen/${service.slug}` as never}
                  className="group mt-10 inline-flex items-center gap-3 text-lg font-medium text-primary-soft"
                >
                  <span className="decoration-2 underline-offset-8 group-hover:underline">
                    {service.title} im Detail
                  </span>
                  <svg
                    viewBox="0 0 28 28"
                    aria-hidden="true"
                    className="size-5 fill-none stroke-current stroke-2 transition-transform duration-200 ease-out [stroke-linecap:round] [stroke-linejoin:round] group-hover:translate-x-1"
                  >
                    <path d="M5 14h17M16 8l6 6-6 6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Faq id="faq-titel" title="Häufige Fragen" items={faq} zone="fragen" />

      <ClosingCta />
    </main>
  );
}
